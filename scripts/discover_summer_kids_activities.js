const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const ROOT = path.resolve(__dirname, "..");
const BASE = path.join(ROOT, "static", "2026_summer_kids");
const DATA_DIR = path.join(BASE, "data");
const DOCS_DIR = path.join(BASE, "docs");
const ACTIVITIES_FILE = path.join(DATA_DIR, "activities.json");
const CANDIDATES_FILE = path.join(DATA_DIR, "discovery-candidates.json");
const REPORT_FILE = path.join(DOCS_DIR, "discovery-report.md");

const DEFAULT_TOKEN_FILE = path.resolve(ROOT, "..", ".braveapi_token");
const BRAVE_ENDPOINT = "https://api.search.brave.com/res/v1/web/search";

const SEARCH_QUERIES = [
  {
    city: "桃園",
    query: "2026 桃園 暑假 兒童 活動 site:tycg.gov.tw",
  },
  {
    city: "桃園",
    query: "2026 桃園 兒童藝術節 site:culture.tycg.gov.tw",
  },
  {
    city: "桃園",
    query: "2026 桃園 暑期 圖書館 兒童 活動 site:typl.gov.tw",
  },
  {
    city: "桃園",
    query: "2026 桃園 暑期 營隊 國小 site:tycg.gov.tw",
  },
  {
    city: "台北",
    query: "2026 台北 暑假 兒童 活動 site:gov.taipei",
  },
  {
    city: "台北",
    query: "2026 台北 兒童藝術節 site:travel.taipei",
  },
  {
    city: "台北",
    query: "2026 台北 暑期 閱讀 兒童 site:tpml.gov.taipei",
  },
  {
    city: "台北",
    query: "2026 台北 國小 暑期 營隊 site:tp.edu.tw",
  },
  {
    city: "台北",
    query: "2026 台北 暑期 體驗 學習營 site:doe.gov.taipei",
  },
  {
    city: "新北",
    query: "2026 新北 暑假 兒童 活動 site:ntpc.gov.tw",
  },
  {
    city: "新北",
    query: "2026 新北 兒童藝術節 site:culture.ntpc.gov.tw",
  },
  {
    city: "新北",
    query: "2026 新北 圖書館 暑期 活動 site:library.ntpc.gov.tw",
  },
  {
    city: "新北",
    query: "2026 新北 暑期 兒童 活動 site:atpass.ntpclib.gov.tw",
  },
];

const OFFICIAL_HOST_PATTERNS = [
  /(^|\.)tycg\.gov\.tw$/i,
  /(^|\.)typl\.gov\.tw$/i,
  /(^|\.)gov\.taipei$/i,
  /(^|\.)travel\.taipei$/i,
  /(^|\.)tp\.edu\.tw$/i,
  /(^|\.)tpml\.gov\.taipei$/i,
  /(^|\.)ntpc\.gov\.tw$/i,
  /(^|\.)ntpclib\.gov\.tw$/i,
  /(^|\.)library\.ntpc\.gov\.tw$/i,
];

const KEEP_TERMS = ["2026", "暑假", "暑期", "兒童", "國小", "營隊", "藝術節", "圖書館", "活動"];
const YEAR_TERM = "2026";
const SUMMER_TERMS = ["暑假", "暑期", "夏令營", "營隊", "兒童藝術節", "閱讀", "童演童語"];
const CHILD_TERMS = ["兒童", "國小", "親子", "學童", "孩子", "小朋友", "圖書館"];
const GENERIC_TITLE_TERMS = [
  "熱門活動",
  "節慶與活動",
  "特色公園遊",
  "參觀資訊",
  "當期展覽",
  "活動訊息",
  "最新消息",
  "首頁",
  "Home Page",
  "Typl",
  "新北市立圖書館",
  "臺北市立圖書館閱讀網",
];
const DATE_PATTERN =
  /(?:20\d{2}[./-]\d{1,2}[./-]\d{1,2}|20\d{2}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日|\d{1,2}\s*月\s*\d{1,2}\s*日|\d{1,2}\/\d{1,2})/g;

function todayInTaipei() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function candidateId(city, url) {
  const digest = crypto.createHash("sha256").update(`${city}:${normalizeUrl(url)}`).digest("hex").slice(0, 10);
  const prefix = city === "桃園" ? "taoyuan" : city === "台北" ? "taipei" : "new-taipei";
  return `candidate-${prefix}-${digest}`;
}

function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.searchParams.sort();
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url.trim();
  }
}

function isOfficialUrl(url) {
  try {
    const host = new URL(url).hostname;
    return OFFICIAL_HOST_PATTERNS.some((pattern) => pattern.test(host));
  } catch {
    return false;
  }
}

function textLooksRelevant(...parts) {
  const text = parts.join(" ");
  const hasCurrentYear = text.includes(YEAR_TERM);
  const hasSummerTerm = SUMMER_TERMS.some((term) => text.includes(term));
  const hasChildTerm = CHILD_TERMS.some((term) => text.includes(term));
  return hasCurrentYear && hasSummerTerm && hasChildTerm;
}

