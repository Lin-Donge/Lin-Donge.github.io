const STORAGE_KEY = "momentum.workspace.v1";
const WEATHER_CONFIG_KEY = "momentum.weather.config";
const SUPABASE_URL = "https://jsjcckduhhokbjcpglaz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_am94ArvCQiIwf_xduK2yRA_bbEit1u0";
const SUPABASE_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
const CLOUD_WORKSPACE_NAME = "default";
const CLOUD_AUTO_UPLOAD_INTERVAL = 10 * 60 * 1000;
const LEGACY_STORAGE_KEYS = [
  "sjtunotion.workspace.v1",
  "sjtunotion.workspace.v2",
  "sjtunotion.workspace.v3",
  "sjtunotion.workspace.v4",
  "sjtunotion.workspace.v5",
];
const DASHBOARD_ID = "dashboard";
const BOOKMARKS_ID = "bookmarks";
const defaultWeatherConfig = {
  city: "上海",
  latitude: 31.2304,
  longitude: 121.4737,
};
const bookmarkCategories = [
  { id: "life", name: "日常生活" },
  { id: "student", name: "学生工作" },
  { id: "research", name: "学习科研" },
  { id: "practice", name: "课外实践" },
];

const statusMap = {
  planned: "计划中",
  doing: "进行中",
  done: "已完成",
};

const projectColors = [
  { name: "灰色", value: "#6f6e69" },
  { name: "棕色", value: "#8b6b61" },
  { name: "橙色", value: "#c7773c" },
  { name: "黄色", value: "#c29223" },
  { name: "绿色", value: "#548164" },
  { name: "蓝色", value: "#337ea9" },
  { name: "紫色", value: "#9065b0" },
  { name: "粉色", value: "#c14c8a" },
  { name: "红色", value: "#c4554d" },
];

const projectSymbols = ["folder", "book", "person", "flask", "leaf", "compass", "target", "bulb", "puzzle", "archive", "pencil", "chart", "bookmark", "tool", "paperclip", "star", "speaker", "camera"];

const iconOptions = [
  { value: "folder", label: "文件夹" },
  { value: "book", label: "书本" },
  { value: "person", label: "人物" },
  { value: "flask", label: "实验" },
  { value: "leaf", label: "生长" },
  { value: "compass", label: "指南" },
  { value: "target", label: "目标" },
  { value: "bulb", label: "想法" },
  { value: "puzzle", label: "模块" },
  { value: "archive", label: "归档" },
  { value: "pencil", label: "编辑" },
  { value: "chart", label: "图表" },
  { value: "bookmark", label: "书签" },
  { value: "tool", label: "工具" },
  { value: "paperclip", label: "附件" },
  { value: "star", label: "重点" },
  { value: "speaker", label: "发言" },
  { value: "camera", label: "相机" },
];

const initialData = {
  activeSpaceId: DASHBOARD_ID,
  bookmarks: [],
  spaces: [
    {
      id: "life",
      name: "日常生活",
      icon: "leaf",
      bookmarks: [],
      projects: [{ id: "p-life-trip", name: "前往更好的远方", icon: "compass" }],
      tasks: [],
    },
    {
      id: "student",
      name: "学生工作",
      icon: "person",
      bookmarks: [],
      projects: [
        { id: "p-student-chair-meeting", name: "院系主席会议", icon: "book" },
        { id: "p-student-review", name: "评议", icon: "target" },
        { id: "p-student-shooting", name: "拍摄", icon: "star" },
        { id: "p-student-regular-meeting", name: "例会", icon: "folder" },
        { id: "p-student-expected-meeting", name: "预计开会", icon: "bulb" },
        { id: "p-student-model-power", name: "榜样的力量", icon: "star" },
      ],
      tasks: [],
    },
    {
      id: "research",
      name: "学习科研",
      icon: "flask",
      bookmarks: [],
      projects: [
        { id: "p-research-signal-exam", name: "电子信号处理考试", icon: "flask" },
        { id: "p-research-course-select", name: "选课", icon: "pencil" },
      ],
      tasks: [],
    },
    {
      id: "practice",
      name: "课外实践",
      icon: "compass",
      bookmarks: [],
      projects: [],
      tasks: [],
    },
  ],
};

let state = loadState();
let selectedProjectId = "all";
let selectedCalendarDate = toDateInput(new Date());
let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();
let editingTaskRef = null;
let editingProjectRef = null;
let bookmarkEditMode = false;
let dragStarted = false;
let bookmarkDragStarted = false;
let shouldAnimateCalendarLoad = true;
let confirmResolver = null;
let supabaseClient = createSupabaseClient();
let currentUser = null;
let cloudAutoUploadTimer = null;
let cloudDirty = false;
let pendingCloudChanges = createEmptyChangeSet();
let lastCloudSyncAt = null;
let isApplyingRemoteState = false;
let passwordRecoveryMode = false;
let cloudConflictPromptOpen = false;
let cloudLoadedUserId = null;

const els = {
  spaceList: document.querySelector("#spaceList"),
  spaceEyebrow: document.querySelector("#spaceEyebrow"),
  spaceTitle: document.querySelector("#spaceTitle"),
  metricOneLabel: document.querySelector("#metricOneLabel"),
  metricFourLabel: document.querySelector("#metricFourLabel"),
  overviewGrid: document.querySelector("#overviewGrid"),
  projectCount: document.querySelector("#projectCount"),
  doingCount: document.querySelector("#doingCount"),
  weekCount: document.querySelector("#weekCount"),
  bookmarkCount: document.querySelector("#bookmarkCount"),
  timeWidget: document.querySelector("#timeWidget"),
  timeDate: document.querySelector("#timeDate"),
  timeNow: document.querySelector("#timeNow"),
  timeWeek: document.querySelector("#timeWeek"),
  hourHand: document.querySelector(".hour-hand"),
  minuteHand: document.querySelector(".minute-hand"),
  weatherWidget: document.querySelector("#weatherWidget"),
  weatherSymbol: document.querySelector(".weather-symbol"),
  weatherCity: document.querySelector("#weatherCity"),
  weatherTemp: document.querySelector("#weatherTemp"),
  weatherDetail: document.querySelector("#weatherDetail"),
  weatherRefreshBtn: document.querySelector("#weatherRefreshBtn"),
  cloudStatus: document.querySelector("#cloudStatus"),
  cloudEmail: document.querySelector("#cloudEmail"),
  cloudPassword: document.querySelector("#cloudPassword"),
  cloudLoginBtn: document.querySelector("#cloudLoginBtn"),
  cloudRegisterBtn: document.querySelector("#cloudRegisterBtn"),
  cloudSetPasswordBtn: document.querySelector("#cloudSetPasswordBtn"),
  cloudLogoutBtn: document.querySelector("#cloudLogoutBtn"),
  uploadCloudBtn: document.querySelector("#uploadCloudBtn"),
  pullCloudBtn: document.querySelector("#pullCloudBtn"),
  toast: document.querySelector("#toast"),
  bookmarkPanel: document.querySelector("#bookmarkPanel"),
  bookmarkGrid: document.querySelector("#bookmarkGrid"),
  contentLayout: document.querySelector(".content-layout"),
  projectPanel: document.querySelector("#projectPanel"),
  workflowPanel: document.querySelector("#workflowPanel"),
  kanban: document.querySelector("#kanban"),
  workflowTitle: document.querySelector("#workflowTitle"),
  currentProjectName: document.querySelector("#currentProjectName"),
  calendarPanel: document.querySelector("#calendarPanel"),
  calendar: document.querySelector("#calendar"),
  monthSelect: document.querySelector("#monthSelect"),
  prevMonthBtn: document.querySelector("#prevMonthBtn"),
  nextMonthBtn: document.querySelector("#nextMonthBtn"),
  dayAgenda: document.querySelector("#dayAgenda"),
  projectKicker: document.querySelector("#projectKicker"),
  projectPanelTitle: document.querySelector("#projectPanelTitle"),
  projectList: document.querySelector("#projectList"),
  taskDialog: document.querySelector("#taskDialog"),
  bookmarkDialog: document.querySelector("#bookmarkDialog"),
  projectDialog: document.querySelector("#projectDialog"),
  userDialog: document.querySelector("#userDialog"),
  confirmDialog: document.querySelector("#confirmDialog"),
  confirmTitle: document.querySelector("#confirmTitle"),
  confirmMessage: document.querySelector("#confirmMessage"),
  confirmCancelBtn: document.querySelector("#confirmCancelBtn"),
  confirmOkBtn: document.querySelector("#confirmOkBtn"),
  taskForm: document.querySelector("#taskForm"),
  bookmarkForm: document.querySelector("#bookmarkForm"),
  projectForm: document.querySelector("#projectForm"),
  userForm: document.querySelector("#userForm"),
  userEmail: document.querySelector("#userEmail"),
  userAccountText: document.querySelector("#userAccountText"),
  userExportBtn: document.querySelector("#userExportBtn"),
  sendChangePasswordBtn: document.querySelector("#sendChangePasswordBtn"),
  sendForgotPasswordBtn: document.querySelector("#sendForgotPasswordBtn"),
  taskSpaceInput: document.querySelector("#taskSpaceInput"),
  taskProjectInput: document.querySelector("#taskProjectInput"),
  taskContextText: document.querySelector("#taskContextText"),
  taskColorInput: document.querySelector("#taskColorInput"),
  taskColorPalette: document.querySelector("#taskColorPalette"),
  projectIconInput: document.querySelector("#projectIconInput"),
  projectIconPalette: document.querySelector("#projectIconPalette"),
  editProjectBtn: document.querySelector("#editProjectBtn"),
  deleteTaskBtn: document.querySelector("#deleteTaskBtn"),
  deleteProjectBtn: document.querySelector("#deleteProjectBtn"),
  toggleProjectCompleteBtn: document.querySelector("#toggleProjectCompleteBtn"),
  editBookmarkBtn: document.querySelector("#editBookmarkBtn"),
};

document.querySelector("#newTaskBtn").addEventListener("click", () => {
  editingTaskRef = null;
  els.taskForm.reset();
  if (syncTaskFormContext()) els.taskDialog.showModal();
});

