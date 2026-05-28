const defaultState = {
  users: [],
  sessionUserId: null,
  members: [],
  billing: {
    plan: "Free",
    amount: "Rs 0/month",
    memberLimit: 5,
    renewal: "Not applicable",
    savedCard: null
  },
  passwordResetLog: "No reset requests yet.",
  tasks: [],
  snippets: [],
  activity: [],
  comments: [],
  notifications: []
};

const SESSION_TOKEN_KEY = "devcollab-auth-token";

let state = structuredClone(defaultState);
let currentTab = null;
let currentAuthView = "signin";
let currentTaskView = "board";
let currentSnippetId = "auth";
let authToken = "";

const authShell = document.getElementById("auth-shell");
const appShell = document.getElementById("app-shell");
const authSwitches = document.querySelectorAll(".auth-switch");
const authForms = document.querySelectorAll(".auth-form");
const authTitle = document.getElementById("auth-title");
const authModePill = document.getElementById("auth-mode-pill");
const menuToggle = document.getElementById("menu-toggle");
const topbarMenu = document.getElementById("topbar-menu");
const selectionState = document.getElementById("selection-state");
const topbarTabs = document.querySelectorAll(".topbar-tab");
const tabPanels = document.querySelectorAll(".tab-panel");
const jumpTabButtons = document.querySelectorAll("[data-jump-tab]");
const viewTabs = document.querySelectorAll(".view-tab");
const taskPanels = document.querySelectorAll(".task-view");
const sessionIndicator = document.getElementById("session-indicator");
const logoutButton = document.getElementById("logout-button");
const workspaceNameDisplay = document.getElementById("workspace-name-display");
const workspaceSubtitle = document.getElementById("workspace-subtitle");
const toastStack = document.getElementById("toast-stack");
const snippetSearch = document.getElementById("snippet-search");
const snippetList = document.getElementById("snippet-list");
const snippetCode = document.querySelector("#snippet-code code");
const snippetTitle = document.getElementById("snippet-title");
const snippetScore = document.getElementById("snippet-score");
const snippetReview = document.getElementById("snippet-review");
const generatedTasks = document.getElementById("generated-tasks");
const featureInput = document.getElementById("feature-input");
const taskTable = document.getElementById("task-table");
const taskCalendar = document.getElementById("task-calendar");
const commentsFeed = document.getElementById("comments-feed");
const commentInput = document.getElementById("comment-input");
const memberList = document.getElementById("member-list");
const billingPlanName = document.getElementById("billing-plan-name");
const billingPlanAmount = document.getElementById("billing-plan-amount");
const billingMemberUsage = document.getElementById("billing-member-usage");
const billingRenewal = document.getElementById("billing-renewal");
const savedCardBox = document.getElementById("saved-card-box");
const profileBox = document.getElementById("profile-box");
const recoveryBox = document.getElementById("recovery-box");
const workspaceNotification = document.getElementById("workspace-notification");
const aiOutputBox = document.getElementById("ai-output-box");
const notificationList = document.getElementById("notification-list");
const notificationCount = document.getElementById("notification-count");
const notificationButton = document.getElementById("notification-button");
const presenceStatus = document.getElementById("presence-status");