function isLikelyGenericResult(title, description) {
  const titleText = title || "";
  const descriptionText = description || "";
  const titleIsGeneric = GENERIC_TITLE_TERMS.some((term) => titleText.includes(term));
  const titleIsOnlyGeneric = GENERIC_TITLE_TERMS.some((term) => titleText.trim() === term);
  const descriptionIsSpecific = SUMMER_TERMS.some((term) => descriptionText.includes(term)) && descriptionText.includes(YEAR_TERM);
  return titleIsOnlyGeneric || (titleIsGeneric && !descriptionIsSpecific);
}

function isOldYearResult(title, description, url) {
  const text = `${title || ""} ${description || ""} ${url || ""}`;
  if (/202[0-5]/.test(title || "")) return true;
  const oldYear = text.match(/202[0-5]/);
  return Boolean(oldYear && !text.includes(YEAR_TERM));
}

function isLikelyIndexUrl(url) {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.replace(/\/+$/, "");
    if (!pathname || pathname === "/zh-tw") return true;
    if (pathname.startsWith("/;jsessionid=")) return true;
    if (/\/mp\.asp$/i.test(pathname)) return true;
    if (/ActiveMonthList\.aspx$/i.test(pathname)) return true;
    if (/\/event\/calendar\/?\d*$/i.test(pathname)) return true;
    return false;
  } catch {
    return false;
  }
}

function normalizeText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function dateSnippets(text) {
  return Array.from(new Set(text.match(DATE_PATTERN) || [])).slice(0, 16);
}

async function readToken() {
  if (process.env.BRAVE_SEARCH_API_KEY) return cleanToken(process.env.BRAVE_SEARCH_API_KEY);
  if (process.env.BRAVE_API_TOKEN) return cleanToken(process.env.BRAVE_API_TOKEN);

  const tokenFile = process.env.BRAVE_SEARCH_API_TOKEN_FILE || DEFAULT_TOKEN_FILE;
  try {
    return cleanToken(await fs.readFile(tokenFile, "utf8"));
  } catch {
    return "";
  }
}

function cleanToken(raw) {
  const line = String(raw)
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) => item && !item.startsWith("#"));

  if (!line) return "";

  const envMatch = line.match(
    /^(BRAVE[\s_-]*SEARCH[\s_-]*API(?:[\s_-]*KEY)?|BRAVE[\s_-]*API[\s_-]*(?:TOKEN|KEY)|BRAVEAPI_TOKEN|X_SUBSCRIPTION_TOKEN|TOKEN|API_KEY|BRAVE_TOKEN|BRAVE)\s*=\s*(.+)$/i
  );
  const value = envMatch ? envMatch[2].trim() : line;
  return value.replace(/^["']|["']$/g, "");
}

async function braveSearch(token, query) {
  const url = new URL(BRAVE_ENDPOINT);
  url.searchParams.set("q", query);
  url.searchParams.set("count", "10");
  url.searchParams.set("country", "TW");
  url.searchParams.set("search_lang", "zh-hant");
  url.searchParams.set("ui_lang", "zh-TW");
  url.searchParams.set("safesearch", "moderate");

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "x-subscription-token": token,
    },
  });

  if (!response.ok) {
    let message = `Brave Search HTTP ${response.status}`;
    try {
      const body = await response.json();
      const code = body.error?.code;
      const detail = body.error?.detail;
      message = [message, code, detail].filter(Boolean).join(": ");
    } catch {
      // Keep the status-only message when the body is not JSON.
    }
    throw new Error(message);
  }

  return response.json();
}

