const STORAGE_KEY = "focus-ledger.tasks.v1";
const VALID_CATEGORIES = ["today", "week", "month", "long-term"];
const VALID_PRIORITIES = ["low", "medium", "high"];

function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeTask(input = {}) {
  const category = VALID_CATEGORIES.includes(input.category) ? input.category : "today";
  const priority = VALID_PRIORITIES.includes(input.priority) ? input.priority : "medium";

  return {
    id: String(input.id || createId()),
    title: String(input.title || "").trim(),
    description: String(input.description || "").trim(),
    category,
    priority,
    dueDate: String(input.dueDate || ""),
    completed: Boolean(input.completed),
    createdAt: input.createdAt || new Date().toISOString(),
  };
}

// Storage is deliberately isolated so it can later be replaced by Supabase.
function loadTasks() {
  try {
    const stored = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.map(normalizeTask).filter((task) => task.title) : [];
  } catch (error) {
    console.warn("Unable to read saved tasks.", error);
    return [];
  }
}

function saveTasks(tasks) {
  const normalized = tasks.map(normalizeTask).filter((task) => task.title);
  globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

function addTask(input) {
  const task = normalizeTask(input);
  if (!task.title) throw new Error("Task title is required.");

  saveTasks([...loadTasks(), task]);
  return task;
}

function updateTask(id, changes) {
  let updatedTask = null;
  const tasks = loadTasks().map((task) => {
    if (task.id !== id) return task;

    updatedTask = normalizeTask({ ...task, ...changes, id: task.id, createdAt: task.createdAt });
    if (!updatedTask.title) throw new Error("Task title is required.");
    return updatedTask;
  });

  if (!updatedTask) return null;
  saveTasks(tasks);
  return updatedTask;
}

function deleteTask(id) {
  const tasks = loadTasks();
  const remaining = tasks.filter((task) => task.id !== id);
  if (remaining.length === tasks.length) return false;

  saveTasks(remaining);
  return true;
}

function getVisibleTasks(tasks, view, filter = "all", sort = "created") {
  let visible = tasks.filter((task) => (
    view === "completed" ? task.completed : task.category === view
  ));

  if (view !== "completed") {
    if (filter === "open") visible = visible.filter((task) => !task.completed);
    if (filter === "completed") visible = visible.filter((task) => task.completed);
  }

  const priorityRank = { high: 0, medium: 1, low: 2 };
  const createdTime = (task) => new Date(task.createdAt).getTime() || 0;

  return [...visible].sort((a, b) => {
    if (sort === "priority") {
      return priorityRank[a.priority] - priorityRank[b.priority] || createdTime(b) - createdTime(a);
    }
    if (sort === "dueDate") {
      if (!a.dueDate && !b.dueDate) return createdTime(b) - createdTime(a);
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate) || createdTime(b) - createdTime(a);
    }
    return createdTime(b) - createdTime(a);
  });
}

const VIEW_INFO = {
  today: {
    title: "Today",
    description: "把今天最重要的事情放在眼前。",
  },
  week: {
    title: "This Week",
    description: "为本周建立可执行的节奏。",
  },
  month: {
    title: "This Month",
    description: "关注这个月真正值得推进的目标。",
  },
  "long-term": {
    title: "Long Term",
    description: "记录需要持续投入的长期方向。",
  },
  completed: {
    title: "Completed",
    description: "回看已经完成的工作，也可以随时恢复任务。",
  },
};

const CATEGORY_LABELS = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  "long-term": "Long Term",
};

const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

function formatLocalDate(date = new Date()) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}