document.querySelector("#addBookmarkBtn").addEventListener("click", () => els.bookmarkDialog.showModal());
els.editBookmarkBtn.addEventListener("click", () => {
  bookmarkEditMode = !bookmarkEditMode;
  renderBookmarks(state.activeSpaceId === BOOKMARKS_ID);
});
document.querySelector("#addProjectBtn").addEventListener("click", () => {
  editingProjectRef = null;
  els.projectDialog.querySelector("h3").textContent = "添加项目";
  els.projectForm.reset();
  els.deleteProjectBtn.hidden = true;
  els.toggleProjectCompleteBtn.hidden = true;
  syncProjectIconOptions();
  els.projectDialog.showModal();
});
els.editProjectBtn.addEventListener("click", openProjectEditor);
document.querySelector("#userCenterBtn").addEventListener("click", openUserCenter);
els.userExportBtn.addEventListener("click", exportData);
els.sendChangePasswordBtn.addEventListener("click", () => sendAccountPasswordEmail("change"));
els.sendForgotPasswordBtn.addEventListener("click", () => sendAccountPasswordEmail("forgot"));
els.weatherRefreshBtn.addEventListener("click", () => loadWeather(true));
els.cloudLoginBtn.addEventListener("click", signInCloud);
els.cloudRegisterBtn.addEventListener("click", signUpCloud);
els.cloudSetPasswordBtn.addEventListener("click", setCloudPassword);
els.cloudLogoutBtn.addEventListener("click", signOutCloud);
els.uploadCloudBtn.addEventListener("click", () => saveCloudWorkspace(true));
els.pullCloudBtn.addEventListener("click", () => loadCloudWorkspace(true));
els.cloudEmail.addEventListener("blur", () => {
  const email = els.cloudEmail.value.trim();
  els.cloudEmail.setCustomValidity(email && !isValidEmail(email) ? "邮箱格式不正确" : "");
});

window.addEventListener("beforeunload", (event) => {
  if (!cloudDirty) return;
  event.preventDefault();
  event.returnValue = "更改未上传云端";
});

document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => button.closest("dialog").close());
});

document.addEventListener("pointerdown", (event) => {
  const active = document.activeElement;
  if (!active?.matches?.("input, select, textarea")) return;
  if (event.target.closest("input, select, textarea")) return;
  active.blur();
});

els.deleteTaskBtn.addEventListener("click", deleteEditingTask);
els.deleteProjectBtn.addEventListener("click", deleteEditingProject);
els.toggleProjectCompleteBtn.addEventListener("click", toggleEditingProjectComplete);
els.confirmCancelBtn.addEventListener("click", () => closeConfirm(false));
els.confirmOkBtn.addEventListener("click", () => closeConfirm(true));

els.prevMonthBtn.addEventListener("click", () => changeCalendarMonth(-1));
els.nextMonthBtn.addEventListener("click", () => changeCalendarMonth(1));
els.monthSelect.addEventListener("change", (event) => {
  calendarMonth = Number(event.target.value);
  selectedCalendarDate = toDateInput(new Date(calendarYear, calendarMonth, 1));
  renderCalendar(getVisibleTasks());
});
els.taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const space = getSpaceById(form.get("spaceId"));
  const timeFields = readTaskTimeFields(form);
  if (!timeFields) return;
  const createdTask = !editingTaskRef;
  if (editingTaskRef) {
    const task = getSpaceById(editingTaskRef.spaceId).tasks.find((item) => item.id === editingTaskRef.taskId);
    if (task) {
      task.title = form.get("title").trim();
      task.location = form.get("location").trim();
      task.dueDate = timeFields.dueDate;
      task.startTime = timeFields.startTime;
      task.endTime = timeFields.endTime;
      task.color = form.get("color");
    }
    editingTaskRef = null;
  } else {
    space.tasks.push({
      id: crypto.randomUUID(),
      projectId: form.get("projectId"),
      title: form.get("title").trim(),
      location: form.get("location").trim(),
      dueDate: timeFields.dueDate,
      startTime: timeFields.startTime,
      endTime: timeFields.endTime,
      status: "planned",
      color: form.get("color"),
    });
  }
  closeAndReset(event.currentTarget);
  persistAndRender(createdTask ? "add" : "modify");
  if (createdTask) saveCloudWorkspace(false);
});

els.bookmarkForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  state.bookmarks.push({
      id: crypto.randomUUID(),
      title: form.get("title").trim(),
      type: form.get("type"),
      category: form.get("category"),
      url: form.get("url").trim(),
      order: getNextBookmarkOrder(form.get("category"), form.get("type")),
    });
  closeAndReset(event.currentTarget);
  persistAndRender("add");
});

els.projectForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const createdProject = !editingProjectRef;
  const project = {
    id: crypto.randomUUID(),
    name: form.get("name").trim(),
    icon: normalizeProjectIcon(form.get("icon")),
    completed: false,
  };
  if (editingProjectRef) {
    const current = getSpaceById(editingProjectRef.spaceId).projects.find((item) => item.id === editingProjectRef.projectId);
    if (current) {
      current.name = project.name;
      current.icon = project.icon;
    }
    editingProjectRef = null;
  } else {
    getActiveSpace().projects.push(project);
    selectedProjectId = project.id;
  }
  closeAndReset(event.currentTarget);
  persistAndRender(createdProject ? "add" : "modify");
  if (createdProject) saveCloudWorkspace(false);
});

render();
initCloudSync();
loadWeather();
renderClock();
window.setInterval(renderClock, 1000);

function render() {
  const isDashboard = state.activeSpaceId === DASHBOARD_ID;
  const isBookmarks = state.activeSpaceId === BOOKMARKS_ID;
  const space = getActiveSpace();
  const tasks = getVisibleTasks();

  if (!isBookmarks) bookmarkEditMode = false;
  els.overviewGrid.hidden = isBookmarks;
  els.projectPanel.hidden = isBookmarks;
  els.workflowPanel.hidden = isBookmarks || isDashboard;
  els.calendarPanel.hidden = isBookmarks;
  els.timeWidget.hidden = !isDashboard;
  els.weatherWidget.hidden = !isDashboard;
  els.contentLayout.classList.toggle("bookmark-mode", isBookmarks);
  els.contentLayout.classList.toggle("dashboard-mode", isDashboard);
  els.contentLayout.classList.toggle("space-mode", !isDashboard && !isBookmarks);
  renderSpaces();
  renderHeader(isDashboard, isBookmarks, space);
  renderMetrics(isDashboard, isBookmarks, space);
  renderBookmarks(isBookmarks);
  syncSelectedProject(isDashboard || isBookmarks, space);
  updateNewTaskButton();
  renderKanban(tasks);
  renderCalendar(tasks);
  renderProjects(isDashboard || isBookmarks, space);
  renderCurrentProjectName();
  syncProjectIconOptions();
}

function renderSpaces() {
  const dashboardButton = `
    <button class="space-button ${state.activeSpaceId === DASHBOARD_ID ? "active" : ""}" data-space-id="${DASHBOARD_ID}" type="button">
      ${spaceIconSvg("target")}
      <span>工作总览</span>
    </button>
  `;
  const bookmarkButton = `
    <button class="space-button ${state.activeSpaceId === BOOKMARKS_ID ? "active" : ""}" data-space-id="${BOOKMARKS_ID}" type="button">
      ${spaceIconSvg("bookmark")}
      <span>书签库</span>
    </button>
  `;
  const spaceButtons = state.spaces
    .map(
      (space) => `
        <button class="space-button ${space.id === state.activeSpaceId ? "active" : ""}" data-space-id="${space.id}" type="button">
          ${spaceIconSvg(space.icon)}
          <span>${space.name}</span>
        </button>
      `,
    )
    .join("");

  els.spaceList.innerHTML = dashboardButton + spaceButtons + bookmarkButton;
  els.spaceList.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeSpaceId = button.dataset.spaceId;
      selectedProjectId = "all";
      persistUiAndRender();
    });
  });
}

function renderHeader(isDashboard, isBookmarks, space) {
  els.spaceEyebrow.textContent = isDashboard ? "总览" : isBookmarks ? "链接" : "专区";
  els.spaceTitle.textContent = isDashboard ? "工作总览" : isBookmarks ? "书签库" : space.name;
}

function renderMetrics(isDashboard, isBookmarks, space) {
  const tasks = isDashboard ? getAllTasks() : isBookmarks ? [] : space.tasks;
  const today = startOfDay(new Date());
  const nextWeek = addDays(today, 7);
  const bookmarkCount = state.bookmarks.length;

  els.metricOneLabel.textContent = isDashboard ? "专区" : isBookmarks ? "网页链接" : "项目";
  els.metricFourLabel.textContent = isDashboard ? "全部任务" : isBookmarks ? "文件夹链接" : "任务";
  els.projectCount.textContent = isDashboard
    ? state.spaces.length
    : isBookmarks
      ? state.bookmarks.filter((bookmark) => bookmark.type === "web").length
      : space.projects.length;
  els.doingCount.textContent = tasks.filter((task) => task.status === "doing").length;
  els.weekCount.textContent = tasks.filter((task) => {
    const due = parseTaskStart(task);
    return due >= today && due <= nextWeek;
  }).length;
  els.bookmarkCount.textContent = isDashboard
    ? tasks.length
    : isBookmarks
      ? state.bookmarks.filter((bookmark) => bookmark.type === "folder").length
      : tasks.length;
}

function renderBookmarks(isBookmarks) {
  els.bookmarkPanel.hidden = !isBookmarks;
  if (!isBookmarks) return;
  els.bookmarkPanel.classList.toggle("editing", bookmarkEditMode);
  els.editBookmarkBtn.classList.toggle("active", bookmarkEditMode);
  els.editBookmarkBtn.title = bookmarkEditMode ? "退出编辑" : "编辑书签";

  els.bookmarkGrid.innerHTML = bookmarkCategories
    .map((category) => {
      const bookmarks = state.bookmarks.filter((bookmark) => bookmark.category === category.id);
      return `
        <section class="bookmark-category">
          <h4>${category.name}</h4>
          <div class="bookmark-category-grid">
            <section class="bookmark-column">
              <h5>网页链接</h5>
              ${renderBookmarkColumn(bookmarks.filter((bookmark) => bookmark.type === "web"), "web")}
            </section>
            <section class="bookmark-column">
              <h5>文件夹链接</h5>
              ${renderBookmarkColumn(bookmarks.filter((bookmark) => bookmark.type === "folder"), "folder")}
            </section>
          </div>
        </section>
      `;
    })
    .join("");
  bindBookmarkActions();
}

function renderBookmarkColumn(bookmarks, type) {
  if (!bookmarks.length) return `<div class="empty compact">暂无${type === "web" ? "网页链接" : "文件夹链接"}。</div>`;
  return bookmarks
    .slice()
    .sort(compareBookmarks)
    .map(
      (bookmark) => `
        <div class="bookmark" draggable="true" data-bookmark-id="${escapeAttr(bookmark.id)}" data-bookmark-category="${escapeAttr(bookmark.category)}" data-bookmark-type="${escapeAttr(bookmark.type)}">
          <a class="bookmark-link" href="${escapeAttr(formatBookmarkHref(bookmark))}" target="_blank" rel="noreferrer" data-bookmark-type="${escapeAttr(bookmark.type)}" data-bookmark-url="${escapeAttr(bookmark.url)}">
            ${bookmarkTypeIconSvg(bookmark.type)}
            <strong>${escapeHtml(bookmark.title)}</strong>
          </a>
          <button class="bookmark-delete" type="button" data-bookmark-id="${escapeAttr(bookmark.id)}" title="删除书签" aria-label="删除 ${escapeAttr(bookmark.title)}">×</button>
        </div>
      `,
    )
    .join("");
}