function getStoredToken() {
  try {
    return window.sessionStorage.getItem(SESSION_TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

function persistToken(token) {
  authToken = token || "";
}

function normalizeState(candidate) {
  const next = { ...structuredClone(defaultState), ...candidate };
  next.users = Array.isArray(next.users) ? next.users : [];
  next.members = Array.isArray(next.members) ? next.members : [];
  next.tasks = Array.isArray(next.tasks) ? next.tasks : [];
  next.snippets = Array.isArray(next.snippets) ? next.snippets : [];
  next.activity = Array.isArray(next.activity) ? next.activity : [];
  next.comments = Array.isArray(next.comments) ? next.comments : [];
  next.notifications = Array.isArray(next.notifications) ? next.notifications : [];
  return next;
}

async function apiRequest(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const response = await fetch(path, { ...options, headers });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error || "Request failed.");
  return payload;
}

function applyServerState(payload) {
  if (payload?.token) persistToken(payload.token);
  if (payload?.state) {
    state = normalizeState(payload.state);
    currentSnippetId = state.snippets[0]?.id || currentSnippetId;
  }
}

function setText(element, value) {
  if (element) element.textContent = value;
}

function bindSubmit(id, handler) {
  const form = document.getElementById(id);
  if (form) form.addEventListener("submit", handler);
}

function bindClick(id, handler) {
  const element = document.getElementById(id);
  if (element) element.addEventListener("click", handler);
}

function showToast(message) {
  if (!toastStack) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toastStack.appendChild(toast);
  setTimeout(() => toast.remove(), 2600);
}

function getSessionUser() {
  return state.users.find((user) => user.id === state.sessionUserId) || null;
}

function updateAuthVisibility() {
  const isAuthenticated = Boolean(getSessionUser());
  authShell.classList.toggle("hidden", isAuthenticated);
  appShell.classList.toggle("hidden", !isAuthenticated);
}

function setTab(tab) {
  currentTab = tab;
  topbarTabs.forEach((button) => button.classList.toggle("active", button.dataset.tab === tab));
  tabPanels.forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === tab));
  if (selectionState) selectionState.classList.toggle("hidden", Boolean(tab));
  if (tab && topbarMenu) topbarMenu.classList.remove("open");
  if (tab && menuToggle) menuToggle.setAttribute("aria-expanded", "false");
}

function setTaskView(view) {
  currentTaskView = view;
  viewTabs.forEach((button) => button.classList.toggle("active", button.dataset.taskView === view));
  taskPanels.forEach((panel) => panel.classList.toggle("active", panel.dataset.taskPanel === view));
}

function setAuthView(view) {
  currentAuthView = view;
  authSwitches.forEach((button) => button.classList.toggle("active", button.dataset.authView === view));
  authForms.forEach((form) => form.classList.toggle("active", form.id === `${view}-form`));
  const copy = {
    signin: ["Sign in to DevCollab", "Secure Access"],
    signup: ["Create your DevCollab account", "New Workspace"],
    forgot: ["Reset your DevCollab password", "Recovery"],
    reset: ["Set a new DevCollab password", "Password Update"]
  }[view];
  setText(authTitle, copy[0]);
  setText(authModePill, copy[1]);
}

function renderBoard() {
  document.querySelectorAll(".column").forEach((column) => {
    const status = column.dataset.status;
    const items = state.tasks.filter((task) => task.status === status);
    const count = column.querySelector(".count");
    if (count) count.textContent = String(items.length);
    column.querySelectorAll(".task").forEach((card) => card.remove());
    items.forEach((task) => {
      const card = document.createElement("article");
      card.className = "task";
      card.draggable = true;
      card.dataset.taskId = task.id;
      card.innerHTML = `
        <span class="task-tag ${task.priority}">${task.priority.toUpperCase()}</span>
        <h4>${task.title}</h4>
        <div class="task-meta">
          <span>${task.meta}</span>
          <span>${task.updated}</span>
        </div>
      `;
      card.addEventListener("dragstart", (event) => event.dataTransfer.setData("text/plain", task.id));
      column.appendChild(card);
    });
  });
}

function renderTaskTable() {
  if (!taskTable) return;
  taskTable.innerHTML = `
    <div class="task-row header">
      <strong>Task</strong>
      <strong>Status</strong>
      <strong>Owner</strong>
      <strong>Due</strong>
    </div>
    ${state.tasks.map((task) => `
      <div class="task-row">
        <strong>${task.title}</strong>
        <span>${task.status}</span>
        <span>${task.meta}</span>
        <span>${task.due}</span>
      </div>
    `).join("")}
  `;
}

function renderTaskCalendar() {
  if (!taskCalendar) return;
  taskCalendar.innerHTML = state.tasks.map((task) => `
    <article class="calendar-card">
      <strong>${task.due}</strong>
      <p>${task.title}</p>
      <p>${task.status} | ${task.meta}</p>
    </article>
  `).join("");
}

