const fs = require("node:fs/promises");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const BASE = path.join(ROOT, "static", "2026_summer_kids");
const DATA_FILE = path.join(BASE, "data", "activities.json");
const DOCS_DIR = path.join(BASE, "docs");

const CITY_FILES = {
  "桃園": "taoyuan_summer_activities_2026.md",
  "台北": "taipei_summer_activities_2026.md",
  "新北": "new_taipei_summer_activities_2026.md",
};

const STATUS_LABELS = {
  ready: "已可安排",
  pending: "待公告",
};

function statusLabel(status) {
  return STATUS_LABELS[status] || status;
}

function sourceList(sources = []) {
  return sources.map((source) => `  - [${source.label}](${source.url})`).join("\n");
}

function cityTitle(city) {
  if (city === "桃園") return "2026 桃園市政府暑假活動整理";
  if (city === "台北") return "2026 台北市暑假活動整理";
  return "2026 新北市暑假活動整理";
}

function renderActivity(activity, index) {
  return `### ${index + 1}. ${activity.title}

- 目前狀態：${statusLabel(activity.status)}
- 活動時間：${activity.period}
- 報名方式：${activity.registration}
- 報名期限：${activity.deadline}
- 適合家長怎麼看：${activity.fit}
- 活動內容簡介：${activity.summary}
- 其他資訊：${activity.note}
- 官方來源：
${sourceList(activity.sources)}
`;
}

function renderCityDoc(city, activities, meta) {
  const ready = activities.filter((item) => item.status === "ready");
  const pending = activities.filter((item) => item.status === "pending");

  const rows = activities
    .map(
      (item) =>
        `| ${statusLabel(item.status)} | ${item.title} | ${item.registration} | ${item.deadline} | ${item.period} |`
    )
    .join("\n");

  return `# ${cityTitle(city)}

查核日期：${meta.updatedAt}

這份整理以「適合 ${meta.audience} 學生參加」為主，並改成較適合家長快速閱讀的版本。資料由 \`static/2026_summer_kids/data/activities.json\` 產生。

提醒：
- 目前資訊會由自動檢查流程協助追蹤官方來源。
- 若官方尚未公布報名方式或截止日，仍會保留「尚未公告」或「尚未查得」。
- 來源頁面若有大幅變動，請先查看 \`static/2026_summer_kids/docs/update-report.md\` 再決定是否調整活動欄位。

## 已可安排

${ready.length ? ready.map(renderActivity).join("\n") : "目前沒有已可安排項目。"}

## 待公告

${pending.length ? pending.map(renderActivity).join("\n") : "目前沒有待公告項目。"}

## 家長快速看

| 分類 | 活動 | 報名方式 | 報名期限 | 活動時間 |
| --- | --- | --- | --- | --- |
${rows}
`;
}

function renderOverview(payload) {
  const { meta, activities } = payload;
  const rows = activities
    .map(
      (item) =>
        `| ${item.city} | ${item.title} | ${item.period} | ${item.registration} | ${item.deadline} | ${statusLabel(item.status)} |`
    )
    .join("\n");

  const ready = activities.filter((item) => item.status === "ready");
  const pending = activities.filter((item) => item.status === "pending");

  return `# 2026 桃園市、台北市、新北市暑假活動總整理

查核日期：${meta.updatedAt}

這份整理把桃園市、台北市、新北市目前已查到的官方暑假活動資訊放在一起，方便家長一次比較「現在可安排什麼」以及「接下來該追哪一個官方頁面」。資料由 \`static/2026_summer_kids/data/activities.json\` 產生。

## 先看結論

- 目前共整理 ${activities.length} 筆活動。
- 已可安排：${ready.length} 筆。
- 待公告：${pending.length} 筆。
- 自動來源檢查結果請看 \`update-report.md\`。

## 三市快速總表

| 城市 | 活動 | 活動時間 | 報名方式 | 報名期限 | 目前狀態 |
| --- | --- | --- | --- | --- | --- |
${rows}

## 依家長需求推薦

### 1. 想找現在就能報、時間最明確的

${ready.map((item) => `- ${item.city}：${item.title}`).join("\n")}

### 2. 想找待公告但值得追蹤的

${pending.map((item) => `- ${item.city}：${item.title}`).join("\n")}

## 各城市詳細檔案

- [桃園市整理](./taoyuan_summer_activities_2026.md)
- [台北市整理](./taipei_summer_activities_2026.md)
- [新北市整理](./new_taipei_summer_activities_2026.md)
`;
}

async function main() {
  const payload = JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
  await fs.mkdir(DOCS_DIR, { recursive: true });

  for (const [city, filename] of Object.entries(CITY_FILES)) {
    const cityActivities = payload.activities.filter((item) => item.city === city);
    await fs.writeFile(path.join(DOCS_DIR, filename), renderCityDoc(city, cityActivities, payload.meta), "utf8");
  }

  await fs.writeFile(
    path.join(DOCS_DIR, "three_city_summer_activities_2026_overview.md"),
    renderOverview(payload),
    "utf8"
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { renderCityDoc, renderOverview };
