// Commute planner: 萬華 ⇄ 中央大學. Requires data.js (var TT) loaded first.
var CM = (function () {
  var P = {
    home: 26,      // 出門 → 萬華站上車
    xfer: 10,      // 板橋 台鐵⇄高鐵、桃園 高鐵⇄公車 轉乘
    ride: 20,      // 公車車程（173 中大⇄高鐵站、132/133 中壢⇄中大）
    zlWalk: 10,    // 中壢 火車站⇄公車站
    loop: { "132": 23, "133": 23, "133A": 24 } // 中壢發車 → 中大正門回程（ebus 預測值）
  };
  var HOURS = [];
  for (var h = 8; h <= 20; h++) HOURS.push(h * 60);

  function m(t) { var p = t.split(":"); return +p[0] * 60 + +p[1]; }
  function hm(x) { return String(Math.floor(x / 60)).padStart(2, "0") + ":" + String(x % 60).padStart(2, "0"); }
  function runs(days, wd) { return days.indexOf(String(wd)) >= 0; }
  function weekdayOnly(days) { return "12345".split("").every(function (d) { return days.indexOf(d) >= 0; }); }

  var BUS_TO_NCU = [].concat(
    TT.BUS.b132.weekday.map(function (t) { return [t, "132"]; }),
    TT.BUS.b133.weekday.map(function (t) { return [t, "133"]; })
  ).sort(function (a, b) { return m(a[0]) - m(b[0]); });
  var BUS_FROM_NCU_ZL = [].concat(
    TT.BUS.b132.weekday.map(function (t) { return [t, "132"]; }),
    TT.BUS.b133.weekday.map(function (t) { return [t, "133"]; }),
    TT.BUS.b133A.weekday.map(function (t) { return [t, "133A"]; })
  ).map(function (x) { return [hm(m(x[0]) + P.loop[x[1]]), x[1], x[0]]; })
   .sort(function (a, b) { return m(a[0]) - m(b[0]); });
  var BUS_FROM_NCU_HSR = [].concat(
    TT.BUS.b173_from.weekday.map(function (t) { return [t, "173"]; }),
    TT.BUS.b172_from.weekday.map(function (t) { return [t, "172"]; })
  ).sort(function (a, b) { return m(a[0]) - m(b[0]); });
  var HSR_S = TT.HSR_S.filter(function (r) { return weekdayOnly(r[3]); });
  var HSR_N = TT.HSR_N.filter(function (r) { return weekdayOnly(r[3]); });

  function first(rows, pred) { for (var i = 0; i < rows.length; i++) if (pred(rows[i])) return rows[i]; return null; }

  // Each route: candidates (first-leg departures) + fwd(candidate) → earliest-arrival chain.
  // plan(T) picks the latest start whose chain arrives by T.
  // Plan: {start, arrive, legs:[{mode, from, to, dep, arr, no, est}]}
  var ROUTES = {
    "out-hsr": {
      dir: "out", name: "去程・高鐵", sub: "萬華 → 板橋 → 高鐵桃園 → 173", startLabel: "出門", arriveLabel: "預估到校",
      cands: TT.TRA_S,
      fwd: function (t) {
        var h = first(HSR_S, function (r) { return m(r[0]) >= m(t[1]) + P.xfer; });
        if (!h) return null;
        var bus = first(TT.BUS.b173_to.weekday, function (x) { return m(x) >= m(h[1]) + P.xfer; });
        if (!bus) return null;
        return { start: m(t[0]) - P.home, arrive: m(bus) + P.ride, legs: [
          { mode: "tra", from: "萬華", to: "板橋", dep: t[0], arr: t[1], no: t[3] },
          { mode: "hsr", from: "板橋", to: "桃園", dep: h[0], arr: h[1], no: h[2] },
          { mode: "bus", from: "高鐵桃園站", to: "中大", dep: bus, arr: hm(m(bus) + P.ride), no: "173", est: "arr" }
        ] };
      }
    },
    "out-tra": {
      dir: "out", name: "去程・台鐵", sub: "萬華 → 中壢 → 132/133", startLabel: "出門", arriveLabel: "預估到校",
      cands: TT.TRA_S.filter(function (r) { return r[2]; }),
      fwd: function (t) {
        var bus = first(BUS_TO_NCU, function (x) { return m(x[0]) >= m(t[2]) + P.zlWalk; });
        if (!bus) return null;
        return { start: m(t[0]) - P.home, arrive: m(bus[0]) + P.ride, legs: [
          { mode: "tra", from: "萬華", to: "中壢", dep: t[0], arr: t[2], no: t[3] },
          { mode: "bus", from: "中壢", to: "中大", dep: bus[0], arr: hm(m(bus[0]) + P.ride), no: bus[1], est: "arr" }
        ] };
      }
    },
    "back-hsr": {
      dir: "back", name: "回程・高鐵", sub: "173/172 → 高鐵桃園 → 板橋 → 萬華", startLabel: "中大上車", arriveLabel: "抵達萬華",
      cands: BUS_FROM_NCU_HSR,
      fwd: function (bus) {
        var h = first(HSR_N, function (r) { return m(r[0]) >= m(bus[0]) + P.ride + P.xfer; });
        if (!h) return null;
        var t = first(TT.TRA_NB, function (r) { return m(r[0]) >= m(h[1]) + P.xfer; });
        if (!t) return null;
        return { start: m(bus[0]), arrive: m(t[1]), legs: [
          { mode: "bus", from: "中大警衛室", to: "高鐵桃園站", dep: bus[0], arr: hm(m(bus[0]) + P.ride), no: bus[1], est: "arr" },
          { mode: "hsr", from: "桃園", to: "板橋", dep: h[0], arr: h[1], no: h[2] },
          { mode: "tra", from: "板橋", to: "萬華", dep: t[0], arr: t[1], no: t[2] }
        ] };
      }
    },
    "back-tra": {
      dir: "back", name: "回程・台鐵", sub: "132/133 → 中壢 → 萬華", startLabel: "中大上車", arriveLabel: "抵達萬華",
      cands: BUS_FROM_NCU_ZL,
      fwd: function (bus) {
        var t = first(TT.TRA_NZ, function (r) { return m(r[0]) >= m(bus[0]) + P.ride + P.zlWalk; });
        if (!t) return null;
        return { start: m(bus[0]), arrive: m(t[2]), legs: [
          { mode: "bus", from: "中大正門", to: "中壢", dep: bus[0], arr: hm(m(bus[0]) + P.ride), no: bus[1], est: "dep", origin: bus[2] },
          { mode: "tra", from: "中壢", to: "萬華", dep: t[0], arr: t[2], no: t[3] }
        ] };
      }
    }
  };

  function best(key, T) {
    var r = ROUTES[key];
    for (var i = r.cands.length - 1; i >= 0; i--) {
      var p = r.fwd(r.cands[i]);
      if (p && p.arrive <= T) return p;
    }
    return null;
  }
  // Main plan plus backup: the best plan that arrives on an earlier final vehicle
  function plan(key, T) {
    var p = best(key, T);
    return { main: p, backup: p ? best(key, p.arrive - 1) : null };
  }

  // Table column headers per route (legs in order); back routes' first leg doubles as the start
  var COLS = {
    "out-hsr": ["台鐵 萬華→板橋", "高鐵 板橋→桃園", "173 高鐵站發"],
    "out-tra": ["台鐵 萬華→中壢", "公車 中壢發"],
    "back-hsr": ["中大上車（警衛室）", "高鐵 桃園→板橋", "台鐵 板橋→萬華"],
    "back-tra": ["中大上車（正門，估）", "台鐵 中壢→萬華"]
  };
  var SLACK_WARN = 45;

  function daysLabel(d) {
    return { "0123456": "", "123456": "週日停駛", "12345": "僅週一至五", "012345": "週六停駛",
             "01456": "僅週四至一", "46": "僅週四、六", "045": "僅週四、五、日" }[d] || d;
  }

  function table(key, el) {
    var r = ROUTES[key], back = r.dir === "back";
    var head = "<tr><th>" + (back ? "目標抵達萬華" : "目標到校") + "</th>" + (back ? "" : "<th>出門</th>") +
      COLS[key].map(function (c) { return "<th>" + c + "</th>"; }).join("") +
      "<th>" + r.arriveLabel + "</th><th>餘裕</th></tr>";
    var rows = HOURS.map(function (T) {
      var p = plan(key, T).main;
      var n = COLS[key].length + (back ? 3 : 4);
      if (!p) return '<tr class="na"><td class="target">' + hm(T) + '</td><td colspan="' + (n - 1) + '">這個時段之前沒有可銜接的班次</td></tr>';
      var slack = T - p.arrive;
      return '<tr' + (slack >= SLACK_WARN ? ' class="slack"' : '') + '><td class="target">' + hm(T) + "</td>" +
        (back ? "" : "<td>" + hm(p.start) + "</td>") +
        p.legs.map(function (l) { return "<td>" + legText(l) + "</td>"; }).join("") +
        "<td>約 " + hm(p.arrive) + "</td><td>" + (slack >= SLACK_WARN ? "早到 " + slack + " 分" : slack + " 分") + "</td></tr>";
    });
    el.innerHTML = "<thead>" + head + "</thead><tbody>" + rows.join("") + "</tbody>";
  }

  function legText(l) {
    var s = l.dep + " → " + l.arr;
    if (l.mode === "bus") s = l.no + "　" + l.dep + (l.est === "dep" ? "（估）" : "");
    return s;
  }

  return { P: P, HOURS: HOURS, ROUTES: ROUTES, plan: plan, m: m, hm: hm, runs: runs, legText: legText,
           table: table, daysLabel: daysLabel, SLACK_WARN: SLACK_WARN, BUS_FROM_NCU_ZL: BUS_FROM_NCU_ZL };
})();