async function fetchPageSignals(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "summer-kids-discovery/1.0 (+https://audachang.github.io/)",
      },
    });
    const html = await response.text();
    const text = normalizeText(html);
    return {
      ok: response.ok,
      status: response.status,
      dateSnippets: dateSnippets(text),
      contentHash: crypto.createHash("sha256").update(text).digest("hex").slice(0, 16),
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      dateSnippets: [],
      contentHash: null,
      error: error.name === "AbortError" ? "timeout" : error.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

function buildKnownUrls(activities, candidates) {
  const urls = new Set();

  for (const activity of activities) {
    for (const source of activity.sources || []) {
      urls.add(normalizeUrl(source.url));
    }
  }

  for (const candidate of candidates) {
    urls.add(normalizeUrl(candidate.url));
  }

  return urls;
}

function renderReport({ checkedAt, queryReports, newCandidates, duplicateCount, skippedReason }) {
  const lines = [
    "# Summer Kids Discovery Report",
    "",
    `Checked at: ${checkedAt}`,
    "",
    "This report is generated by `scripts/discover_summer_kids_activities.js`.",
    "New findings are written to `static/2026_summer_kids/data/discovery-candidates.json` for review before publication.",
    "",
  ];

  if (skippedReason) {
    lines.push("## Skipped");
    lines.push("");
    lines.push(skippedReason);
    lines.push("");
    return `${lines.join("\n")}\n`;
  }

  lines.push("## Summary");
  lines.push("");
  lines.push(`- Queries run: ${queryReports.length}`);
  lines.push(`- New candidates: ${newCandidates.length}`);
  lines.push(`- Duplicates already known: ${duplicateCount}`);
  lines.push("");

  lines.push("## New Candidates");
  lines.push("");
  if (!newCandidates.length) {
    lines.push("No new candidates found.");
  } else {
    for (const candidate of newCandidates) {
      lines.push(`### ${candidate.city}｜${candidate.title}`);
      lines.push("");
      lines.push(`- Candidate ID: ${candidate.id}`);
      lines.push(`- URL: ${candidate.url}`);
      lines.push(`- Source title: ${candidate.sourceTitle || "n/a"}`);
      lines.push(`- Date-like snippets: ${candidate.dateSnippets.length ? candidate.dateSnippets.join(", ") : "n/a"}`);
      lines.push(`- Reason: ${candidate.reason}`);
      lines.push("");
    }
  }

  lines.push("");
  lines.push("## Query Log");
  lines.push("");
  for (const item of queryReports) {
    lines.push(`### ${item.city}`);
    lines.push("");
    lines.push(`- Query: ${item.query}`);
    lines.push(`- Results returned: ${item.resultCount}`);
    lines.push(`- Accepted new candidates: ${item.accepted}`);
    if (item.error) lines.push(`- Error: ${item.error}`);
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

async function main() {
  const checkedAt = todayInTaipei();
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(DOCS_DIR, { recursive: true });

  const token = await readToken();
  const activitiesPayload = await readJson(ACTIVITIES_FILE, { activities: [] });
  const candidatesPayload = await readJson(CANDIDATES_FILE, { meta: {}, candidates: [] });

  if (!token) {
    candidatesPayload.meta = {
      ...candidatesPayload.meta,
      updatedAt: checkedAt,
      status: "skipped",
      lastMessage: "Missing Brave Search API token.",
    };
    await fs.writeFile(CANDIDATES_FILE, `${JSON.stringify(candidatesPayload, null, 2)}\n`, "utf8");
    await fs.writeFile(
      REPORT_FILE,
      renderReport({
        checkedAt,
        queryReports: [],
        newCandidates: [],
        duplicateCount: 0,
        skippedReason:
          "Missing Brave Search API token. Set `BRAVE_SEARCH_API_KEY` in GitHub Actions secrets, or put the token in the local file specified by `BRAVE_SEARCH_API_TOKEN_FILE`.",
      }),
      "utf8"
    );
    return;
  }

  const knownUrls = buildKnownUrls(activitiesPayload.activities || [], candidatesPayload.candidates || []);
  const queryReports = [];
  const newCandidates = [];
  let duplicateCount = 0;

  for (const item of SEARCH_QUERIES) {
    const report = {
      city: item.city,
      query: item.query,
      resultCount: 0,
      accepted: 0,
      error: null,
    };

    try {
      const searchData = await braveSearch(token, item.query);
      const results = searchData.web?.results || [];
      report.resultCount = results.length;

      for (const result of results) {
        const url = normalizeUrl(result.url || "");
        if (!url || knownUrls.has(url)) {
          duplicateCount += url ? 1 : 0;
          continue;
        }
        if (!isOfficialUrl(url)) continue;
        if (isOldYearResult(result.title, result.description, url)) continue;
        if (isLikelyGenericResult(result.title, result.description)) continue;
        if (isLikelyIndexUrl(url)) continue;
        if (!textLooksRelevant(result.title || "", result.description || "")) continue;

        const pageSignals = await fetchPageSignals(url);
        const candidate = {
          id: candidateId(item.city, url),
          city: item.city,
          status: "candidate",
          title: normalizeText(result.title || "").slice(0, 140),
          url,
          sourceTitle: normalizeText(result.profile?.name || result.meta_url?.hostname || ""),
          description: normalizeText(result.description || "").slice(0, 500),
          dateSnippets: Array.from(
            new Set([...dateSnippets(`${result.title || ""} ${result.description || ""}`), ...pageSignals.dateSnippets])
          ).slice(0, 16),
          reason: "Brave Search result matched official domain and summer/kids activity keywords.",
          discoveredAt: checkedAt,
          pageCheck: pageSignals,
        };

        knownUrls.add(url);
        newCandidates.push(candidate);
        report.accepted += 1;
      }
    } catch (error) {
      report.error = error.message;
    }

    queryReports.push(report);
  }

  candidatesPayload.meta = {
    ...candidatesPayload.meta,
    updatedAt: checkedAt,
    status: "checked",
    lastMessage: `${newCandidates.length} new candidate(s) discovered.`,
  };
  candidatesPayload.candidates = [...(candidatesPayload.candidates || []), ...newCandidates];

  await fs.writeFile(CANDIDATES_FILE, `${JSON.stringify(candidatesPayload, null, 2)}\n`, "utf8");
  await fs.writeFile(REPORT_FILE, renderReport({ checkedAt, queryReports, newCandidates, duplicateCount }), "utf8");
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
