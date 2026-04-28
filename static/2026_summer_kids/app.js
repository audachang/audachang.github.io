const DATA_URL = "./data/activities.json";

let activities = [];
let dataMeta = {};

const cityOptions = [
  { value: "all", label: "全部城市" },
  { value: "桃園", label: "桃園" },
  { value: "台北", label: "台北" },
  { value: "新北", label: "新北" },
];

const statusOptions = [
  { value: "all", label: "全部狀態" },
  { value: "ready", label: "已可安排" },
  { value: "pending", label: "待公告" },
];

const state = {
  city: "all",
  status: "all",
};

const cityFilters = document.getElementById("city-filters");
const statusFilters = document.getElementById("status-filters");
const activityList = document.getElementById("activity-list");
const metrics = document.getElementById("metrics");
const lastChecked = document.getElementById("last-checked");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createButton(option, group) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "filter-button";
  button.textContent = option.label;
  button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", () => {
    state[group] = option.value;
    render();
  });
  return button;
}

function renderButtons(container, options, group) {
  container.innerHTML = "";
  options.forEach((option) => {
    const button = createButton(option, group);
    const active = state[group] === option.value;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
    container.appendChild(button);
  });
}

function getFilteredActivities() {
  return activities.filter((item) => {
    const cityMatch = state.city === "all" || item.city === state.city;
    const statusMatch = state.status === "all" || item.status === state.status;
    return cityMatch && statusMatch;
  });
}

function renderMetrics(filtered) {
  const ready = activities.filter((item) => item.status === "ready").length;
  const pending = activities.filter((item) => item.status === "pending").length;
  const visibleReady = filtered.filter((item) => item.status === "ready").length;
  const visiblePending = filtered.filter((item) => item.status === "pending").length;

  metrics.innerHTML = `
    <h2>目前畫面</h2>
    <div class="metric-grid">
      <div class="metric-card">
        <strong>${filtered.length}</strong>
        <span>目前顯示活動</span>
      </div>
      <div class="metric-card">
        <strong>${new Set(activities.map((item) => item.city)).size}</strong>
        <span>涵蓋城市</span>
      </div>
      <div class="metric-card">
        <strong>${visibleReady}</strong>
        <span>畫面中的已可安排</span>
      </div>
      <div class="metric-card">
        <strong>${visiblePending}</strong>
        <span>畫面中的待公告</span>
      </div>
    </div>
    <p class="activity-summary" style="margin-top:12px;">
      全部資料共 ${activities.length} 筆，其中已可安排 ${ready} 筆、待公告 ${pending} 筆。
    </p>
  `;
}

function renderCard(item) {
  const article = document.createElement("article");
  article.className = "activity-card";

  const sources = (item.sources || [])
    .map(
      (source) =>
        `<a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.label)}</a>`
    )
    .join("");

  article.innerHTML = `
    <div class="activity-header">
      <span class="city-pill">${escapeHtml(item.city)}</span>
      <span class="status-pill ${escapeHtml(item.status)}">
        ${item.status === "ready" ? "已可安排" : "待公告"}
      </span>
    </div>
    <h2 class="activity-title">${escapeHtml(item.title)}</h2>
    <p class="activity-summary">${escapeHtml(item.summary)}</p>
    <div class="meta-grid">
      <div class="meta-item">
        <span class="meta-label">活動時間</span>
        <span class="meta-value">${escapeHtml(item.period)}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">報名方式</span>
        <span class="meta-value">${escapeHtml(item.registration)}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">報名期限</span>
        <span class="meta-value">${escapeHtml(item.deadline)}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">適合怎麼安排</span>
        <span class="meta-value">${escapeHtml(item.fit)}</span>
      </div>
    </div>
    <div class="note-block">${escapeHtml(item.note)}</div>
    <div class="source-list">${sources}</div>
  `;

  return article;
}

function renderActivities(filtered) {
  activityList.innerHTML = "";

  if (!filtered.length) {
    activityList.innerHTML = `
      <div class="empty-state">
        目前篩選條件下沒有活動。可以試著切回「全部城市」或「全部狀態」看看。
      </div>
    `;
    return;
  }

  filtered.forEach((item) => {
    activityList.appendChild(renderCard(item));
  });
}

function render() {
  const filtered = getFilteredActivities();
  renderButtons(cityFilters, cityOptions, "city");
  renderButtons(statusFilters, statusOptions, "status");
  renderMetrics(filtered);
  renderActivities(filtered);
}

function renderLoadError(error) {
  metrics.innerHTML = "<h2>資料狀態</h2><p class=\"activity-summary\">資料暫時無法讀取。</p>";
  activityList.innerHTML = `
    <div class="empty-state">
      無法載入活動資料。若是在本機直接開啟 HTML，請改用本機伺服器或發布到 GitHub Pages 後查看。
      <br />
      <small>${escapeHtml(error.message)}</small>
    </div>
  `;
}

async function init() {
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json();
    dataMeta = payload.meta || {};
    activities = payload.activities || [];

    if (lastChecked && dataMeta.updatedAt) {
      lastChecked.textContent = `查核日期：${dataMeta.updatedAt}`;
    }

    render();
  } catch (error) {
    renderLoadError(error);
  }
}

init();