function renderSnippets(filter = "") {
  if (!snippetList) return;
  const query = filter.trim().toLowerCase();
  const filtered = state.snippets.filter((snippet) => `${snippet.title} ${snippet.tags.join(" ")}`.toLowerCase().includes(query));
  if (!filtered.some((snippet) => snippet.id === currentSnippetId)) {
    currentSnippetId = filtered[0]?.id || state.snippets[0]?.id || currentSnippetId;
  }
  snippetList.innerHTML = "";
  filtered.forEach((snippet) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `snippet-item${snippet.id === currentSnippetId ? " active" : ""}`;
    button.innerHTML = `<strong>${snippet.title}</strong><p>${snippet.tags.join(" | ")}</p>`;
    button.addEventListener("click", () => {
      currentSnippetId = snippet.id;
      renderSnippets(snippetSearch ? snippetSearch.value : "");
      renderSnippetDetails();
    });
    snippetList.appendChild(button);
  });
}

function renderSnippetDetails() {
  if (!snippetCode || !snippetTitle || !snippetScore || !snippetReview || !state.snippets.length) return;
  const snippet = state.snippets.find((item) => item.id === currentSnippetId) || state.snippets[0];
  snippetTitle.textContent = snippet.title;
  snippetScore.textContent = snippet.score;
  snippetCode.textContent = snippet.code;
  snippetReview.innerHTML = snippet.review.map((item) => `<li>${item}</li>`).join("");
}

function renderComments() {
  if (!commentsFeed) return;
  commentsFeed.innerHTML = state.comments.map((comment) => `
    <div class="comment-card">
      <strong>${comment.author}</strong>
      <p>${comment.text.replace(/@(\w+)/g, '<span class="mention">@$1</span>')}</p>
      <p>${comment.time}</p>
    </div>
  `).join("");
}

function renderMembers() {
  if (!memberList) return;
  memberList.innerHTML = "";
  state.members.forEach((member) => {
    const item = document.createElement("div");
    item.className = "member-item";
    item.innerHTML = `
      <div class="member-main">
        <strong>${member.name}</strong>
        <p>${member.email}</p>
      </div>
      <div class="member-meta">
        <span>${member.role}</span>
        <span>${member.id}</span>
      </div>
      <div class="member-actions">
        <button class="button button-secondary" type="button" data-member-action="promote" data-member-id="${member.id}">Promote</button>
        <button class="button button-secondary" type="button" data-member-action="remove" data-member-id="${member.id}">Remove</button>
      </div>
    `;
    memberList.appendChild(item);
  });
  memberList.querySelectorAll("[data-member-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const payload = await apiRequest(`/api/members/${button.dataset.memberId}`, {
          method: "PATCH",
          body: JSON.stringify({ action: button.dataset.memberAction })
        });
        applyServerState(payload);
        syncUI();
        showToast(button.dataset.memberAction === "promote" ? "Member promoted." : "Member removed.");
      } catch (error) {
        showToast(error.message);
      }
    });
  });
}

function renderBilling() {
  setText(billingPlanName, state.billing.plan);
  setText(billingPlanAmount, state.billing.amount);
  setText(billingMemberUsage, `${state.members.length} / ${state.billing.memberLimit >= 999999 ? "Unlimited" : state.billing.memberLimit}`);
  setText(billingRenewal, state.billing.renewal);
  if (!savedCardBox) return;
  savedCardBox.innerHTML = state.billing.savedCard
    ? `<strong>Saved card</strong><p>${state.billing.savedCard.name}</p><p>${state.billing.savedCard.masked}</p>`
    : `<strong>No card saved yet.</strong>`;
}

function renderNotifications() {
  if (!notificationList || !notificationCount) return;
  notificationList.innerHTML = state.notifications.map((item) => `
    <div class="notification-item${item.unread ? " unread" : ""}">
      <strong>${item.title}</strong>
      <p>${item.body}</p>
    </div>
  `).join("");
  notificationCount.textContent = String(state.notifications.filter((item) => item.unread).length);
}

