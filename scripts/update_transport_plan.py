#!/usr/bin/env python3
"""Weekly refresh of static/transport-plan/data.js from official timetables.

Sources: THSR timetable search, TRA timetable query, Taoyuan ebus GraphQL,
Taipei pda5284 route info (headways, change detection only).

A source that fails to fetch or fails its sanity check keeps its previous
data; the script then exits 1 so the workflow run is marked failed.
Stdlib only.
"""
import datetime as dt
import html
import http.cookiejar
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_JS = os.path.join(ROOT, "static", "transport-plan", "data.js")
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")
TZ = dt.timezone(dt.timedelta(hours=8))
TODAY = dt.datetime.now(TZ).date()

problems = []   # sanity/fetch failures (source kept at previous data)
notices = []    # changes that need a human (e.g. Taipei headways)


def request(url, data=None, headers=None, opener=None, encoding="utf-8"):
    h = {"User-Agent": UA, "Accept-Language": "zh-TW,zh;q=0.9"}
    h.update(headers or {})
    req = urllib.request.Request(url, data, h)
    for attempt in range(3):
        try:
            with (opener.open if opener else urllib.request.urlopen)(req, timeout=40) as r:
                return r.read().decode(encoding, errors="replace")
        except Exception:
            if attempt == 2:
                raise
            time.sleep(3 * (attempt + 1))


def hm_ok(t):
    return bool(re.fullmatch(r"\d\d:\d\d", t or ""))