function bindBookmarkActions() {
  let draggedBookmark = null;
  els.bookmarkGrid.querySelectorAll(".bookmark").forEach((item) => {
    item.addEventListener("dragstart", (event) => {
      draggedBookmark = item;
      bookmarkDragStarted = true;
      item.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", item.dataset.bookmarkId);
    });
    item.addEventListener("dragend", () => {
      item.classList.remove("dragging");
      draggedBookmark = null;
      els.bookmarkGrid.querySelectorAll(".bookmark").forEach((bookmark) => bookmark.classList.remove("drag-over"));
      window.setTimeout(() => {
        bookmarkDragStarted = false;
      }, 0);
    });
    item.addEventListener("dragover", (event) => {
      if (!canDropBookmark(draggedBookmark, item)) return;
      event.preventDefault();
      item.classList.add("drag-over");
      event.dataTransfer.dropEffect = "move";
    });
    item.addEventListener("dragleave", () => item.classList.remove("drag-over"));
    item.addEventListener("drop", (event) => {
      event.preventDefault();
      item.classList.remove("drag-over");
      if (!canDropBookmark(draggedBookmark, item)) return;
      reorderBookmarks(draggedBookmark.dataset.bookmarkId, item.dataset.bookmarkId);
    });
  });
  els.bookmarkGrid.querySelectorAll(".bookmark-delete[data-bookmark-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const ok = await askConfirm({
        title: "删除书签",
        message: "确定删除这个书签吗？",
        okText: "删除",
      });
      if (!ok) return;
      state.bookmarks = state.bookmarks.filter((bookmark) => bookmark.id !== button.dataset.bookmarkId);
      persistAndRender("delete");
    });
  });
  els.bookmarkGrid.querySelectorAll(".bookmark-link").forEach((link) => {
    link.addEventListener("click", async (event) => {
      if (bookmarkDragStarted) {
        event.preventDefault();
        return;
      }
      if (link.dataset.bookmarkType === "folder") {
        event.preventDefault();
        const path = bookmarkUrlToCopyPath(link.dataset.bookmarkUrl);
        try {
          await navigator.clipboard.writeText(path);
          showToast("已复制文件夹路径");
        } catch {
          showToast("复制失败，请手动复制路径");
        }
      }
    });
  });
}

function canDropBookmark(source, target) {
  return source
    && target
    && source !== target
    && source.dataset.bookmarkCategory === target.dataset.bookmarkCategory
    && source.dataset.bookmarkType === target.dataset.bookmarkType;
}

function reorderBookmarks(sourceId, targetId) {
  const source = state.bookmarks.find((bookmark) => bookmark.id === sourceId);
  const target = state.bookmarks.find((bookmark) => bookmark.id === targetId);
  if (!source || !target) return;
  const group = state.bookmarks
    .filter((bookmark) => bookmark.category === source.category && bookmark.type === source.type)
    .sort(compareBookmarks);
  const sourceIndex = group.findIndex((bookmark) => bookmark.id === sourceId);
  const targetIndex = group.findIndex((bookmark) => bookmark.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0) return;
  const [moving] = group.splice(sourceIndex, 1);
  group.splice(targetIndex, 0, moving);
  group.forEach((bookmark, index) => {
    bookmark.order = index;
  });
  persistAndRender("modify");
}

function syncSelectedProject(isDashboard, space) {
  els.workflowTitle.textContent = isDashboard ? "项目目录" : "项目工作";
  const projects = isDashboard ? getAllProjects() : space.projects.map((project) => ({ ...project, spaceId: space.id }));
  if (isDashboard) {
    selectedProjectId = "all";
    return;
  }
  const currentStillExists = projects.some((project) => project.id === selectedProjectId);
  if (!projects.length) {
    selectedProjectId = "all";
    return;
  }
  if (!currentStillExists) selectedProjectId = "all";
}

function renderKanban(tasks) {
  if (state.activeSpaceId === DASHBOARD_ID) {
    els.kanban.hidden = true;
    els.kanban.innerHTML = "";
    return;
  }

  els.kanban.hidden = false;
  if (selectedProjectId === "all") {
    els.kanban.innerHTML = `<div class="empty kanban-empty">请先在项目列表中选择一个项目。</div>`;
    return;
  }

  const visibleTasks = selectedProjectId === "all"
    ? []
    : tasks.filter((task) => task.projectId === selectedProjectId);

  els.kanban.innerHTML = Object.entries(statusMap)
    .map(([status, label]) => {
      const laneTasks = visibleTasks
        .filter((task) => task.status === status)
        .sort(compareTasksByStart);
      return `
        <section class="lane" data-lane-status="${status}">
          <div class="lane-title">
            <strong>${label}</strong>
            <span>${laneTasks.length}</span>
          </div>
          ${laneTasks.length ? laneTasks.map(renderTask).join("") : `<div class="empty">暂无工作</div>`}
        </section>
      `;
    })
    .join("");

  bindKanbanDragEvents();
}

function bindKanbanDragEvents() {
  els.kanban.querySelectorAll(".task-card").forEach((card) => {
    card.addEventListener("click", () => {
      if (dragStarted) return;
      openTaskEditor(card.dataset.spaceId, card.dataset.taskId);
    });

    card.addEventListener("dragstart", (event) => {
      dragStarted = true;
      card.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData(
        "application/json",
        JSON.stringify({ spaceId: card.dataset.spaceId, taskId: card.dataset.taskId }),
      );
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      els.kanban.querySelectorAll(".lane").forEach((lane) => lane.classList.remove("drag-over"));
      window.setTimeout(() => {
        dragStarted = false;
      }, 0);
    });
  });

  els.kanban.querySelectorAll(".lane").forEach((lane) => {
    lane.addEventListener("dragover", (event) => {
      event.preventDefault();
      lane.classList.add("drag-over");
      event.dataTransfer.dropEffect = "move";
    });

    lane.addEventListener("dragleave", (event) => {
      if (!lane.contains(event.relatedTarget)) lane.classList.remove("drag-over");
    });

    lane.addEventListener("drop", (event) => {
      event.preventDefault();
      lane.classList.remove("drag-over");
      const payload = readDragPayload(event);
      if (!payload) return;
      const task = getSpaceById(payload.spaceId).tasks.find((item) => item.id === payload.taskId);
      if (!task || task.status === lane.dataset.laneStatus) return;
      task.status = lane.dataset.laneStatus;
      persistAndRender("modify");
    });
  });
}

function openTaskEditor(spaceId, taskId) {
  const space = getSpaceById(spaceId);
  const task = space.tasks.find((item) => item.id === taskId);
  if (!task) return;
  const project = space.projects.find((item) => item.id === task.projectId);

  editingTaskRef = { spaceId, taskId };
  els.taskForm.reset();
  els.taskDialog.querySelector("h3").textContent = "修改工作";
  els.taskSpaceInput.value = space.id;
  els.taskProjectInput.value = task.projectId;
  els.taskContextText.innerHTML = `
    ${projectIconSvg(project?.icon)}
    <span>${escapeHtml(space.name)} / ${escapeHtml(project?.name ?? "未归档项目")}</span>
  `;
  els.taskForm.elements.title.value = task.title;
  els.taskForm.elements.location.value = task.location ?? "";
  els.taskForm.elements.dueDate.value = getDateKey(task.dueDate);
  els.taskForm.elements.startTime.value = getStartTime(task);
  els.taskForm.elements.endTime.value = getEndTime(task);
  syncTaskColorOptions();
  selectColor(els.taskColorPalette, els.taskColorInput, task.color);
  els.deleteTaskBtn.hidden = false;
  els.taskDialog.showModal();
}

function readDragPayload(event) {
  try {
    return JSON.parse(event.dataTransfer.getData("application/json"));
  } catch {
    return null;
  }
}

function renderTask(task) {
  return `
    <article class="task-card" draggable="true" data-space-id="${task.spaceId}" data-task-id="${task.id}" style="--task-color: ${escapeAttr(task.color)}">
      <div class="task-title"><span>${renderTaskTitle(task)}</span></div>
      <div class="task-meta">${formatTaskDate(task)}</div>
    </article>
  `;
}

function renderCalendar(tasks) {
  const isDashboard = state.activeSpaceId === DASHBOARD_ID;
  const today = new Date();
  const year = calendarYear;
  const month = calendarMonth;
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = addDays(firstDay, -startOffset);
  const names = ["一", "二", "三", "四", "五", "六", "日"];
  const taskByDate = new Map();

  syncCalendarControls();
  els.calendar.classList.toggle("calendar-animate", shouldAnimateCalendarLoad);
  tasks.forEach((task) => {
    const key = getDateKey(task.dueDate);
    if (!taskByDate.has(key)) taskByDate.set(key, []);
    taskByDate.get(key).push(task);
  });
  taskByDate.forEach((dayTasks) => dayTasks.sort(compareTasksByStart));

  els.calendar.innerHTML = [
    ...names.map((name) => `<div class="calendar-head">${name}</div>`),
    ...Array.from({ length: 42 }, (_, index) => {
      const date = addDays(gridStart, index);
      const key = toDateInput(date);
      const dayTasks = taskByDate.get(key) ?? [];
      const classes = [
        "calendar-day",
        date.getMonth() !== month ? "muted" : "",
        key === toDateInput(today) ? "today" : "",
        key === selectedCalendarDate ? "selected" : "",
      ].join(" ");
      const title = dayTasks.map((task) => `${formatTaskTitle(task)}（${task.projectName}）`).join("，");
      const events = isDashboard
        ? renderDashboardCalendarEvents(dayTasks)
        : renderCompactCalendarBars(dayTasks);

      return `
        <button class="${classes}" type="button" data-calendar-date="${key}" title="${escapeAttr(title)}">
          <span class="calendar-date">${escapeHtml(formatCalendarDateLabel(date, isDashboard))}</span>
          ${events}
        </button>
      `;
    }),
  ].join("");

  els.calendar.querySelectorAll("[data-calendar-date]").forEach((button) => {
    button.addEventListener("click", () => {
      const clickedDate = parseDueDate(button.dataset.calendarDate);
      calendarYear = clickedDate.getFullYear();
      calendarMonth = clickedDate.getMonth();
      selectedCalendarDate = button.dataset.calendarDate;
      renderCalendar(tasks);
    });
  });
  els.calendar.querySelectorAll(".calendar-event").forEach((eventItem) => {
    eventItem.addEventListener("click", (event) => {
      event.stopPropagation();
      openDashboardTask(eventItem.dataset.spaceId, eventItem.dataset.taskId);
    });
  });
  renderDayAgenda(tasks);
  shouldAnimateCalendarLoad = false;
}