function renderAccount() {
  const user = getSessionUser();
  if (!user) {
    setText(sessionIndicator, "Signed out");
    return;
  }
  setText(sessionIndicator, `Signed in: ${user.name.split(/\s+/)[0] || user.name}`);
  setText(workspaceNameDisplay, user.workspaceName || "DevCollab");
  setText(workspaceSubtitle, user.workspaceDescription || "Student developer workspace");
  if (profileBox) {
    profileBox.innerHTML = `<strong>${user.name}</strong><p>Avatar: ${user.profile.avatar}</p><p>${user.email}</p><p>${user.profile.bio}</p><p>Skills: ${user.profile.skills}</p><p>GitHub: ${user.profile.github}</p>`;
  }
  const avatar = document.getElementById("profile-avatar");
  const bio = document.getElementById("profile-bio");
  const skills = document.getElementById("profile-skills");
  const github = document.getElementById("profile-github");
  if (avatar) avatar.value = user.profile.avatar;
  if (bio) bio.value = user.profile.bio;
  if (skills) skills.value = user.profile.skills;
  if (github) github.value = user.profile.github;
  if (recoveryBox) recoveryBox.innerHTML = `<strong>Recovery log</strong><p>${state.passwordResetLog}</p>`;
}

function syncUI() {
  state = normalizeState(state);
  updateAuthVisibility();
  renderBoard();
  renderTaskTable();
  renderTaskCalendar();
  renderSnippets(snippetSearch ? snippetSearch.value || "" : "");
  renderSnippetDetails();
  renderComments();
  renderMembers();
  renderBilling();
  renderNotifications();
  renderAccount();
}

function requireSession(actionName) {
  if (getSessionUser()) return true;
  showToast(`Sign in first to use ${actionName}.`);
  return false;
}

topbarTabs.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.tab === currentTab) {
      setTab(null);
      if (topbarMenu && menuToggle) {
        topbarMenu.classList.add("open");
        menuToggle.setAttribute("aria-expanded", "true");
      }
      return;
    }
    setTab(button.dataset.tab);
  });
});

jumpTabButtons.forEach((button) => button.addEventListener("click", () => setTab(button.dataset.jumpTab)));
viewTabs.forEach((button) => button.addEventListener("click", () => setTaskView(button.dataset.taskView)));
authSwitches.forEach((button) => button.addEventListener("click", () => setAuthView(button.dataset.authView)));

if (menuToggle && topbarMenu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = topbarMenu.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

bindSubmit("signin-form", async (event) => {
  event.preventDefault();
  try {
    const payload = await apiRequest("/api/auth/signin", {
      method: "POST",
      body: JSON.stringify({
        email: document.getElementById("signin-email").value.trim().toLowerCase(),
        password: document.getElementById("signin-password").value
      })
    });
    applyServerState(payload);
    syncUI();
    setTab(null);
    if (topbarMenu && menuToggle) {
      topbarMenu.classList.add("open");
      menuToggle.setAttribute("aria-expanded", "true");
    }
    setText(workspaceNotification, "Local database sync is active");
    setText(presenceStatus, "Local workspace ready");
    showToast(`Welcome back, ${payload.user.name}.`);
  } catch (error) {
    showToast(error.message);
  }
});

bindSubmit("signup-form", async (event) => {
  event.preventDefault();
  try {
    const payload = await apiRequest("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        name: document.getElementById("signup-name").value.trim(),
        email: document.getElementById("signup-email").value.trim().toLowerCase(),
        password: document.getElementById("signup-password").value,
        workspaceName: document.getElementById("signup-workspace").value.trim(),
        github: document.getElementById("signup-github").value.trim()
      })
    });
    applyServerState(payload);
    syncUI();
    setTab(null);
    if (topbarMenu && menuToggle) {
      topbarMenu.classList.add("open");
      menuToggle.setAttribute("aria-expanded", "true");
    }
    showToast("Account and workspace created.");
  } catch (error) {
    showToast(error.message);
  }
});

bindSubmit("forgot-form", async (event) => {
  event.preventDefault();
  try {
    const payload = await apiRequest("/api/auth/forgot", {
      method: "POST",
      body: JSON.stringify({ email: document.getElementById("forgot-email").value.trim().toLowerCase() })
    });
    showToast(payload.message);
    setAuthView("reset");
    const bootstrap = await apiRequest("/api/bootstrap");
    applyServerState(bootstrap);
    syncUI();
  } catch (error) {
    showToast(error.message);
  }
});