# ---------------------------------------------------------------- THSR
def thsr_query(start, end, date):
    d = urllib.parse.urlencode(dict(
        SearchType="S", Lang="TW", StartStation=start, EndStation=end,
        OutWardSearchDate=date.strftime("%Y/%m/%d"), OutWardSearchTime="00:00",
        ReturnSearchDate=date.strftime("%Y/%m/%d"), ReturnSearchTime="00:00",
        DiscountType="")).encode()
    body = request("https://www.thsrc.com.tw/TimeTable/Search", d, {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"})
    items = json.loads(body)["data"]["DepartureTable"]["TrainItem"]
    return [(i["TrainNumber"], i["DepartureTime"], i["DestinationTime"]) for i in items]


def fetch_thsr():
    # Two full weeks starting next Monday; a train's days = weekdays it appears on.
    start = TODAY + dt.timedelta(days=7 - TODAY.weekday())
    dates = [start + dt.timedelta(days=k) for k in range(14)]
    out = {}
    for key, (a, b, t0, t1) in {"HSR_S": ("BanQiao", "TaoYuan", "06:00", "19:40"),
                                "HSR_N": ("TaoYuan", "BanQiao", "07:00", "20:30")}.items():
        trains = {}
        for d in dates:
            wd = str((d.weekday() + 1) % 7)  # 0=Sun
            for no, dep, arr in thsr_query(a, b, d):
                if not (t0 <= dep <= t1):
                    continue
                tr = trains.setdefault(no, {"days": set(), "times": {}, "n": 0})
                tr["days"].add(wd)
                tr["n"] += 1
                tr["times"].setdefault(wd, (dep, arr))
            time.sleep(0.5)
        rows = []
        for no, tr in trains.items():
            if tr["n"] < 3:  # holiday extras
                continue
            # Prefer a Wednesday's times (they shift by a minute on some dates)
            dep, arr = next(tr["times"][w] for w in "3245160" if w in tr["times"])
            rows.append([dep, arr, no, "".join(sorted(tr["days"]))])
        out[key] = sorted(rows)
    for key in out:
        n = len(out[key])
        full = sum(1 for r in out[key] if set("12345") <= set(r[3]))
        if not (30 <= n <= 80 and full >= 25) or not all(hm_ok(r[0]) and hm_ok(r[1]) for r in out[key]):
            raise ValueError(f"{key}: {n} trains, {full} weekday-daily")
    meta = f"{dates[0]}–{dates[-1]}"
    return out, meta


# ---------------------------------------------------------------- TRA
TRA_BASE = "https://tip.railway.gov.tw/tra-tip-web/tip/tip001/tip112/"
STN = {"萬華": "1010-萬華", "板橋": "1020-板橋", "中壢": "1100-中壢"}


def tra_opener():
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    form = request(TRA_BASE + "gobytime", opener=op)
    csrf = re.search(r'name="_csrf" value="([^"]+)"', form).group(1)
    return op, csrf


def tra_query(op, csrf, a, b, date):
    d = urllib.parse.urlencode(dict(
        _csrf=csrf, startStation=STN[a], endStation=STN[b], transfer="ONE",
        rideDate=date.strftime("%Y/%m/%d"), startOrEndTime="true",
        startTime="00:00", endTime="23:59", trainTypeList="ALL",
        queryClassification="NORMAL", query="查詢")).encode()
    page = request(TRA_BASE + "querybytime", d, {
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": TRA_BASE + "gobytime", "Origin": "https://tip.railway.gov.tw"}, opener=op)
    rows = []
    for seg in page.split('<tr class="trip-column">')[1:]:
        head = seg.split("detail-box")[0]
        m = re.search(r'trainNo=(\w+)"[^>]*>([^<]+)</a>', head)
        tds = re.findall(r"<td>(\d\d:\d\d)</td>", head)
        if not m or len(tds) < 2:
            continue
        typ, no = m.group(2).rsplit(" ", 1)
        rows.append({"no": no, "type": html.unescape(typ).strip(), "dep": tds[0], "arr": tds[1]})
    return rows


def fetch_tra():
    # A mid-week day at least 2 days out
    date = TODAY + dt.timedelta(days=2)
    while date.weekday() not in (1, 2, 3):
        date += dt.timedelta(days=1)
    op, csrf = tra_opener()
    q = {}
    for k, (a, b) in {"wb": ("萬華", "板橋"), "wz": ("萬華", "中壢"),
                      "zw": ("中壢", "萬華"), "bw": ("板橋", "萬華")}.items():
        q[k] = tra_query(op, csrf, a, b, date)
        time.sleep(1)
    wz = {r["no"]: r for r in q["wz"]}
    bw = {r["no"]: r for r in q["bw"]}
    south = [[r["dep"], r["arr"], wz[r["no"]]["arr"] if r["no"] in wz else None, r["no"], r["type"]]
             for r in q["wb"] if "05:50" <= r["dep"] <= "19:45"]
    # 板橋 column for 中壢→萬華 trains: departure time from the 板橋→萬華 query
    north_zl = [[r["dep"], bw[r["no"]]["dep"] if r["no"] in bw else None, r["arr"], r["no"], r["type"]]
                for r in q["zw"] if "07:00" <= r["dep"] <= "20:15"]
    north_bq = [[r["dep"], r["arr"], r["no"], r["type"]] for r in q["bw"] if "07:30" <= r["dep"] <= "20:30"]
    out = {"TRA_S": sorted(south), "TRA_NZ": sorted(north_zl, key=lambda r: r[0]), "TRA_NB": sorted(north_bq)}
    if not (len(south) >= 40 and len(north_zl) >= 30 and len(north_bq) >= 40
            and sum(1 for r in south if r[2]) >= 30):
        raise ValueError(f"TRA counts S{len(south)} NZ{len(north_zl)} NB{len(north_bq)}")
    return out, str(date)


# ---------------------------------------------------------------- Taoyuan buses
def ebus(xno, date):
    q = ('{ dailySchedule(xno:%d, date:"%s") { ... on DailyTimeTableConnection '
         '{ edges { node { goBack scheduleTime } } } } }') % (xno, date)
    body = request("https://ebus.tycg.gov.tw/ebus/graphql", json.dumps({"query": q}).encode(),
                   {"Content-Type": "application/json"})
    edges = (json.loads(body)["data"]["dailySchedule"] or {}).get("edges") or []
    res = {1: [], 2: []}
    for e in edges:
        res.setdefault(e["node"]["goBack"], []).append(e["node"]["scheduleTime"][:5])
    return {k: sorted(v) for k, v in res.items()}


def fetch_bus():
    # ebus only has schedules a few days ahead: pick the next Tue–Thu and the next Saturday.
    days = [TODAY + dt.timedelta(days=k) for k in range(0, 7)]
    weekday = next(d for d in days if d.weekday() in (1, 2, 3))
    holiday = next(d for d in days if d.weekday() == 5)
    # xno: 173=1730, 172=3221, 132=3220, 133=133, 133A=1331.
    # goBack 1 = 中大發 (173/172) or 中壢發 (132/133/133A); 2 = 高鐵站發.
    got = {str(d): {x: ebus(x, str(d)) for x in (1730, 3221, 3220, 133, 1331)} for d in (weekday, holiday)}
    W, H = got[str(weekday)], got[str(holiday)]
    bus = {
        "b173_to": {"weekday": W[1730][2], "holiday": H[1730][2]},
        "b173_from": {"weekday": W[1730][1], "holiday": H[1730][1]},
        "b172_to": {"weekday": W[3221][2], "holiday": H[3221][2]},
        "b172_from": {"weekday": W[3221][1], "holiday": H[3221][1]},
        "b132": {"weekday": W[3220][1], "holiday": H[3220][1]},
        "b133": {"weekday": W[133][1], "holiday": H[133][1]},
        "b133A": {"weekday": W[1331][1], "holiday": H[1331][1]},
    }
    if not (len(bus["b173_from"]["weekday"]) >= 3 and len(bus["b173_to"]["weekday"]) >= 3
            and len(bus["b132"]["weekday"]) >= 8 and len(bus["b133"]["weekday"]) >= 4):
        raise ValueError("bus weekday lists too short: " + json.dumps({k: len(v["weekday"]) for k, v in bus.items()}))
    if bus["b173_from"]["weekday"] == bus["b173_from"]["holiday"]:
        raise ValueError(f"{weekday} looks like a holiday schedule")
    return bus, f"平日 {weekday}、假日 {holiday}"


# ---------------------------------------------------------------- Taipei headways (detect only)
def fetch_city():
    out = {}
    for name, rid in (("重慶幹線", 11881), ("62", 11244)):
        page = request(f"https://pda5284.gov.taipei/MQS/routeinfo.jsp?rid={rid}", encoding="utf-8")
        text = html.unescape(re.sub(r"<[^>]+>", "\n", re.sub(r"<script.*?</script>", "", page, flags=re.S)))
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        m = [i for i, l in enumerate(lines) if "頭末班" in l or "首末班" in l]
        if not m:
            raise ValueError(f"{name}: headway block not found")
        block = []
        for l in lines[m[0] + 1:]:
            if "分段" in l or "票價" in l:
                break
            block.append(l)
        out[name] = " ".join(block)
    return out


# ---------------------------------------------------------------- main
def load_previous():
    with open(DATA_JS, encoding="utf-8") as f:
        src = f.read()
    return json.loads(src[src.index("{"):src.rindex("}") + 1])


def main():
    prev = load_previous()
    tt = {k: prev[k] for k in ("HSR_S", "HSR_N", "TRA_S", "TRA_NZ", "TRA_NB", "BUS")}
    meta = dict(prev.get("meta") or {})

    def run(name, fn, apply):
        try:
            data, info = fn()
            apply(data)
            meta[name] = info
            print(f"[ok] {name}: {info}")
        except Exception as e:
            problems.append(f"{name}: {e}")
            print(f"[FAIL] {name}: {e} (kept previous data)")

    run("thsr", fetch_thsr, tt.update)
    run("tra", fetch_tra, tt.update)
    run("bus", fetch_bus, lambda b: tt.__setitem__("BUS", b))
    try:
        city = fetch_city()
        old = meta.get("city")
        if old and old != city:
            notices.append("臺北公車班距文字有變動，請檢查 commute.js 的 hw()：\n"
                           + json.dumps({"old": old, "new": city}, ensure_ascii=False, indent=1))
        meta["city"] = city
        print("[ok] city:", city)
    except Exception as e:
        problems.append(f"city: {e}")

    data_changed = any(tt[k] != prev[k] for k in tt)
    if data_changed or "updated" not in meta:
        meta["updated"] = str(TODAY)
    if not problems:  # every source fetched and passed its checks
        meta["checked"] = str(TODAY)
    if data_changed or meta != (prev.get("meta") or {}):
        tt["meta"] = meta
        js = ("// Generated by scripts/update_transport_plan.py from official timetables.\n"
              "// HSR days: digits = weekdays the train runs (0=Sun). TRA rows all run daily.\n"
              "var TT = " + json.dumps(tt, ensure_ascii=False, separators=(",", ":")).replace("],[", "],\n[") + ";\n")
        with open(DATA_JS, "w", encoding="utf-8", newline="\n") as f:
            f.write(js)
    for k in tt:
        if k != "meta" and tt[k] != prev.get(k):
            print(f"[changed] {k}")

    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    report = "\n".join(["## transport-plan 時刻表檢查", f"- 資料{'有更新' if data_changed else '無變動'}"]
                       + [f"- 失敗：{p}" for p in problems] + [f"- 注意：{n}" for n in notices])
    print(report)
    if summary:
        with open(summary, "a", encoding="utf-8") as f:
            f.write(report + "\n")
    # Fail the run (GitHub emails the owner) when something needs a human
    return 1 if problems or notices else 0


if __name__ == "__main__":
    sys.exit(main())