function renderDashboardCalendarEvents(dayTasks) {
  const eventItems = dayTasks
    .slice(0, 5)
    .map((task) => `
      <span class="calendar-event" style="--task-color: ${escapeAttr(task.color)}" data-space-id="${escapeAttr(task.spaceId)}" data-task-id="${escapeAttr(task.id)}">
        ${spaceIconSvg(task.spaceIcon)}
        <span>${renderCalendarEventLabel(task)}</span>
      </span>
    `)
    .join("");
  const moreItem = dayTasks.length > 5
    ? `<span class="calendar-more">+${dayTasks.length - 5}</span>`
    : "";
  return `<div class="calendar-events">${eventItems}${moreItem}</div>`;
}

function renderCompactCalendarBars(dayTasks) {
  const bars = dayTasks
    .slice(0, 3)
    .map((task) => `<span class="calendar-bar" style="--bar-color: ${escapeAttr(task.color)}"></span>`)
    .join("");
  return `<div class="calendar-bars">${bars}</div>`;
}

function openDashboardTask(spaceId, taskId) {
  const space = getSpaceById(spaceId);
  const task = space?.tasks.find((item) => item.id === taskId);
  if (!space || !task) return;
  openProjectPage(spaceId, task.projectId, getDateKey(task.dueDate));
}

function openProjectPage(spaceId, projectId, dateKey = selectedCalendarDate) {
  state.activeSpaceId = spaceId;
  selectedProjectId = projectId;
  selectedCalendarDate = dateKey;
  saveLocalState();
  render();
}

function syncCalendarControls() {
  const monthNames = Array.from({ length: 12 }, (_, index) => `${index + 1} 月`);
  els.monthSelect.innerHTML = monthNames
    .map((name, index) => `<option value="${index}">${name}</option>`)
    .join("");
  els.monthSelect.value = String(calendarMonth);
}

function changeCalendarMonth(delta) {
  const next = new Date(calendarYear, calendarMonth + delta, 1);
  calendarYear = next.getFullYear();
  calendarMonth = next.getMonth();
  selectedCalendarDate = toDateInput(next);
  renderCalendar(getVisibleTasks());
}

function renderDayAgenda(tasks) {
  const dayTasks = tasks
    .filter((task) => getDateKey(task.dueDate) === selectedCalendarDate)
    .sort(compareTasksByStart);

  if (!dayTasks.length) {
    els.dayAgenda.innerHTML = `
      <div class="day-agenda-title">${formatFullDate(selectedCalendarDate)}</div>
      <div class="empty compact">当日没有日程。</div>
    `;
    return;
  }

  els.dayAgenda.innerHTML = `
    <div class="day-agenda-title">${formatFullDate(selectedCalendarDate)}</div>
    <div class="day-task-list">
      ${dayTasks
        .map((task) => {
          const spaceMeta = state.activeSpaceId === DASHBOARD_ID
            ? `<button class="agenda-space-link" type="button" data-space-id="${task.spaceId}">${spaceIconSvg(task.spaceIcon)} ${escapeHtml(task.spaceName)}</button> · `
            : "";
          const projectMeta = state.activeSpaceId === DASHBOARD_ID
            ? `<button class="agenda-project-link" type="button" data-space-id="${task.spaceId}" data-project-id="${task.projectId}" data-date-key="${getDateKey(task.dueDate)}">${projectIconSvg(task.projectIcon)} ${escapeHtml(task.projectName)}</button>`
            : `${projectIconSvg(task.projectIcon)} ${escapeHtml(task.projectName)}`;
          const detailMeta = state.activeSpaceId === DASHBOARD_ID
            ? `${spaceMeta}${projectMeta} · ${formatTaskDate(task)} · ${statusMap[task.status]}`
            : formatTaskDate(task);
          return `
            <article class="day-task" data-space-id="${task.spaceId}" data-task-id="${task.id}" style="--task-color: ${escapeAttr(task.color)}">
              <span class="calendar-bar"></span>
              <strong>${renderTaskTitle(task)}</strong>
              <small>${detailMeta}</small>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
  bindDayAgendaEvents();
}

function bindDayAgendaEvents() {
  els.dayAgenda.querySelectorAll(".day-task").forEach((card) => {
    card.addEventListener("click", () => openTaskEditor(card.dataset.spaceId, card.dataset.taskId));
  });
  els.dayAgenda.querySelectorAll(".agenda-space-link").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      state.activeSpaceId = button.dataset.spaceId;
      selectedProjectId = "all";
      persistUiAndRender();
    });
  });
  els.dayAgenda.querySelectorAll(".agenda-project-link").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openProjectPage(button.dataset.spaceId, button.dataset.projectId, button.dataset.dateKey);
    });
  });
}

function renderProjects(isDashboard, space) {
  els.projectKicker.textContent = isDashboard ? "Spaces" : "Projects";
  els.projectPanelTitle.textContent = isDashboard ? "全部项目" : "项目列表";
  document.querySelector("#addProjectBtn").hidden = isDashboard;

  if (isDashboard) {
    els.projectList.innerHTML = state.spaces
      .map((item) => {
        const projects = item.projects
          .map((project) => ({ ...project, spaceId: item.id }))
          .sort((a, b) => compareProjectsForDisplay(a, b, item));
        return `
          <section class="project-category">
            <div class="project-category-title">${spaceIconSvg(item.icon)} ${escapeHtml(item.name)}</div>
            <div class="project-category-list">
              ${
                projects.length
                  ? projects.map((project) => renderProjectButton(project, item, true)).join("")
                  : `<div class="empty compact">暂无项目。</div>`
              }
            </div>
          </section>
        `;
      })
      .join("");
    bindProjectSelection(true);
    return;
  }

  if (!space.projects.length) {
    els.projectList.innerHTML = `<div class="empty project-empty">还没有项目。</div>`;
    return;
  }

  els.projectList.innerHTML = space.projects
    .slice()
    .sort((a, b) => compareProjectsForDisplay(a, b, space))
    .map((project) => renderProjectButton({ ...project, spaceId: space.id }, space, false))
    .join("");
  bindProjectSelection(false);
}

function renderProjectButton(project, space, isDashboard) {
  const projectTasks = space.tasks.filter((task) => task.projectId === project.id);
  const count = projectTasks.length;
  const duration = formatProjectDuration(projectTasks, isDashboard);
  const isComplete = Boolean(project.completed);
  const isActive = project.id === selectedProjectId;
  return `
    <button class="project-item ${isActive ? "active" : ""} ${isComplete ? "complete" : ""} ${isDashboard ? "dashboard-project" : ""}" type="button" data-project-id="${project.id}" data-space-id="${space.id}">
      ${projectIconSvg(project.icon)}
      <span class="project-copy">
        <strong>${escapeHtml(project.name)}${isComplete ? `<span class="project-complete-badge">已完成</span>` : ""}</strong><br />
        <small>${count} 项工作 · ${duration}</small>
      </span>
    </button>
  `;
}

function renderCurrentProjectName() {
  if (state.activeSpaceId === DASHBOARD_ID) {
    els.currentProjectName.innerHTML = `${spaceIconSvg("target")}<span>工作总览</span>`;
    return;
  }
  if (state.activeSpaceId === BOOKMARKS_ID) {
    els.currentProjectName.innerHTML = "";
    return;
  }
  const context = getSelectedProjectContext();
  els.currentProjectName.innerHTML = context
    ? `${projectIconSvg(context.project.icon)}<span>${escapeHtml(context.project.name)}</span>`
    : `<span>未选择项目</span>`;
}

function bindProjectSelection(isDashboard) {
  els.projectList.querySelectorAll("[data-project-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedProjectId = button.dataset.projectId;
      if (isDashboard) {
        state.activeSpaceId = button.dataset.spaceId;
        persistUiAndRender();
        return;
      }
      persistUiAndRender();
    });
  });
}

function openProjectEditor() {
  const context = getSelectedProjectContext();
  if (!context) return;
  openProjectEditorById(context.space.id, context.project.id);
}

function openProjectEditorById(spaceId, projectId) {
  const space = getSpaceById(spaceId);
  const project = space.projects.find((item) => item.id === projectId);
  if (!project) return;
  editingProjectRef = { spaceId: space.id, projectId: project.id };
  els.projectForm.reset();
  els.projectDialog.querySelector("h3").textContent = "修改项目";
  els.projectForm.elements.name.value = project.name;
  syncProjectIconOptions();
  selectIcon(els.projectIconPalette, els.projectIconInput, project.icon);
  els.deleteProjectBtn.hidden = false;
  els.toggleProjectCompleteBtn.hidden = false;
  syncProjectCompleteButton(project);
  els.projectDialog.showModal();
}

async function deleteEditingTask() {
  if (!editingTaskRef) return;
  const ok = await askConfirm({
    title: "删除日程",
    message: "确定删除这个日程吗？",
    okText: "删除",
  });
  if (!ok) return;
  const space = getSpaceById(editingTaskRef.spaceId);
  space.tasks = space.tasks.filter((task) => task.id !== editingTaskRef.taskId);
  editingTaskRef = null;
  closeAndReset(els.taskForm);
  persistAndRender("delete");
}

async function deleteEditingProject() {
  if (!editingProjectRef) return;
  const ok = await askConfirm({
    title: "删除项目",
    message: "确定删除这个项目及其下方全部日程吗？",
    okText: "删除",
  });
  if (!ok) return;
  const space = getSpaceById(editingProjectRef.spaceId);
  space.projects = space.projects.filter((project) => project.id !== editingProjectRef.projectId);
  space.tasks = space.tasks.filter((task) => task.projectId !== editingProjectRef.projectId);
  if (selectedProjectId === editingProjectRef.projectId) selectedProjectId = "all";
  editingProjectRef = null;
  closeAndReset(els.projectForm);
  persistAndRender("delete");
}

function toggleEditingProjectComplete() {
  if (!editingProjectRef) return;
  const project = getSpaceById(editingProjectRef.spaceId).projects.find((item) => item.id === editingProjectRef.projectId);
  if (!project) return;
  project.completed = !project.completed;
  syncProjectCompleteButton(project);
  persistAndRender("modify");
}

function syncProjectCompleteButton(project) {
  const completed = Boolean(project?.completed);
  els.toggleProjectCompleteBtn.textContent = completed ? "取消完成" : "已完成";
  els.toggleProjectCompleteBtn.classList.toggle("active", completed);
}