function parseDateOnly(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDueDate(value) {
  const date = parseDateOnly(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric" }).format(date);
}

function isOverdue(task) {
  const dueDate = parseDateOnly(task.dueDate);
  if (!dueDate || task.completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
}

function initializeApp() {
  const elements = {
    navButtons: [...document.querySelectorAll("[data-view]")],
    countBadges: [...document.querySelectorAll("[data-count]")],
    filterButtons: [...document.querySelectorAll("[data-filter]")],
    filterGroup: document.querySelector(".filter-group"),
    currentDate: document.querySelector("#current-date"),
    pageTitle: document.querySelector("#page-title"),
    pageDescription: document.querySelector("#page-description"),
    addButton: document.querySelector("#add-task-button"),
    emptyAddButton: document.querySelector("#empty-add-button"),
    sortSelect: document.querySelector("#sort-select"),
    taskList: document.querySelector("#task-list"),
    visibleCount: document.querySelector("#visible-count"),
    emptyState: document.querySelector("#empty-state"),
    emptyTitle: document.querySelector("#empty-title"),
    emptyDescription: document.querySelector("#empty-description"),
    openCount: document.querySelector("#open-count"),
    doneCount: document.querySelector("#done-count"),
    sidebarOpenCount: document.querySelector("#sidebar-open-count"),
    sidebarDoneCount: document.querySelector("#sidebar-done-count"),
    progressSentence: document.querySelector("#progress-sentence"),
    progressBar: document.querySelector("#progress-bar"),
    dialog: document.querySelector("#task-dialog"),
    form: document.querySelector("#task-form"),
    dialogKicker: document.querySelector("#dialog-kicker"),
    dialogTitle: document.querySelector("#dialog-title"),
    closeDialogButton: document.querySelector("#close-dialog-button"),
    cancelDialogButton: document.querySelector("#cancel-dialog-button"),
    taskId: document.querySelector("#task-id"),
    taskTitle: document.querySelector("#task-title"),
    titleError: document.querySelector("#title-error"),
    taskDescription: document.querySelector("#task-description"),
    taskCategory: document.querySelector("#task-category"),
    taskDueDate: document.querySelector("#task-due-date"),
    toast: document.querySelector("#toast"),
  };

  const state = {
    tasks: loadTasks(),
    view: "today",
    lastTaskView: "today",
    filter: "all",
    sort: "created",
    editingId: null,
  };

  let toastTimer;

  function showToast(message) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    toastTimer = setTimeout(() => elements.toast.classList.remove("is-visible"), 2600);
  }

  function refreshTasks() {
    state.tasks = loadTasks();
  }

  function getViewTasks() {
    return state.tasks.filter((task) => (
      state.view === "completed" ? task.completed : task.category === state.view
    ));
  }

  function createIconButton(action, label, iconId, extraClass = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `icon-button ${extraClass}`.trim();
    button.dataset.action = action;
    button.setAttribute("aria-label", label);
    button.title = label;
    button.innerHTML = `<svg aria-hidden="true"><use href="#${iconId}"></use></svg>`;
    return button;
  }

  function createTaskCard(task, index) {
    const card = document.createElement("article");
    card.className = `task-card priority-${task.priority}${task.completed ? " is-completed" : ""}`;
    card.dataset.taskId = task.id;
    card.style.animationDelay = `${Math.min(index * 32, 160)}ms`;

    const checkLabel = document.createElement("label");
    checkLabel.className = "task-check";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.dataset.action = "toggle";
    checkbox.setAttribute("aria-label", task.completed ? `恢复任务：${task.title}` : `完成任务：${task.title}`);
    const checkVisual = document.createElement("span");
    checkVisual.className = "check-visual";
    checkVisual.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m7 12 3 3 7-7"></path></svg>';
    checkLabel.append(checkbox, checkVisual);

    const content = document.createElement("div");
    content.className = "task-content";
    const title = document.createElement("h3");
    title.className = "task-title";
    title.textContent = task.title;
    content.append(title);

    if (task.description) {
      const description = document.createElement("p");
      description.className = "task-description";
      description.textContent = task.description;
      content.append(description);
    }

    const meta = document.createElement("div");
    meta.className = "task-meta";
    const priority = document.createElement("span");
    priority.className = `priority-badge ${task.priority}`;
    priority.textContent = PRIORITY_LABELS[task.priority];
    meta.append(priority);

    if (state.view === "completed") {
      const category = document.createElement("span");
      category.textContent = CATEGORY_LABELS[task.category];
      meta.append(category);
    }

    if (task.dueDate) {
      const due = document.createElement("span");
      due.className = `due-date${isOverdue(task) ? " is-overdue" : ""}`;
      due.textContent = `${isOverdue(task) ? "已逾期" : "截止"} ${formatDueDate(task.dueDate)}`;
      meta.append(due);
    }

    const created = document.createElement("span");
    created.textContent = `创建于 ${formatDueDate(task.createdAt.slice(0, 10))}`;
    meta.append(created);
    content.append(meta);

    const actions = document.createElement("div");
    actions.className = "task-actions";
    actions.append(
      createIconButton("edit", `编辑任务：${task.title}`, "icon-edit"),
      createIconButton("delete", `删除任务：${task.title}`, "icon-trash", "delete-button"),
    );

    card.append(checkLabel, content, actions);
    return card;
  }

  function renderNavigation() {
    elements.navButtons.forEach((button) => {
      const isActive = button.dataset.view === state.view;
      button.classList.toggle("is-active", isActive);
      if (isActive) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });

    elements.countBadges.forEach((badge) => {
      const category = badge.dataset.count;
      const count = category === "completed"
        ? state.tasks.filter((task) => task.completed).length
        : state.tasks.filter((task) => task.category === category && !task.completed).length;
      badge.textContent = String(count);
    });
  }

  function renderHeader() {
    const viewInfo = VIEW_INFO[state.view];
    elements.pageTitle.textContent = viewInfo.title;
    elements.pageDescription.textContent = viewInfo.description;
    document.title = `${viewInfo.title} · Focus Ledger`;
    elements.filterGroup.hidden = state.view === "completed";
  }

  function renderProgress() {
    const viewTasks = getViewTasks();
    const open = viewTasks.filter((task) => !task.completed).length;
    const done = viewTasks.filter((task) => task.completed).length;
    const total = open + done;
    const percent = total ? Math.round((done / total) * 100) : 0;
    const allOpen = state.tasks.filter((task) => !task.completed).length;
    const allDone = state.tasks.length - allOpen;

    elements.openCount.textContent = String(open);
    elements.doneCount.textContent = String(done);
    elements.sidebarOpenCount.textContent = String(allOpen);
    elements.sidebarDoneCount.textContent = String(allDone);
    elements.progressBar.style.width = `${percent}%`;

    if (!total) {
      elements.progressSentence.textContent = state.view === "completed"
        ? "完成一项任务后，它会被收录在这里。"
        : "还没有任务，从一件小事开始。";
    } else if (state.view === "completed") {
      elements.progressSentence.textContent = `你已经完成 ${done} 项任务。`;
    } else if (open === 0) {
      elements.progressSentence.textContent = "这一阶段的任务已经全部完成。";
    } else {
      elements.progressSentence.textContent = `已完成 ${percent}%，还有 ${open} 项值得专注。`;
    }
  }

  function renderTasks() {
    const visibleTasks = getVisibleTasks(state.tasks, state.view, state.filter, state.sort);
    elements.taskList.replaceChildren(...visibleTasks.map(createTaskCard));
    elements.visibleCount.textContent = `${visibleTasks.length} 项`;
    elements.emptyState.hidden = visibleTasks.length > 0;

    if (visibleTasks.length === 0) {
      const hasViewTasks = getViewTasks().length > 0;
      if (hasViewTasks && state.view !== "completed") {
        elements.emptyTitle.textContent = "没有符合筛选条件的任务";
        elements.emptyDescription.textContent = "切换筛选条件，就能看到其他任务。";
        elements.emptyAddButton.hidden = true;
      } else {
        elements.emptyTitle.textContent = state.view === "completed" ? "还没有已完成任务" : "这里还没有任务";
        elements.emptyDescription.textContent = state.view === "completed"
          ? "完成的任务会集中显示在这里，并且可以随时恢复。"
          : "添加一个任务，为这一段时间确定清晰的方向。";
        elements.emptyAddButton.hidden = state.view === "completed";
      }
    }
  }

  function render() {
    renderNavigation();
    renderHeader();
    renderProgress();
    renderTasks();
  }

  function closeDialog() {
    if (elements.dialog.open) elements.dialog.close();
  }

  function openTaskDialog(task = null) {
    elements.form.reset();
    elements.titleError.textContent = "";
    elements.taskTitle.removeAttribute("aria-invalid");
    state.editingId = task?.id || null;
    elements.taskId.value = task?.id || "";
    elements.dialogKicker.textContent = task ? "EDIT ENTRY" : "NEW ENTRY";
    elements.dialogTitle.textContent = task ? "编辑任务" : "新增任务";
    elements.taskTitle.value = task?.title || "";
    elements.taskDescription.value = task?.description || "";
    elements.taskCategory.value = task?.category || state.lastTaskView;
    elements.taskDueDate.value = task?.dueDate || "";
    const priority = task?.priority || "medium";
    elements.form.querySelector(`input[name="priority"][value="${priority}"]`).checked = true;
    elements.dialog.showModal();
    requestAnimationFrame(() => elements.taskTitle.focus());
  }

  function changeView(view) {
    if (!VIEW_INFO[view]) return;
    state.view = view;
    if (view !== "completed") state.lastTaskView = view;
    state.filter = "all";
    elements.filterButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.filter === "all");
    });
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  elements.currentDate.textContent = formatLocalDate();
  elements.navButtons.forEach((button) => {
    button.addEventListener("click", () => changeView(button.dataset.view));
  });

  elements.filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      elements.filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      renderTasks();
    });
  });

  elements.sortSelect.addEventListener("change", () => {
    state.sort = elements.sortSelect.value;
    renderTasks();
  });

  elements.addButton.addEventListener("click", () => openTaskDialog());
  elements.emptyAddButton.addEventListener("click", () => openTaskDialog());
  elements.closeDialogButton.addEventListener("click", closeDialog);
  elements.cancelDialogButton.addEventListener("click", closeDialog);

  elements.dialog.addEventListener("click", (event) => {
    if (event.target === elements.dialog) {
      const rect = elements.dialog.getBoundingClientRect();
      const inside = event.clientX >= rect.left && event.clientX <= rect.right
        && event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (!inside) closeDialog();
    }
  });

  elements.dialog.addEventListener("close", () => {
    state.editingId = null;
    elements.taskId.value = "";
  });

  elements.taskTitle.addEventListener("input", () => {
    if (elements.taskTitle.value.trim()) {
      elements.titleError.textContent = "";
      elements.taskTitle.removeAttribute("aria-invalid");
    }
  });

  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = elements.taskTitle.value.trim();
    if (!title) {
      elements.titleError.textContent = "请输入任务标题。";
      elements.taskTitle.setAttribute("aria-invalid", "true");
      elements.taskTitle.focus();
      return;
    }

    const values = {
      title,
      description: elements.taskDescription.value,
      category: elements.taskCategory.value,
      dueDate: elements.taskDueDate.value,
      priority: elements.form.querySelector('input[name="priority"]:checked').value,
    };

    try {
      if (state.editingId) {
        updateTask(state.editingId, values);
        showToast("任务已更新");
      } else {
        addTask(values);
        showToast("任务已添加");
      }
      refreshTasks();
      closeDialog();
      render();
    } catch (error) {
      console.error(error);
      showToast("保存失败，请检查浏览器存储权限");
    }
  });

  elements.taskList.addEventListener("change", (event) => {
    if (event.target.dataset.action !== "toggle") return;
    const card = event.target.closest("[data-task-id]");
    try {
      updateTask(card.dataset.taskId, { completed: event.target.checked });
      refreshTasks();
      render();
      showToast(event.target.checked ? "任务已完成" : "任务已恢复");
    } catch (error) {
      console.error(error);
      showToast("更新失败，请重试");
      render();
    }
  });

  elements.taskList.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton || actionButton.dataset.action === "toggle") return;
    const card = actionButton.closest("[data-task-id]");
    const task = state.tasks.find((item) => item.id === card.dataset.taskId);
    if (!task) return;

    if (actionButton.dataset.action === "edit") {
      openTaskDialog(task);
      return;
    }

    if (actionButton.dataset.action === "delete") {
      try {
        deleteTask(task.id);
        refreshTasks();
        render();
        showToast("任务已删除");
      } catch (error) {
        console.error(error);
        showToast("删除失败，请重试");
      }
    }
  });

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      refreshTasks();
      render();
    }
  });

  render();
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initializeApp);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    STORAGE_KEY,
    normalizeTask,
    loadTasks,
    saveTasks,
    addTask,
    updateTask,
    deleteTask,
    getVisibleTasks,
  };
}