bindSubmit("reset-form", async (event) => {
  event.preventDefault();
  try {
    const payload = await apiRequest("/api/auth/reset", {
      method: "POST",
      body: JSON.stringify({
        email: document.getElementById("reset-email").value.trim().toLowerCase(),
        password: document.getElementById("reset-password").value
      })
    });
    applyServerState(payload);
    syncUI();
    setTab(null);
    if (topbarMenu && menuToggle) {
      topbarMenu.classList.add("open");
      menuToggle.setAttribute("aria-expanded", "true");
    }
    showToast("Password updated.");
  } catch (error) {
    showToast(error.message);
  }
});

logoutButton?.addEventListener("click", async () => {
  try {
    await apiRequest("/api/auth/logout", { method: "POST" });
  } catch {}
  persistToken("");
  const payload = await apiRequest("/api/bootstrap");
  applyServerState(payload);
  syncUI();
  setAuthView("signin");
  setTab(null);
  showToast("Logged out.");
});

document.querySelectorAll(".column").forEach((column) => {
  column.addEventListener("dragover", (event) => {
    event.preventDefault();
    column.classList.add("drag-over");
  });
  column.addEventListener("dragleave", () => column.classList.remove("drag-over"));
  column.addEventListener("drop", async (event) => {
    event.preventDefault();
    column.classList.remove("drag-over");
    if (!requireSession("the board")) return;
    try {
      const payload = await apiRequest(`/api/tasks/${event.dataTransfer.getData("text/plain")}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: column.dataset.status })
      });
      applyServerState(payload);
      syncUI();
      setText(workspaceNotification, `Task moved to ${column.querySelector("h3").textContent}`);
      showToast("Task updated.");
    } catch (error) {
      showToast(error.message);
    }
  });
});

snippetSearch?.addEventListener("input", () => {
  renderSnippets(snippetSearch.value);
  renderSnippetDetails();
});

bindClick("breakdown-button", () => {
  if (!requireSession("AI tools")) return;
  const prompt = featureInput.value.toLowerCase();
  const tasks = [];
  if (prompt.includes("login") || prompt.includes("auth")) tasks.push("Design auth database schema and role permissions", "Build email and password authentication flows");
  if (prompt.includes("google") || prompt.includes("oauth")) tasks.push("Integrate Google OAuth redirect handling");
  if (prompt.includes("forgot") || prompt.includes("password")) tasks.push("Create forgot-password token workflow");
  if (prompt.includes("protected") || prompt.includes("route")) tasks.push("Protect workspace routes and member actions");
  tasks.push("Write edge-case tests and validation checks");
  generatedTasks.innerHTML = Array.from(new Set(tasks)).map((task) => `<li>${task}</li>`).join("");
  aiOutputBox.textContent = "AI Task Breakdown generated locally from your feature prompt.";
  showToast("AI breakdown generated.");
});

bindClick("summarise-project-button", () => {
  aiOutputBox.textContent = `Project Summary: ${state.tasks.filter((task) => task.status === "done").length} tasks are done, ${state.tasks.filter((task) => task.status === "progress").length} tasks are in progress, and ${state.tasks.filter((task) => task.status === "review").length} task is waiting in review.`;
  showToast("Project summary generated.");
});

bindClick("blocking-project-button", () => {
  const blockers = state.tasks.filter((task) => task.status === "progress" && task.updated.includes("d"));
  aiOutputBox.textContent = blockers.length ? `Blocking Analysis: ${blockers.map((task) => task.title).join(", ")} may be blocking the sprint.` : "Blocking Analysis: No long-running in-progress items were detected.";
  showToast("Blocker analysis generated.");
});

bindClick("standup-project-button", () => {
  aiOutputBox.textContent = `Standup Report:\nYesterday: Billing plan gate moved to review, docs were updated.\nToday: Finish OAuth login and AI blocker detector.\nBlockers: OAuth login is still pending final verification.`;
  showToast("Standup report generated.");
});

bindSubmit("member-form", async (event) => {
  event.preventDefault();
  try {
    const payload = await apiRequest("/api/members", {
      method: "POST",
      body: JSON.stringify({
        name: document.getElementById("member-name").value.trim(),
        email: document.getElementById("member-email").value.trim(),
        role: document.getElementById("member-role").value
      })
    });
    applyServerState(payload);
    syncUI();
    event.target.reset();
    showToast("Member added.");
  } catch (error) {
    showToast(error.message);
  }
});

bindSubmit("payment-form", async (event) => {
  event.preventDefault();
  try {
    await apiRequest("/api/billing/card", {
      method: "PATCH",
      body: JSON.stringify({
        name: document.getElementById("card-name").value.trim(),
        number: document.getElementById("card-number").value
      })
    });
    const checkout = await apiRequest("/api/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ plan: "Pro" })
    });
    showToast("Opening Stripe test checkout.");
    if (checkout.checkoutUrl) {
      window.location.href = checkout.checkoutUrl;
      return;
    }
    showToast("Stripe checkout was not available.");
  } catch (error) {
    showToast(error.message);
  }
});

bindClick("upgrade-button", async () => {
  try {
    const checkout = await apiRequest("/api/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ plan: "Pro" })
    });
    if (checkout.checkoutUrl) {
      window.location.href = checkout.checkoutUrl;
      return;
    }
    showToast("Stripe checkout was not available.");
  } catch (error) {
    showToast(error.message);
  }
});

bindClick("downgrade-button", async () => {
  try {
    const payload = await apiRequest("/api/billing/plan", {
      method: "PATCH",
      body: JSON.stringify({ plan: "Free" })
    });
    applyServerState(payload);
    syncUI();
    showToast("Free plan restored.");
  } catch (error) {
    showToast(error.message);
  }
});

bindSubmit("profile-form", async (event) => {
  event.preventDefault();
  try {
    const payload = await apiRequest("/api/profile", {
      method: "PATCH",
      body: JSON.stringify({
        avatar: document.getElementById("profile-avatar").value.trim(),
        bio: document.getElementById("profile-bio").value.trim(),
        skills: document.getElementById("profile-skills").value.trim(),
        github: document.getElementById("profile-github").value.trim()
      })
    });
    applyServerState(payload);
    syncUI();
    showToast("Profile updated.");
  } catch (error) {
    showToast(error.message);
  }
});

bindSubmit("password-form", async (event) => {
  event.preventDefault();
  try {
    const payload = await apiRequest("/api/password", {
      method: "PATCH",
      body: JSON.stringify({
        currentPassword: document.getElementById("current-password").value,
        newPassword: document.getElementById("new-password").value
      })
    });
    applyServerState(payload);
    syncUI();
    event.target.reset();
    showToast("Password changed successfully.");
  } catch (error) {
    showToast(error.message);
  }
});

bindSubmit("comment-form", async (event) => {
  event.preventDefault();
  try {
    const text = commentInput.value.trim();
    if (!text) return;
    const payload = await apiRequest("/api/comments", {
      method: "POST",
      body: JSON.stringify({ text })
    });
    applyServerState(payload);
    syncUI();
    event.target.reset();
    const mentionMatch = text.match(/@(\w+)/);
    if (mentionMatch) {
      setText(workspaceNotification, `${mentionMatch[1]} was notified by mention`);
      showToast(`@${mentionMatch[1]} notified.`);
    } else {
      showToast("Comment posted.");
    }
  } catch (error) {
    showToast(error.message);
  }
});

notificationButton?.addEventListener("click", async () => {
  try {
    const payload = await apiRequest("/api/notifications/read", { method: "POST" });
    applyServerState(payload);
    syncUI();
    showToast("Notifications marked as read.");
  } catch (error) {
    showToast(error.message);
  }
});

async function initializeApp() {
  authToken = getStoredToken();
  try {
    const payload = await apiRequest("/api/bootstrap");
    applyServerState(payload);
  } catch (error) {
    persistToken("");
    state = structuredClone(defaultState);
    showToast("Unable to reach the local backend.");
  }
  setTab(currentTab);
  setAuthView(currentAuthView);
  setTaskView(currentTaskView);
  syncUI();
  if (getSessionUser()) setTab(null);
}

initializeApp();