function syncTaskFormContext() {
  const context = getSelectedProjectContext();
  if (!context) return false;
  els.taskDialog.querySelector("h3").textContent = "新建工作";
  els.taskSpaceInput.value = context.space.id;
  els.taskProjectInput.value = context.project.id;
  els.taskContextText.innerHTML = `
    ${projectIconSvg(context.project.icon)}
    <span>${escapeHtml(context.space.name)} / ${escapeHtml(context.project.name)}</span>
  `;
  syncTaskColorOptions();
  selectColor(els.taskColorPalette, els.taskColorInput, projectColors[5].value);
  els.deleteTaskBtn.hidden = true;
  return true;
}

function syncTaskColorOptions() {
  renderColorPalette(els.taskColorPalette, els.taskColorInput, els.taskColorInput.value || projectColors[5].value);
}

function syncProjectIconOptions() {
  renderIconPalette(els.projectIconPalette, els.projectIconInput, els.projectIconInput.value || "folder");
}

function renderIconPalette(container, input, selectedValue) {
  const selectedIcon = normalizeProjectIcon(selectedValue);
  input.value = selectedIcon;
  container.innerHTML = iconOptions
    .map(
      (icon) => `
        <button
          class="icon-choice ${icon.value === selectedIcon ? "active" : ""}"
          type="button"
          role="radio"
          aria-checked="${icon.value === selectedIcon}"
          aria-label="${icon.label}"
          title="${icon.label}"
          data-icon="${icon.value}"
        >
          ${projectIconSvg(icon.value)}
        </button>
      `,
    )
    .join("");

  container.querySelectorAll(".icon-choice").forEach((button) => {
    button.addEventListener("click", () => selectIcon(container, input, button.dataset.icon));
  });
}

function selectIcon(container, input, value) {
  const selectedIcon = normalizeProjectIcon(value);
  input.value = selectedIcon;
  container.querySelectorAll(".icon-choice").forEach((button) => {
    const isActive = button.dataset.icon === selectedIcon;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-checked", String(isActive));
  });
}

function updateNewTaskButton() {
  const button = document.querySelector("#newTaskBtn");
  if (state.activeSpaceId === DASHBOARD_ID || state.activeSpaceId === BOOKMARKS_ID) {
    button.hidden = true;
    els.editProjectBtn.hidden = true;
    return;
  }
  button.hidden = false;
  els.editProjectBtn.hidden = false;
  const hasProject = Boolean(getSelectedProjectContext());
  button.disabled = !hasProject;
  els.editProjectBtn.disabled = !hasProject;
  button.textContent = "+";
  button.title = hasProject ? "在当前选中的项目下新建工作" : "请先在项目筛选中选择一个具体项目";
  els.editProjectBtn.title = hasProject ? "修改当前项目" : "请先选择一个项目";
}

function renderColorPalette(container, input, selectedValue) {
  const selectedColor = normalizeColor(selectedValue);
  input.value = selectedColor;
  container.innerHTML = projectColors
    .map(
      (color) => `
        <button
          class="color-swatch ${color.value === selectedColor ? "active" : ""}"
          type="button"
          role="radio"
          aria-checked="${color.value === selectedColor}"
          aria-label="${color.name}"
          title="${color.name}"
          data-color="${color.value}"
          style="--swatch-color: ${color.value}"
        ></button>
      `,
    )
    .join("");

  container.querySelectorAll(".color-swatch").forEach((button) => {
    button.addEventListener("click", () => selectColor(container, input, button.dataset.color));
  });
}

function selectColor(container, input, value) {
  const selectedColor = normalizeColor(value);
  input.value = selectedColor;
  container.querySelectorAll(".color-swatch").forEach((button) => {
    const isActive = button.dataset.color === selectedColor;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-checked", String(isActive));
  });
}

function getVisibleTasks() {
  if (state.activeSpaceId === BOOKMARKS_ID) return [];
  return (state.activeSpaceId === DASHBOARD_ID ? getAllTasks() : decorateTasks(getActiveSpace()))
    .sort(compareTasksByStart);
}

function getAllTasks() {
  return state.spaces.flatMap(decorateTasks).sort(compareTasksByStart);
}

function getAllProjects() {
  return state.spaces.flatMap((space) =>
    space.projects.map((project) => ({
      ...project,
      icon: normalizeProjectIcon(project.icon),
      spaceId: space.id,
      spaceName: space.name,
      spaceIcon: space.icon,
    })),
  );
}

function getSelectedProjectContext() {
  if (selectedProjectId === "all") return null;
  for (const space of state.spaces) {
    const project = space.projects.find((item) => item.id === selectedProjectId);
    if (project) return { space, project };
  }
  return null;
}

function decorateTasks(space) {
  return space.tasks.map((task) => {
    const project = space.projects.find((item) => item.id === task.projectId);
    return {
      ...task,
      color: normalizeColor(task.color),
      spaceId: space.id,
      spaceName: space.name,
      spaceIcon: space.icon,
      projectName: project?.name ?? "未归档项目",
      projectIcon: normalizeProjectIcon(project?.icon),
    };
  });
}

function getActiveSpace() {
  return state.spaces.find((space) => space.id === state.activeSpaceId) ?? state.spaces[0];
}

function getSpaceById(spaceId) {
  return state.spaces.find((space) => space.id === spaceId) ?? state.spaces[0];
}

function compareTasksByStart(a, b) {
  return parseTaskStart(a) - parseTaskStart(b);
}

function compareProjectsByStart(a, b, space) {
  return getProjectStartTime(a.id, space) - getProjectStartTime(b.id, space);
}

function compareProjectsForDisplay(a, b, space) {
  const completeSort = Number(isProjectCompleteById(a.id, space)) - Number(isProjectCompleteById(b.id, space));
  if (completeSort !== 0) return completeSort;
  return compareProjectsByStart(a, b, space);
}

function isProjectCompleteById(projectId, space) {
  return Boolean(space.projects.find((project) => project.id === projectId)?.completed);
}

function getProjectStartTime(projectId, space) {
  const tasks = space.tasks
    .filter((task) => task.projectId === projectId)
    .sort(compareTasksByStart);
  return tasks.length ? parseTaskStart(tasks[0]).getTime() : Number.MAX_SAFE_INTEGER;
}

function persistAndRender(changeType = "modify") {
  saveLocalState();
  markCloudDirty(changeType);
  render();
}

function persistUiAndRender() {
  saveLocalState();
  render();
}

function saveLocalState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function markCloudDirty(changeType) {
  if (isApplyingRemoteState) return;
  cloudDirty = true;
  recordCloudChange(changeType);
  updateCloudDirtyStatus();
}

function recordCloudChange(type, count = 1) {
  if (!type || !pendingCloudChanges[type]) return;
  pendingCloudChanges[type] += count;
}

function createEmptyChangeSet() {
  return { add: 0, modify: 0, delete: 0 };
}

function resetPendingCloudChanges() {
  pendingCloudChanges = createEmptyChangeSet();
}

function formatChangeSummary(changes = pendingCloudChanges) {
  const parts = [
    ["添加", changes.add],
    ["修改", changes.modify],
    ["删除", changes.delete],
  ]
    .filter(([, count]) => count > 0)
    .map(([label, count]) => `${label} ${count} 条`);
  return parts.join("，");
}

function createSupabaseClient() {
  if (!window.supabase?.createClient) return null;
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

async function initCloudSync() {
  if (!supabaseClient) {
    setCloudStatus("正在加载云端组件...");
    try {
      await loadSupabaseScript();
      supabaseClient = createSupabaseClient();
    } catch {
      setCloudStatus("云端组件加载失败，当前仅保存在本地。");
      setCloudControls(false);
      return;
    }
  }

  if (!supabaseClient) {
    setCloudStatus("云端组件未加载，当前仅保存在本地。");
    setCloudControls(false);
    return;
  }

  const { data } = await supabaseClient.auth.getSession();
  currentUser = data.session?.user ?? null;
  syncCloudUi();
  await loadCloudWorkspaceOnce();
  startCloudAutoUpload();

  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === "PASSWORD_RECOVERY") passwordRecoveryMode = true;
    const previousUserId = currentUser?.id ?? null;
    currentUser = session?.user ?? null;
    syncCloudUi();
    if (!currentUser) cloudLoadedUserId = null;
    if (currentUser && event === "SIGNED_IN" && currentUser.id !== previousUserId) {
      await loadCloudWorkspaceOnce();
    }
    startCloudAutoUpload();
  });
}

async function loadCloudWorkspaceOnce() {
  if (!currentUser || cloudLoadedUserId === currentUser.id) return;
  cloudLoadedUserId = currentUser.id;
  await loadCloudWorkspace(false);
}

