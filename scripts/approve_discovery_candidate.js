const fs = require("node:fs/promises");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const BASE = path.join(ROOT, "static", "2026_summer_kids");
const DATA_DIR = path.join(BASE, "data");
const ACTIVITIES_FILE = path.join(DATA_DIR, "activities.json");
const CANDIDATES_FILE = path.join(DATA_DIR, "discovery-candidates.json");

function todayInTaipei() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function cityPrefix(city) {
  if (city === "桃園") return "taoyuan";
  if (city === "台北") return "taipei";
  return "new-taipei";
}

function nextActivityId(activities, city) {
  const prefix = cityPrefix(city);
  const nums = activities
    .map((item) => item.id || "")
    .filter((id) => id.startsWith(`${prefix}-`))
    .map((id) => Number(id.slice(prefix.length + 1)))
    .filter(Number.isFinite);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${String(next).padStart(2, "0")}`;
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

function toActivity(candidate, activities) {
  return {
    id: nextActivityId(activities, candidate.city),
    lastChecked: todayInTaipei(),
    city: candidate.city,
    status: "pending",
    title: candidate.title,
    summary: candidate.description || "自動發現的新活動候選，內容摘要待人工補充。",
    period: candidate.dateSnippets?.length ? `疑似日期：${candidate.dateSnippets.join("、")}` : "待人工確認",
    registration: "待人工確認",
    deadline: "待人工確認",
    fit: "待人工確認適合年齡與安排方式。",
    note: "這筆活動由 discovery workflow 發現，正式發布前建議人工確認活動時間、報名方式、年齡限制與截止日。",
    sources: [
      {
        label: candidate.sourceTitle || "官方來源",
        url: candidate.url,
      },
    ],
  };
}

function runDocGenerator() {
  const result = spawnSync(process.execPath, [path.join(__dirname, "generate_summer_kids_docs.js")], {
    cwd: ROOT,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error("Markdown generation failed");
  }
}

async function main() {
  const candidateId = process.argv[2];
  if (!candidateId) {
    throw new Error("Usage: node scripts/approve_discovery_candidate.js <candidate-id>");
  }

  const activitiesPayload = await readJson(ACTIVITIES_FILE);
  const candidatesPayload = await readJson(CANDIDATES_FILE);
  const index = candidatesPayload.candidates.findIndex((item) => item.id === candidateId);

  if (index === -1) {
    throw new Error(`Candidate not found: ${candidateId}`);
  }

  const [candidate] = candidatesPayload.candidates.splice(index, 1);
  const activity = toActivity(candidate, activitiesPayload.activities);
  activitiesPayload.activities.push(activity);
  activitiesPayload.meta.updatedAt = todayInTaipei();
  candidatesPayload.meta.updatedAt = todayInTaipei();
  candidatesPayload.meta.lastMessage = `Approved ${candidateId} into ${activity.id}.`;

  await fs.writeFile(ACTIVITIES_FILE, `${JSON.stringify(activitiesPayload, null, 2)}\n`, "utf8");
  await fs.writeFile(CANDIDATES_FILE, `${JSON.stringify(candidatesPayload, null, 2)}\n`, "utf8");
  runDocGenerator();

  console.log(`Approved ${candidateId} as ${activity.id}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
