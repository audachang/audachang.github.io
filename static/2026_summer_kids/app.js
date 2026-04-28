const activities = [
  {
    city: "桃園",
    status: "ready",
    title: "蘆竹區婦幼館暑期育樂營",
    summary:
      "偏課程型的暑期育樂活動，內容涵蓋手作、益智、美術、律動與書寫，適合想替孩子安排固定課程的家長。",
    period: "2026-07-01 至 2026-08-26",
    registration: "網路報名",
    deadline: "2026-05-15 08:00 至 2026-05-29 16:00",
    fit: "現在資訊最完整，適合先卡位。",
    note: "每班預計招收 20 人，額滿為止。",
    sources: [
      {
        label: "蘆竹區公所公告",
        url: "https://www.luzhu.tycg.gov.tw/News_Content.aspx?n=5714&s=1617511",
      },
    ],
  },
  {
    city: "桃園",
    status: "ready",
    title: "桃園市立圖書館「童演童語」大型兒童劇",
    summary:
      "適合排成半日親子出遊，通常結合闖關、兒童劇與摸彩。比課程型活動更有節慶感，也較好搭配其他行程。",
    period: "暑假場次：2026-07-25、2026-08-01",
    registration: "一般場自由入場；特別活動線上報名",
    deadline: "7/25 場至 2026-07-24 17:00；8/1 場至 2026-07-30 17:00",
    fit: "適合想找免費、單次活動的家長。",
    note: "活動費用免費，地點分別在大園國小與龜山中山天幕廣場。",
    sources: [
      {
        label: "桃園市立圖書館活動頁",
        url: "https://www.typl.gov.tw/zh-tw/Activity/Content/9501",
      },
    ],
  },
  {
    city: "桃園",
    status: "ready",
    title: "桃園市立圖書館「童演童語」小型兒童劇",
    summary:
      "偏室內、時間固定、好掌握的單場活動，適合不想跑太遠、希望孩子專心看表演的家庭。",
    period: "暑假場次：2026-07-19、2026-08-22",
    registration: "線上索票",
    deadline: "7/19 場至 2026-07-17 17:00；8/22 場至 2026-08-20 17:00",
    fit: "適合喜歡室內活動的孩子。",
    note: "地點在桃園市立圖書館總館 1 樓微光廳。",
    sources: [
      {
        label: "桃園市立圖書館活動頁",
        url: "https://www.typl.gov.tw/kids/Activity/Content/9548",
      },
    ],
  },
  {
    city: "桃園",
    status: "pending",
    title: "2026 桃園兒童藝術節",
    summary:
      "桃園暑假的大型親子藝文活動，目前已能確認會辦，但各場次與報名辦法還沒有完全公布。",
    period: "目前可見起始日為 2026-06-21",
    registration: "尚未公告",
    deadline: "尚未公告",
    fit: "適合等大型重點活動的家庭。",
    note: "文化局介紹頁顯示歷年常見為舞台演出、小型展演與兒童藝術市集。",
    sources: [
      {
        label: "文化局介紹",
        url: "https://culture.tycg.gov.tw/News_Photo_Content.aspx?n=23556&s=1566353",
      },
      {
        label: "桃園市觀光行事曆",
        url: "https://www.tycg.gov.tw/NewsPage_Content.aspx?n=16786&s=1601961",
      },
    ],
  },
  {
    city: "台北",
    status: "ready",
    title: "2026 臺北兒童藝術節",
    summary:
      "台北市最值得優先關注的大型暑假親子藝文活動之一，活動期間與票務入口都已出現，現在就能先排進暑假行事曆。",
    period: "2026-06-28 至 2026-08-02",
    registration: "免費場依單一活動公告；售票場透過 OPENTIX",
    deadline: "目前可確認套票銷售期為 2026-05-11 12:00 至 2026-06-07 23:59",
    fit: "適合安排 1 至 2 次暑假重點藝文行程。",
    note: "場地涵蓋北藝中心、剝皮寮、大安森林公園等；部分單檔節目已可查到 7 月演出檔期。",
    sources: [
      {
        label: "臺北旅遊網總覽",
        url: "https://www.travel.taipei/zh-tw/event-calendar/details/66374",
      },
      {
        label: "OPENTIX 套票",
        url: "https://www.opentix.life/ticketpackage/2046503607896674305",
      },
      {
        label: "北藝中心節目頁",
        url: "https://tpac.org.taipei/program/1422",
      },
    ],
  },
  {
    city: "台北",
    status: "pending",
    title: "臺北市國民小學暑期體驗學習營",
    summary:
      "若家長想找的是正式營隊課程，而不是單場出遊，這通常是台北市最實用的官方入口，往年會有很多適合國小中高年級的學校營隊。",
    period: "暑假期間；2026 細節待公告",
    registration: "官方平台網路報名",
    deadline: "2026 尚未公告",
    fit: "很適合想找生態、藝文、運動或手作營隊的家庭。",
    note: "截至 2026-04-28，holiday.tp.edu.tw 顯示「近期開放報名」。2025 年曾於 2025-05-13 至 2025-05-19 開放第一階段報名，僅供抓時間參考。",
    sources: [
      {
        label: "暑期體驗營平台",
        url: "https://holiday.tp.edu.tw/",
      },
      {
        label: "2025 教育局公告（參考）",
        url: "https://www.doe.gov.taipei/News_Content.aspx?n=CFF17D5B0DE104FB&s=8FDC95537988C9DF",
      },
    ],
  },
  {
    city: "台北",
    status: "pending",
    title: "臺北市立圖書館暑期閱讀活動",
    summary:
      "如果偏好免費、室內、時間較好掌握的活動，北市圖的暑期閱讀活動很值得追蹤，但 2026 年正式內容還沒上架。",
    period: "暑假期間；2026 細節待公告",
    registration: "尚未公告",
    deadline: "尚未公告",
    fit: "適合希望安排閱讀、講座、故事活動的家庭。",
    note: "目前可查到的是歷年暑期閱讀活動專區，表示這是固定系列，但今年內容尚未公布。",
    sources: [
      {
        label: "北市圖暑期閱讀專區",
        url: "https://reading.tpml.gov.taipei/News.aspx?n=F850862ACD70FDC6&sms=EBF5ED68A2F6E55D",
      },
    ],
  },
  {
    city: "新北",
    status: "ready",
    title: "萬里分館 夏日海洋偵探營~解謎冒險與守護地球",
    summary:
      "新北市目前已經出現在官方活動報名網上的暑期項目之一，活動名稱很明顯偏海洋、生態與解謎導向，對小五生通常相當有吸引力。",
    period: "2026-07-02 至 2026-08-24",
    registration: "新北市圖 ATPASS 活動報名網",
    deadline: "截至 2026-04-28 尚未查得明確截止日",
    fit: "適合北海岸或喜歡自然探索主題的家庭。",
    note: "搜尋結果可確認館別與活動期間，但年齡限制與截止日仍請以正式報名頁為準。",
    sources: [
      {
        label: "新北市圖 ATPASS",
        url: "https://atpass.ntpclib.gov.tw/eventWeb/",
      },
      {
        label: "新北市圖活動資訊",
        url: "https://www.library.ntpc.gov.tw/singlehtml/ActvInfo?cntId=86ca7e7956f345cc82b09e85692d204b",
      },
    ],
  },
  {
    city: "新北",
    status: "ready",
    title: "金山分館 夏日魔法創客營~魔法與科學創作樂園",
    summary:
      "如果孩子喜歡做作品、做實驗、玩創客或科學類活動，這一項比看表演更像實作型暑期課程。",
    period: "2026-07-07 至 2026-08-26",
    registration: "新北市圖 ATPASS 活動報名網",
    deadline: "截至 2026-04-28 尚未查得明確截止日",
    fit: "適合偏好創作、科學與動手做的孩子。",
    note: "目前官方搜尋結果已可確認活動標題與期間，但細節仍待正式報名頁完整顯示。",
    sources: [
      {
        label: "新北市圖 ATPASS",
        url: "https://atpass.ntpclib.gov.tw/eventWeb/",
      },
      {
        label: "新北市圖活動資訊",
        url: "https://www.library.ntpc.gov.tw/singlehtml/ActvInfo?cntId=86ca7e7956f345cc82b09e85692d204b",
      },
    ],
  },
  {
    city: "新北",
    status: "pending",
    title: "新北市兒童藝術節",
    summary:
      "新北市最具代表性的暑假大型親子藝文活動之一，文化局仍將它列為主題專區，但 2026 年正式活動頁截至目前尚未完整上線。",
    period: "暑假期間；2026 細節待公告",
    registration: "尚未公告",
    deadline: "尚未公告",
    fit: "適合想等一個大型暑假重點活動的家庭。",
    note: "文化局的主題介紹明確寫到這是「新北市夏日重大的節慶活動」。2025 年曾於 2025-07-12 至 2025-07-20 舉辦，僅供時間帶參考。",
    sources: [
      {
        label: "文化局主題介紹",
        url: "https://www.culture.ntpc.gov.tw/sdgs/cont?sid=0J133517304722478560",
      },
      {
        label: "文化局首頁主題專區",
        url: "https://www.culture.ntpc.gov.tw/%E3%80%80",
      },
      {
        label: "2025 暑期活動懶人包（參考）",
        url: "https://www.culture.ntpc.gov.tw/xceventsnews/cont?bdate=2025-07-13&disp=1&qcat=0G336743893825971626&sid=0M207401390331869130&xsmsid=0G295700334178642420",
      },
    ],
  },
];

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

  const sources = item.sources
    .map(
      (source) =>
        `<a href="${source.url}" target="_blank" rel="noreferrer">${source.label}</a>`
    )
    .join("");

  article.innerHTML = `
    <div class="activity-header">
      <span class="city-pill">${item.city}</span>
      <span class="status-pill ${item.status}">
        ${item.status === "ready" ? "已可安排" : "待公告"}
      </span>
    </div>
    <h2 class="activity-title">${item.title}</h2>
    <p class="activity-summary">${item.summary}</p>
    <div class="meta-grid">
      <div class="meta-item">
        <span class="meta-label">活動時間</span>
        <span class="meta-value">${item.period}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">報名方式</span>
        <span class="meta-value">${item.registration}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">報名期限</span>
        <span class="meta-value">${item.deadline}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">適合怎麼安排</span>
        <span class="meta-value">${item.fit}</span>
      </div>
    </div>
    <div class="note-block">${item.note}</div>
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

render();