function loadSupabaseScript() {
  if (window.supabase?.createClient) return Promise.resolve();
  const existing = document.querySelector(`script[src="${SUPABASE_SCRIPT_URL}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      script.remove();
      reject(new Error("Supabase script timeout"));
    }, 6000);
    script.src = SUPABASE_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      window.clearTimeout(timeout);
      resolve();
    };
    script.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error("Supabase script failed"));
    };
    document.head.append(script);
  });
}

async function signInCloud() {
  if (!supabaseClient) return;
  const credentials = readCloudCredentials();
  if (!credentials) return;

  setCloudStatus("正在登录...");
  const { error } = await supabaseClient.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });
  if (error) {
    setCloudStatus(`登录失败：${error.message}`);
    showToast("登录失败");
    return;
  }
  setCloudStatus("登录成功，正在同步...");
  showToast("已登录");
}

async function signUpCloud() {
  if (!supabaseClient) return;
  const credentials = readCloudCredentials();
  if (!credentials) return;

  setCloudStatus("正在注册...");
  const { error } = await supabaseClient.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: { emailRedirectTo: window.location.href },
  });
  if (error) {
    setCloudStatus(`注册失败：${error.message}`);
    showToast("注册失败");
    return;
  }
  setCloudStatus("验证邮件已发送，请先到邮箱完成验证。");
  showToast("验证邮件已发送");
}

function openUserCenter() {
  els.userEmail.value = currentUser?.email ?? els.cloudEmail.value.trim();
  els.userAccountText.textContent = currentUser
    ? `已登录：${currentUser.email}`
    : "未登录，可填写邮箱发送忘记密码邮件。";
  els.sendChangePasswordBtn.disabled = !currentUser;
  els.userDialog.showModal();
}

async function sendAccountPasswordEmail(mode) {
  if (!(await ensureSupabaseClient())) return;
  const email = mode === "change" ? currentUser?.email : els.userEmail.value.trim();
  if (!email) {
    showToast("请先填写邮箱");
    els.userEmail.focus();
    return;
  }
  if (!isValidEmail(email)) {
    showToast("邮箱格式不正确");
    els.userEmail.focus();
    return;
  }

  const actionText = mode === "change" ? "修改密码" : "忘记密码";
  els.userAccountText.textContent = `正在发送${actionText}邮件...`;
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.href,
  });
  if (error) {
    els.userAccountText.textContent = `${actionText}邮件发送失败：${error.message}`;
    showToast("邮件发送失败");
    return;
  }
  els.userAccountText.textContent = `${actionText}邮件已发送，请在邮箱中打开链接。`;
  showToast("邮件已发送");
}

async function ensureSupabaseClient() {
  if (supabaseClient) return true;
  try {
    await loadSupabaseScript();
    supabaseClient = createSupabaseClient();
  } catch {
    showToast("云端组件加载失败");
    return false;
  }
  return Boolean(supabaseClient);
}

async function sendPasswordReset() {
  if (!supabaseClient) return;
  const email = els.cloudEmail.value.trim();
  if (!email) {
    showToast("请先填写邮箱");
    els.cloudEmail.focus();
    return;
  }

  setCloudStatus("正在发送重置密码邮件...");
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.href,
  });
  if (error) {
    setCloudStatus(`重置邮件发送失败：${error.message}`);
    showToast("重置邮件发送失败");
    return;
  }
  setCloudStatus("重置密码邮件已发送，请在邮箱中打开链接。");
  showToast("重置密码邮件已发送");
}

async function setCloudPassword() {
  if (!supabaseClient) return;
  const password = els.cloudPassword.value;
  if (!password || password.length < 6) {
    showToast("密码至少 6 位");
    els.cloudPassword.focus();
    return;
  }

  setCloudStatus("正在设置新密码...");
  const { error } = await supabaseClient.auth.updateUser({ password });
  if (error) {
    setCloudStatus(`密码设置失败：${error.message}`);
    showToast("密码设置失败");
    return;
  }
  passwordRecoveryMode = false;
  els.cloudPassword.value = "";
  syncCloudUi();
  setCloudStatus("密码已设置，已自动登录。");
  showToast("密码已设置");
}

function readCloudCredentials() {
  const email = els.cloudEmail.value.trim();
  const password = els.cloudPassword.value;
  if (!email) {
    showToast("请先填写邮箱");
    els.cloudEmail.focus();
    return null;
  }
  if (!isValidEmail(email)) {
    showToast("邮箱格式不正确");
    els.cloudEmail.focus();
    return null;
  }
  if (!password) {
    showToast("请先填写密码");
    els.cloudPassword.focus();
    return null;
  }
  if (password.length < 6) {
    showToast("密码至少 6 位");
    els.cloudPassword.focus();
    return null;
  }
  return { email, password };
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function signOutCloud() {
  if (!supabaseClient) return;
  await supabaseClient.auth.signOut();
  currentUser = null;
  syncCloudUi();
  showToast("已退出云端同步");
}

function syncCloudUi() {
  const signedIn = Boolean(currentUser);
  els.cloudEmail.hidden = signedIn || passwordRecoveryMode;
  els.cloudPassword.hidden = signedIn && !passwordRecoveryMode;
  els.cloudLoginBtn.hidden = signedIn || passwordRecoveryMode;
  els.cloudRegisterBtn.hidden = signedIn || passwordRecoveryMode;
  els.cloudSetPasswordBtn.hidden = !passwordRecoveryMode;
  els.cloudLogoutBtn.hidden = !signedIn || passwordRecoveryMode;
  setCloudControls(signedIn && !passwordRecoveryMode);
  if (passwordRecoveryMode) {
    setCloudStatus("请输入新密码完成设置。");
  } else {
    setCloudStatus(signedIn ? getSignedInCloudStatus() : "未登录，当前仅保存在本地。");
  }
}

function getSignedInCloudStatus() {
  if (cloudDirty) return `待同步${formatChangeSummary() ? `：${formatChangeSummary()}` : ""}`;
  if (lastCloudSyncAt) return `上次同步：${formatCloudSyncTime(lastCloudSyncAt)}`;
  return "已登录，等待同步";
}

function updateCloudDirtyStatus() {
  if (currentUser && !passwordRecoveryMode) setCloudStatus(getSignedInCloudStatus());
}

function setCloudControls(enabled) {
  els.uploadCloudBtn.disabled = !enabled;
  els.pullCloudBtn.disabled = !enabled;
}

function setCloudStatus(message) {
  els.cloudStatus.textContent = message;
  els.cloudStatus.classList.toggle("pending-sync", message.startsWith("待同步"));
}

function startCloudAutoUpload() {
  window.clearInterval(cloudAutoUploadTimer);
  if (!currentUser || !supabaseClient) return;
  cloudAutoUploadTimer = window.setInterval(() => {
    if (cloudDirty) saveCloudWorkspace(false);
  }, CLOUD_AUTO_UPLOAD_INTERVAL);
}

async function saveCloudWorkspace(manual) {
  if (!currentUser || !supabaseClient) {
    if (manual) showToast("请先登录云端同步");
    return;
  }
  const hadChanges = cloudDirty || manual;
  const syncedChanges = { ...pendingCloudChanges };
  const syncedSummary = formatChangeSummary(syncedChanges);

  setCloudStatus(manual ? "正在上传本地数据..." : "正在同步云端...");
  const { error } = await supabaseClient
    .from("workspaces")
    .upsert(
      {
        user_id: currentUser.id,
        name: CLOUD_WORKSPACE_NAME,
        data: serializeCloudState(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,name" },
    );

  if (error) {
    setCloudStatus("云端同步失败，请检查数据表和 RLS 策略。");
    if (manual) showToast("上传失败");
    return;
  }

  cloudDirty = false;
  resetPendingCloudChanges();
  lastCloudSyncAt = new Date();
  setCloudStatus(getSignedInCloudStatus());
  if (hadChanges) showToast(syncedSummary ? `数据已同步：${syncedSummary}` : "数据已同步");
}

async function loadCloudWorkspace(manual) {
  if (!currentUser || !supabaseClient) {
    if (manual) showToast("请先登录云端同步");
    return;
  }

  setCloudStatus("正在读取云端数据...");
  const { data, error } = await supabaseClient
    .from("workspaces")
    .select("data, updated_at")
    .eq("user_id", currentUser.id)
    .eq("name", CLOUD_WORKSPACE_NAME)
    .maybeSingle();

  if (error) {
    setCloudStatus("云端读取失败，请检查数据表和 RLS 策略。");
    if (manual) showToast("拉取失败");
    return;
  }

  if (!data?.data) {
    setCloudStatus("云端还没有数据，可先上传本地数据。");
    if (!manual) await saveCloudWorkspace(false);
    return;
  }

  const cloudState = normalizeCloudState(data.data);
  if (cloudDataEquals(serializeCloudState(), cloudState)) {
    cloudDirty = false;
    resetPendingCloudChanges();
    lastCloudSyncAt = data.updated_at;
    setCloudStatus(getSignedInCloudStatus());
    if (manual) showToast("本地与云端数据一致");
    return;
  }

  if (cloudConflictPromptOpen) return;
  cloudConflictPromptOpen = true;
  setCloudStatus("本地与云端数据不同");
  const useCloud = await askConfirm({
    title: "发现数据差异",
    message: "云端数据与本地数据不同。保留本地会把本地数据上传覆盖云端；保留云端会用云端数据更新本地。",
    cancelText: "保留本地",
    okText: "保留云端",
    okClass: "primary-button",
  });
  cloudConflictPromptOpen = false;

  if (!useCloud) {
    markCloudDirty();
    showToast("已保留本地，等待上传云端");
    return;
  }

  isApplyingRemoteState = true;
  state = mergeCloudState(state, cloudState);
  saveLocalState();
  normalizeLoadedState(state);
  isApplyingRemoteState = false;
  cloudDirty = false;
  resetPendingCloudChanges();
  render();
  lastCloudSyncAt = data.updated_at;
  setCloudStatus(getSignedInCloudStatus());
  if (manual) showToast("已拉取云端数据");
}

function formatCloudSyncTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getMonth() + 1}.${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function serializeCloudState() {
  return serializeStateData(state);
}

function serializeStateData(source) {
  return {
    bookmarks: source.bookmarks ?? [],
    spaces: source.spaces ?? [],
  };
}

function normalizeCloudState(cloudState) {
  const normalized = {
    activeSpaceId: DASHBOARD_ID,
    bookmarks: structuredClone(cloudState.bookmarks ?? []),
    spaces: structuredClone(cloudState.spaces ?? []),
  };
  normalizeLoadedState(normalized);
  return serializeStateData(normalized);
}

function cloudDataEquals(localState, cloudState) {
  return stableStringify(localState) === stableStringify(cloudState);
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function mergeCloudState(currentState, cloudState) {
  const merged = {
    ...currentState,
    bookmarks: cloudState.bookmarks ?? currentState.bookmarks,
    spaces: cloudState.spaces ?? currentState.spaces,
  };
  return merged;
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY) ?? LEGACY_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
  if (!saved) return createDefaultWorkspace();

  try {
    const parsed = JSON.parse(saved);
    normalizeLoadedState(parsed);
    LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    return parsed;
  } catch {
    return createDefaultWorkspace();
  }
}

function normalizeLoadedState(data) {
  data.activeSpaceId = data.activeSpaceId ?? DASHBOARD_ID;
  data.bookmarks ??= data.spaces?.flatMap((space) => space.bookmarks ?? []) ?? [];
  data.bookmarks = normalizeBookmarks(data.bookmarks);
  if (!data.bookmarks.length) data.bookmarks = getDefaultBookmarks();
  data.spaces = data.spaces?.length ? data.spaces : structuredClone(initialData.spaces);
  data.spaces.forEach((space) => {
    space.bookmarks ??= [];
    space.projects ??= [];
    space.tasks ??= [];
    space.icon = normalizeSpaceIcon(space.id, space.icon);
    if (space.id === "practice") space.name = "课外实践";
    space.projects.forEach((project) => {
      project.icon = normalizeProjectIcon(project.icon);
      project.completed = Boolean(project.completed);
    });
    space.tasks.forEach((task) => {
      task.color = normalizeColor(task.color);
      if (String(task.dueDate).includes("T")) {
        task.startTime ??= getTimeValue(task.dueDate);
        task.dueDate = getDateKey(task.dueDate);
      }
      task.startTime ??= "";
      task.endTime ??= "";
      task.location ??= "";
    });
  });
  return data;
}

function createDefaultWorkspace() {
  return hydrateInitialBookmarks(hydrateInitialSchedules(structuredClone(initialData)));
}

function hydrateInitialSchedules(data) {
  data.spaces.forEach((space) => {
    space.tasks = [];
  });
  (window.MOMENTUM_SCHEDULES ?? window.SJTUNOTION_SCHEDULES ?? []).forEach((task) => {
    const space = data.spaces.find((item) => item.id === task.spaceId);
    if (!space) return;
    space.tasks.push({
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      location: task.location ?? "",
      dueDate: task.dueDate,
      startTime: task.startTime ?? "",
      endTime: task.endTime ?? "",
      status: task.status ?? "planned",
      color: normalizeColor(task.color),
    });
  });
  return data;
}

function hydrateInitialBookmarks(data) {
  data.bookmarks = normalizeBookmarks(data.bookmarks?.length ? data.bookmarks : getDefaultBookmarks());
  return data;
}

function getDefaultBookmarks() {
  return structuredClone(window.MOMENTUM_BOOKMARKS ?? []);
}

function normalizeBookmarks(bookmarks) {
  const counters = new Map();
  return (bookmarks ?? []).map((bookmark) => {
    const category = bookmarkCategories.some((item) => item.id === bookmark.category)
      ? bookmark.category
      : inferBookmarkCategory(bookmark);
    const groupKey = `${category}:${bookmark.type}`;
    const nextOrder = counters.get(groupKey) ?? 0;
    counters.set(groupKey, nextOrder + 1);
    return {
      ...bookmark,
      category,
      order: Number.isFinite(bookmark.order) ? bookmark.order : nextOrder,
    };
  });
}

function compareBookmarks(a, b) {
  return (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title, "zh-Hans-CN");
}

function getNextBookmarkOrder(category, type) {
  const orders = state.bookmarks
    .filter((bookmark) => bookmark.category === category && bookmark.type === type)
    .map((bookmark) => bookmark.order ?? 0);
  return orders.length ? Math.max(...orders) + 1 : 0;
}

function formatBookmarkHref(bookmark) {
  const url = String(bookmark.url ?? "").trim();
  if (bookmark.type !== "folder") return url;
  if (url.startsWith("file:///")) return url;
  if (/^[A-Za-z]:[\\/]/.test(url)) return `file:///${url.replaceAll("\\", "/")}`;
  return url;
}

function bookmarkUrlToCopyPath(value) {
  const text = String(value ?? "").trim();
  if (!text.startsWith("file:///")) return text;
  try {
    return decodeURIComponent(text.replace("file:///", "")).replaceAll("/", "\\");
  } catch {
    return text.replace("file:///", "").replaceAll("/", "\\");
  }
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    els.toast.classList.remove("show");
  }, 1600);
}

function askConfirm({ title, message, cancelText = "取消", okText = "确认", okClass = "danger-button" }) {
  els.confirmTitle.textContent = title;
  els.confirmMessage.textContent = message;
  els.confirmCancelBtn.textContent = cancelText;
  els.confirmOkBtn.textContent = okText;
  els.confirmOkBtn.className = okClass;
  els.confirmDialog.showModal();
  return new Promise((resolve) => {
    confirmResolver = resolve;
  });
}

function closeConfirm(value) {
  els.confirmDialog.close();
  els.confirmCancelBtn.textContent = "取消";
  els.confirmOkBtn.textContent = "删除";
  els.confirmOkBtn.className = "danger-button";
  if (confirmResolver) {
    confirmResolver(value);
    confirmResolver = null;
  }
}

function inferBookmarkCategory(bookmark) {
  const text = `${bookmark.title ?? ""} ${bookmark.url ?? ""}`.toLowerCase();
  if (text.includes("canvas") || text.includes("sjtu") || text.includes("course") || text.includes("教务")) return "student";
  if (text.includes("scholar") || text.includes("research") || text.includes("论文") || text.includes("cnki")) return "research";
  if (text.includes("xiumi") || text.includes("canva") || text.includes("practice") || text.includes("实践") || text.includes("课外")) return "practice";
  return "life";
}

function normalizeColor(value) {
  if (projectColors.some((color) => color.value === value)) return value;
  const legacyColors = new Map([
    ["#e3e2de", "#6f6e69"],
    ["#eee0da", "#8b6b61"],
    ["#fadec9", "#c7773c"],
    ["#fdecc8", "#c29223"],
    ["#dbeddb", "#548164"],
    ["#d3e5ef", "#337ea9"],
    ["#e8deee", "#9065b0"],
    ["#f4dfeb", "#c14c8a"],
    ["#ffe2dd", "#c4554d"],
  ]);
  return legacyColors.get(value) ?? "#337ea9";
}

function normalizeProjectIcon(value) {
  if (projectSymbols.includes(value)) return value;
  const legacyMap = new Map([
    ["□", "folder"],
    ["◇", "book"],
    ["○", "flask"],
    ["△", "compass"],
    ["◎", "target"],
    ["📁", "folder"],
    ["📘", "book"],
    ["👤", "person"],
    ["🔬", "flask"],
    ["🌱", "leaf"],
    ["🧭", "compass"],
    ["🎯", "target"],
    ["💡", "bulb"],
    ["🧩", "puzzle"],
    ["🗂️", "archive"],
    ["✏️", "pencil"],
    ["📊", "chart"],
    ["🧪", "flask"],
    ["🔖", "bookmark"],
    ["🛠️", "tool"],
    ["📎", "paperclip"],
    ["⭐", "star"],
    ["🎤", "speaker"],
    ["📷", "camera"],
    ["📖", "book"],
    ["📚", "book"],
    ["📌", "bookmark"],
  ]);
  return legacyMap.get(value) ?? "folder";
}

function normalizeSpaceIcon(spaceId, value) {
  if (spaceId === "student" && value === "book") return "person";
  if (projectSymbols.includes(value)) return value;
  const defaults = {
    life: "leaf",
    student: "person",
    research: "flask",
    practice: "compass",
  };
  return defaults[spaceId] ?? normalizeProjectIcon(value);
}

function spaceIconSvg(value) {
  return projectIconSvg(normalizeProjectIcon(value));
}

function projectIconSvg(value) {
  const icon = normalizeProjectIcon(value);
  return `<span class="project-symbol" aria-hidden="true">${projectIconPath(icon)}</span>`;
}

function bookmarkTypeIconSvg(type) {
  const icons = {
    web: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M4.5 12h15M12 4.2c2.1 2.1 3.2 4.7 3.2 7.8s-1.1 5.7-3.2 7.8M12 4.2C9.9 6.3 8.8 8.9 8.8 12s1.1 5.7 3.2 7.8"/></svg>`,
    folder: projectIconPath("folder"),
  };
  return `<span class="bookmark-symbol" aria-hidden="true">${icons[type] ?? icons.web}</span>`;
}

function projectIconPath(icon) {
  const icons = {
    folder: `<svg viewBox="0 0 24 24"><path d="M3.5 7.5h6l1.8 2h9.2v8.8a1.7 1.7 0 0 1-1.7 1.7H5.2a1.7 1.7 0 0 1-1.7-1.7Z"/></svg>`,
    book: `<svg viewBox="0 0 24 24"><path d="M6 4.5h9.2A2.8 2.8 0 0 1 18 7.3v12.2H8.2A2.2 2.2 0 0 1 6 17.3Z"/><path d="M8.5 17.2H18M9 8h5.5"/></svg>`,
    person: `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.2"/><path d="M5.8 19.5a6.2 6.2 0 0 1 12.4 0"/></svg>`,
    flask: `<svg viewBox="0 0 24 24"><path d="M9 4.5h6M10 4.5v5.2l-4.6 7.8A1.7 1.7 0 0 0 6.9 20h10.2a1.7 1.7 0 0 0 1.5-2.5L14 9.7V4.5"/><path d="M8.2 16h7.6"/></svg>`,
    leaf: `<svg viewBox="0 0 24 24"><path d="M5 18.5c8.8.4 13.4-4.2 14-13.5-8.3.4-13.5 5.1-14 13.5Z"/><path d="M5 19c3.2-4.7 6.7-7.6 11-9.3"/></svg>`,
    compass: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="m14.8 8.8-1.3 4.7-4.3 1.7 1.3-4.7Z"/></svg>`,
    target: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.2"/><circle cx="12" cy="12" r="1.1"/></svg>`,
    bulb: `<svg viewBox="0 0 24 24"><path d="M8 11a4 4 0 1 1 8 0c0 1.7-.9 2.8-2 3.8-.5.5-.8 1.1-.8 1.8h-2.4c0-.7-.3-1.3-.8-1.8-1.1-1-2-2.1-2-3.8Z"/><path d="M10 19h4"/></svg>`,
    puzzle: `<svg viewBox="0 0 24 24"><path d="M8 4h4v3a1.8 1.8 0 1 0 3.6 0V4H20v6h-3a1.8 1.8 0 1 0 0 3.6h3V20h-6v-3a1.8 1.8 0 1 0-3.6 0v3H4v-6h3a1.8 1.8 0 1 0 0-3.6H4V4Z"/></svg>`,
    archive: `<svg viewBox="0 0 24 24"><path d="M4.5 6h15v4h-15ZM6.5 10v8.5h11V10"/><path d="M10 13h4"/></svg>`,
    pencil: `<svg viewBox="0 0 24 24"><path d="M5 18.5 6.2 14 15.4 4.8a2 2 0 0 1 2.8 2.8L9 16.8Z"/><path d="m14 6.2 3.8 3.8"/></svg>`,
    chart: `<svg viewBox="0 0 24 24"><path d="M5 19V5M5 19h14"/><path d="M8.5 15v-4M12 15V8M15.5 15v-6"/></svg>`,
    bookmark: `<svg viewBox="0 0 24 24"><path d="M7 5.5A1.5 1.5 0 0 1 8.5 4h7A1.5 1.5 0 0 1 17 5.5V20l-5-3.2L7 20Z"/></svg>`,
    tool: `<svg viewBox="0 0 24 24"><path d="M14.5 5.4a4.6 4.6 0 0 0 4.1 6.6L11 19.6a2.2 2.2 0 0 1-3.1-3.1l7.6-7.6a4.7 4.7 0 0 0-1-3.5Z"/></svg>`,
    paperclip: `<svg viewBox="0 0 24 24"><path d="m8.2 12.6 5.9-5.9a3 3 0 0 1 4.2 4.2l-7.1 7.1a4.2 4.2 0 0 1-5.9-5.9l7.4-7.4"/></svg>`,
    star: `<svg viewBox="0 0 24 24"><path d="m12 4.5 2.1 4.4 4.8.7-3.5 3.4.8 4.8-4.2-2.3-4.2 2.3.8-4.8-3.5-3.4 4.8-.7Z"/></svg>`,
    speaker: `<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M4.8 19.5a4.2 4.2 0 0 1 8.4 0"/><rect x="15" y="5" width="4" height="8" rx="2"/><path d="M17 13v4M14.5 17h5"/></svg>`,
    camera: `<svg viewBox="0 0 24 24"><path d="M5 8.5h3l1.3-2h5.4l1.3 2h3a1.8 1.8 0 0 1 1.8 1.8v7.4a1.8 1.8 0 0 1-1.8 1.8H5a1.8 1.8 0 0 1-1.8-1.8v-7.4A1.8 1.8 0 0 1 5 8.5Z"/><circle cx="12" cy="14" r="3"/></svg>`,
  };
  return icons[icon] ?? icons.folder;
}

function closeAndReset(form) {
  form.closest("dialog").close();
  form.reset();
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `momentum-workspace-${toDateInput(new Date())}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function loadWeather(force = false) {
  const config = getWeatherConfig();
  renderWeatherLoading(config.city);
  els.weatherRefreshBtn.disabled = true;
  els.weatherRefreshBtn.classList.toggle("loading", true);

  try {
    const weather = await fetchWeatherWithRetry(config, 2);
    renderWeather(weather);
    if (force) localStorage.setItem(`${WEATHER_CONFIG_KEY}.lastRefresh`, new Date().toISOString());
  } catch (error) {
    renderWeatherError(config.city);
  } finally {
    els.weatherRefreshBtn.disabled = false;
    els.weatherRefreshBtn.classList.toggle("loading", false);
  }
}

async function fetchWeatherWithRetry(config, retries) {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetchOpenMeteo(config);
    } catch (error) {
      lastError = error;
      if (attempt < retries) await wait(600 * (attempt + 1));
    }
  }
  throw lastError;
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function getWeatherConfig() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(WEATHER_CONFIG_KEY) ?? "{}");
  } catch {
    saved = {};
  }
  return {
    ...defaultWeatherConfig,
    ...(window.MOMENTUM_WEATHER ?? {}),
    ...saved,
  };
}

async function fetchOpenMeteo(config) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", config.latitude);
  url.searchParams.set("longitude", config.longitude);
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m");
  url.searchParams.set("timezone", "Asia/Shanghai");

  const response = await fetch(url);
  if (!response.ok) throw new Error("weather request failed");
  const data = await response.json();
  const current = data.current;
  return {
    city: config.city,
    temperature: Math.round(current.temperature_2m),
    text: weatherCodeText(current.weather_code),
    icon: weatherIconType(current.weather_code),
    humidity: current.relative_humidity_2m,
    wind: `${Math.round(current.wind_speed_10m)} km/h`,
  };
}

function renderWeatherLoading(city) {
  els.weatherSymbol.innerHTML = weatherIconSvg("loading");
  els.weatherCity.textContent = city;
  els.weatherTemp.textContent = "--℃";
  els.weatherDetail.textContent = "正在获取天气";
  els.weatherWidget.classList.remove("error");
}

function renderWeather(weather) {
  els.weatherSymbol.innerHTML = weatherIconSvg(weather.icon);
  els.weatherCity.textContent = `${weather.city} · ${weather.text}`;
  els.weatherTemp.textContent = `${weather.temperature}℃`;
  els.weatherDetail.textContent = `湿度 ${weather.humidity}% · 风 ${weather.wind}`;
  els.weatherWidget.classList.remove("error");
}

function renderWeatherError(city) {
  els.weatherSymbol.innerHTML = weatherIconSvg("error");
  els.weatherCity.textContent = city;
  els.weatherTemp.textContent = "--℃";
  els.weatherDetail.textContent = "天气获取失败，点击刷新重试";
  els.weatherWidget.classList.add("error");
}

function renderClock() {
  const now = new Date();
  const weekNames = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  els.timeDate.textContent = `${now.getMonth() + 1} 月 ${now.getDate()} 日`;
  els.timeNow.textContent = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  els.timeWeek.textContent = weekNames[now.getDay()];
  els.hourHand.style.transform = `rotate(${((hours % 12) + minutes / 60) * 30}deg)`;
  els.minuteHand.style.transform = `rotate(${(minutes + seconds / 60) * 6}deg)`;
}

function weatherCodeText(code) {
  if (code === 0) return "晴";
  if ([1, 2, 3].includes(code)) return "多云";
  if ([45, 48].includes(code)) return "雾";
  if ([51, 53, 55, 56, 57].includes(code)) return "小雨";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "雨";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "雪";
  if ([95, 96, 99].includes(code)) return "雷雨";
  return "天气";
}

function weatherIconType(code) {
  if (code === 0) return "sun";
  if ([1, 2, 3].includes(code)) return "cloud";
  if ([45, 48].includes(code)) return "fog";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "storm";
  return "cloud";
}

function weatherIconSvg(type) {
  const icons = {
    sun: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2" fill="#f6c44f"/><path d="M12 3.5v2M12 18.5v2M4.5 12h2M17.5 12h2M6.7 6.7l1.4 1.4M15.9 15.9l1.4 1.4M17.3 6.7l-1.4 1.4M8.1 15.9l-1.4 1.4" stroke="#d79b22"/></svg>`,
    cloud: `<svg viewBox="0 0 24 24"><path d="M7.5 18h9.2a3.8 3.8 0 0 0 .4-7.6A5.3 5.3 0 0 0 6.9 9.1 4.5 4.5 0 0 0 7.5 18Z" fill="#dfe7ee" stroke="#7f93a3"/></svg>`,
    rain: `<svg viewBox="0 0 24 24"><path d="M7.5 15.5h9.2a3.6 3.6 0 0 0 .4-7.2A5.2 5.2 0 0 0 7 7.3a4.3 4.3 0 0 0 .5 8.2Z" fill="#dfe7ee" stroke="#7f93a3"/><path d="M8 18.5 7.3 20M12 18.5 11.3 20M16 18.5 15.3 20" stroke="#337ea9"/></svg>`,
    snow: `<svg viewBox="0 0 24 24"><path d="M7.5 15.5h9.2a3.6 3.6 0 0 0 .4-7.2A5.2 5.2 0 0 0 7 7.3a4.3 4.3 0 0 0 .5 8.2Z" fill="#edf4f8" stroke="#7f93a3"/><path d="M8 19h.1M12 19h.1M16 19h.1" stroke="#6ba6c8"/></svg>`,
    storm: `<svg viewBox="0 0 24 24"><path d="M7.5 15.5h9.2a3.6 3.6 0 0 0 .4-7.2A5.2 5.2 0 0 0 7 7.3a4.3 4.3 0 0 0 .5 8.2Z" fill="#dfe7ee" stroke="#7f93a3"/><path d="m12.8 16.5-2 3.5h2.4l-1 2" fill="#f6c44f" stroke="#d79b22"/></svg>`,
    fog: `<svg viewBox="0 0 24 24"><path d="M7.5 14h9.2a3.6 3.6 0 0 0 .4-7.2A5.2 5.2 0 0 0 7 5.8a4.3 4.3 0 0 0 .5 8.2Z" fill="#e9ecef" stroke="#8c969f"/><path d="M5 17h14M7 20h10" stroke="#8c969f"/></svg>`,
    loading: `<svg viewBox="0 0 24 24"><path d="M12 5a7 7 0 1 1-6.3 4" stroke="#787774"/></svg>`,
    error: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#fbefed" stroke="#c4554d"/><path d="M12 7.5v5M12 16.5h.1" stroke="#c4554d"/></svg>`,
  };
  return icons[type] ?? icons.cloud;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateKey(value) {
  return String(value).slice(0, 10);
}

function getTimeValue(value) {
  return String(value).includes("T") ? String(value).slice(11, 16) : "";
}

function getStartTime(task) {
  return task.startTime ?? getTimeValue(task.dueDate);
}

function getEndTime(task) {
  return task.endTime ?? "";
}

function readTaskTimeFields(form) {
  const date = form.get("dueDate");
  const startTime = form.get("startTime");
  const endTime = form.get("endTime");

  if ((startTime && !endTime) || (!startTime && endTime)) {
    alert("如果设置小时分钟，请同时填写开始时间和结束时间。");
    return null;
  }

  if (startTime && endTime && endTime <= startTime) {
    alert("结束时间需要晚于开始时间。");
    return null;
  }

  return { dueDate: date, startTime, endTime };
}

function parseDueDate(value) {
  const [year, month, day] = getDateKey(value).split("-").map(Number);
  const [hour = 0, minute = 0] = getTimeValue(value).split(":").filter(Boolean).map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

function parseTaskStart(task) {
  return parseDueDate(task.startTime ? `${getDateKey(task.dueDate)}T${task.startTime}` : task.dueDate);
}

function formatDate(value) {
  const date = parseDueDate(value);
  const time = getTimeValue(value);
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日${time ? ` ${time}` : ""}`;
}

function formatTaskDate(task) {
  const date = formatDateOnly(task.dueDate);
  const startTime = getStartTime(task);
  const endTime = getEndTime(task);
  if (startTime && endTime) return `${date} ${startTime}-${endTime}`;
  if (startTime) return `${date} ${startTime}`;
  return date;
}

function formatTaskTitle(task) {
  return `${task.title}${task.location ? `（${task.location}）` : ""}`;
}

function renderTaskTitle(task) {
  return `${escapeHtml(task.title)}${task.location ? `<span class="task-location">（${escapeHtml(task.location)}）</span>` : ""}`;
}

function renderCalendarEventLabel(task) {
  const startTime = getStartTime(task);
  return `${startTime ? `${escapeHtml(startTime)} ` : ""}${renderTaskTitle(task)}`;
}

function formatCalendarDateLabel(date, includeYear = false) {
  const currentYear = new Date().getFullYear();
  if (includeYear && date.getFullYear() !== currentYear) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  }
  return String(date.getDate());
}

function formatProjectDuration(tasks, dateOnly = false) {
  if (!tasks.length) return "暂无时间";
  const sortedTasks = tasks
    .slice()
    .sort((a, b) => parseTaskStart(a) - parseTaskStart(b));
  const startTask = sortedTasks[0];
  const endTask = sortedTasks[sortedTasks.length - 1];
  const start = startTask.dueDate;
  const end = endTask.dueDate;
  if (getDateKey(start) === getDateKey(end)) return dateOnly ? formatDateOnly(start) : formatTaskDate(startTask);
  return `${dateOnly ? formatDateOnly(start) : formatTaskDate(startTask)} - ${dateOnly ? formatDateOnly(end) : formatTaskDate(endTask)}`;
}

function formatDateOnly(value) {
  const date = parseDueDate(value);
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
}

function formatFullDate(value) {
  const date = parseDueDate(value);
  const weekNames = ["日", "一", "二", "三", "四", "五", "六"];
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日 · 周${weekNames[date.getDay()]}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
