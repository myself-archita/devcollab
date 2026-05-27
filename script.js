const STORAGE_KEY = "devcollab-app-state-v4";
let memoryStateCache = null;

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function safeGetStoredState() {
  try {
    const sessionValue = window.sessionStorage.getItem(STORAGE_KEY);
    if (sessionValue) {
      return sessionValue;
    }
  } catch {}

  return memoryStateCache;
}

function safeSetStoredState(serialized) {
  memoryStateCache = serialized;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, serialized);
  } catch {}
}

const defaultState = {
  users: [
    {
      id: "u1",
      name: "Demo User",
      email: "demo@devcollab.app",
      password: "dev12345",
      resetRequestedAt: null,
      workspaceName: "Atlas Labs",
      workspaceDescription: "Student developer workspace",
      profile: {
        avatar: "DU",
        bio: "Full-stack builder collaborating on hackathon products.",
        skills: "React, Node.js, UI Design",
        github: "https://github.com/demo-user",
      },
    },
  ],
  sessionUserId: null,
  members: [
    { id: "m1", name: "Archita Guha Roy", email: "archita@devcollab.app", role: "Owner" },
    { id: "m2", name: "Riya Sen", email: "riya@devcollab.app", role: "Admin" },
    { id: "m3", name: "Ankush Patel", email: "ankush@devcollab.app", role: "Member" },
    { id: "m4", name: "Shruti Paul", email: "shruti@devcollab.app", role: "Member" },
    { id: "m5", name: "Viewer Bot", email: "viewer@devcollab.app", role: "Viewer" },
  ],
  billing: {
    plan: "Free",
    amount: "Rs 0/month",
    memberLimit: 5,
    renewal: "Not applicable",
    savedCard: null,
  },
  passwordResetLog: "No reset requests yet.",
  tasks: [
    { id: "t1", title: "Improve wiki page linking", priority: "p2", meta: "Docs", status: "todo", due: "May 22", updated: "1h ago" },
    { id: "t2", title: "Notification digest", priority: "p1", meta: "Backend", status: "todo", due: "May 23", updated: "3h ago" },
    { id: "t3", title: "Build OAuth login system", priority: "p0", meta: "Auth", status: "progress", due: "Today", updated: "2d ago" },
    { id: "t4", title: "AI blocker detector", priority: "p1", meta: "AI", status: "progress", due: "Today", updated: "6h ago" },
    { id: "t5", title: "Billing plan gate", priority: "p1", meta: "Payments", status: "review", due: "May 21", updated: "20m ago" },
    { id: "t6", title: "Workspace role system", priority: "p2", meta: "Core", status: "done", due: "Done", updated: "Yesterday" },
  ],
  snippets: [
    {
      id: "auth",
      title: "Realtime auth guard",
      tags: ["auth", "roles", "workspace"],
      code: `export function requireRole(user, allowedRoles) {
  if (!user || !allowedRoles.includes(user.role)) {
    throw new Error("Access denied for this workspace action.");
  }

  return true;
}`,
      score: "8.6/10",
      review: [
        "Clear role gate and straightforward guard logic.",
        "Consider typed errors for access-denied handling.",
        "Add audit logs so denied actions are visible to admins.",
      ],
    },
    {
      id: "socket",
      title: "Task move event emitter",
      tags: ["socket", "board", "realtime"],
      code: `socket.emit("task:moved", {
  taskId,
  fromColumn: "in-progress",
  toColumn: "in-review",
  movedBy: currentUser.name,
  movedAt: new Date().toISOString(),
});`,
      score: "8.3/10",
      review: [
        "Good event shape for activity stream updates.",
        "Consider optimistic rollback when the server rejects moves.",
        "Validation on enum values would make the event safer.",
      ],
    },
    {
      id: "review",
      title: "AI code review prompt",
      tags: ["ai", "review", "quality"],
      code: `Review this code for:
1. Bugs and edge cases
2. Performance issues
3. Readability concerns
4. Security risks

Return a quality score out of 10 and actionable fixes.`,
      score: "9.1/10",
      review: [
        "Very clear structure for multi-factor code feedback.",
        "Could request severity labels to improve prioritization.",
        "A final suggested patch section would make this stronger.",
      ],
    },
  ],
  activity: [
    "Riya moved Billing plan gate to In Review.",
    "AI Assistant generated a blocker summary for the current sprint.",
    "Shruti updated Launch Readiness Checklist.",
  ],
  comments: [
    { id: "c1", author: "Riya", text: "@Ankush please verify the billing gate edge cases.", time: "5m ago" },
    { id: "c2", author: "Ankush", text: "Checking this now. @Archita the OAuth blockers are still pending.", time: "2m ago" },
  ],
  notifications: [
    { id: "n1", title: "@Riya mentioned you", body: "Please review the billing gate edge cases.", unread: true },
    { id: "n2", title: "Task assigned", body: "OAuth login system is assigned to you.", unread: true },
    { id: "n3", title: "AI summary ready", body: "A new standup report was generated.", unread: false },
  ],
};

function normalizeState(candidate) {
  const next = { ...deepClone(defaultState), ...candidate };

  if (!Array.isArray(next.users) || next.users.length === 0) {
    next.users = deepClone(defaultState.users);
  }
  if (!Array.isArray(next.members) || next.members.length === 0) {
    next.members = deepClone(defaultState.members);
  }
  if (!Array.isArray(next.tasks) || next.tasks.length === 0) {
    next.tasks = deepClone(defaultState.tasks);
  }
  if (!Array.isArray(next.snippets) || next.snippets.length === 0) {
    next.snippets = deepClone(defaultState.snippets);
  }
  if (!Array.isArray(next.activity)) {
    next.activity = deepClone(defaultState.activity);
  }
  if (!Array.isArray(next.comments)) {
    next.comments = deepClone(defaultState.comments);
  }
  if (!Array.isArray(next.notifications)) {
    next.notifications = deepClone(defaultState.notifications);
  }

  const validUserIds = new Set(next.users.map((user) => user.id));
  if (!next.sessionUserId || !validUserIds.has(next.sessionUserId)) {
    next.sessionUserId = null;
  }

  return next;
}

function loadState() {
  const raw = safeGetStoredState();
  if (!raw) return normalizeState({});
  try {
    return normalizeState(JSON.parse(raw));
  } catch {
    return normalizeState({});
  }
}

let state = loadState();
let currentTab = null;
let currentAuthView = "signin";
let currentTaskView = "board";
let currentSnippetId = state.snippets[0].id;

const authShell = document.getElementById("auth-shell");
const appShell = document.getElementById("app-shell");
const authSwitches = document.querySelectorAll(".auth-switch");
const authForms = document.querySelectorAll(".auth-form");
const authTitle = document.getElementById("auth-title");
const authModePill = document.getElementById("auth-mode-pill");
const menuToggle = document.getElementById("menu-toggle");
const topbarMenu = document.getElementById("topbar-menu");
const leftRail = document.getElementById("left-rail");
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
const signalList = document.getElementById("signal-list");
const activityFeed = document.getElementById("activity-feed");
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
const metricMembers = document.getElementById("metric-members");
const metricPlan = document.getElementById("metric-plan");
const metricTasks = document.getElementById("metric-tasks");
const presenceStatus = document.getElementById("presence-status");
const workspaceNotification = document.getElementById("workspace-notification");
const aiOutputBox = document.getElementById("ai-output-box");
const notificationList = document.getElementById("notification-list");
const notificationCount = document.getElementById("notification-count");
const notificationButton = document.getElementById("notification-button");

function setText(element, value) {
  if (element) {
    element.textContent = value;
  }
}

function setHTML(element, value) {
  if (element) {
    element.innerHTML = value;
  }
}

function bindSubmit(id, handler) {
  const form = document.getElementById(id);
  if (form) {
    form.addEventListener("submit", handler);
  }
  return form;
}

function bindClick(id, handler) {
  const element = document.getElementById(id);
  if (element) {
    element.addEventListener("click", handler);
  }
  return element;
}

function saveState() {
  state = normalizeState(state);
  safeSetStoredState(JSON.stringify(state));
}

function showToast(message) {
  if (!toastStack) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toastStack.appendChild(toast);
  setTimeout(() => toast.remove(), 2600);
}

function addActivity(message) {
  state.activity.unshift(message);
  saveState();
  renderActivity();
  renderSignals();
}

function addNotification(title, body, unread = true) {
  state.notifications.unshift({
    id: `n${Date.now()}`,
    title,
    body,
    unread,
  });
  saveState();
  renderNotifications();
}

function getSessionUser() {
  return state.users.find((user) => user.id === state.sessionUserId) || null;
}

function getCompactSessionLabel(user) {
  if (!user) return "Signed out";
  const firstName = user.name.trim().split(/\s+/)[0] || user.name;
  return `Signed in: ${firstName}`;
}

function setWorkspaceNotice(message) {
  setText(workspaceNotification, message);
}

function updateAuthVisibility() {
  const isAuthenticated = Boolean(getSessionUser());
  authShell.classList.toggle("hidden", isAuthenticated);
  appShell.classList.toggle("hidden", !isAuthenticated);
}

function setTab(tab) {
  currentTab = tab;
  topbarTabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });
  tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === tab);
  });
  if (selectionState) {
    selectionState.classList.toggle("hidden", Boolean(tab));
  }
  if (tab && topbarMenu) {
    topbarMenu.classList.remove("open");
  }
  if (tab && menuToggle) {
    menuToggle.setAttribute("aria-expanded", "false");
  }
}

function setTaskView(view) {
  currentTaskView = view;
  viewTabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.taskView === view);
  });
  taskPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.taskPanel === view);
  });
}

function setAuthView(view) {
  currentAuthView = view;
  authSwitches.forEach((button) => {
    button.classList.toggle("active", button.dataset.authView === view);
  });
  authForms.forEach((form) => {
    form.classList.toggle("active", form.id === `${view}-form`);
  });

  const copy = {
    signin: ["Sign in to DevCollab", "Secure Access"],
    signup: ["Create your DevCollab account", "New Workspace"],
    forgot: ["Reset your DevCollab password", "Recovery"],
    reset: ["Set a new DevCollab password", "Password Update"],
  }[view];

  setText(authTitle, copy[0]);
  setText(authModePill, copy[1]);
}

function renderSignals() {
  if (!signalList) return;
  const tasksInProgress = state.tasks.filter((task) => task.status === "progress").length;
  const planSignal = state.billing.plan === "Pro"
    ? "AI features and unlimited members are enabled."
    : "Free plan limit is active for members and AI tools.";
  const recent = state.activity.slice(0, 2);

  signalList.innerHTML = `
    <li>${tasksInProgress} tasks are currently in progress across the sprint board.</li>
    <li>${planSignal}</li>
    ${recent.map((entry) => `<li>${entry}</li>`).join("")}
  `;
}

function renderActivity() {
  if (!activityFeed) return;
  activityFeed.innerHTML = "";
  if (!state.activity.length) {
    activityFeed.innerHTML = `<div class="activity-item"><p>No live activity yet.</p></div>`;
    return;
  }

  state.activity.forEach((entry) => {
    const item = document.createElement("div");
    item.className = "activity-item";
    item.innerHTML = `<p>${entry}</p>`;
    activityFeed.appendChild(item);
  });
}

function renderBoard() {
  document.querySelectorAll(".column").forEach((column) => {
    const status = column.dataset.status;
    const items = state.tasks.filter((task) => task.status === status);
    const count = column.querySelector(".count");
    if (count) {
      count.textContent = String(items.length);
    }
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
      card.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/plain", task.id);
      });
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
  const filtered = state.snippets.filter((snippet) => {
    return `${snippet.title} ${snippet.tags.join(" ")}`.toLowerCase().includes(query);
  });

  if (!filtered.some((snippet) => snippet.id === currentSnippetId)) {
    currentSnippetId = filtered[0]?.id || state.snippets[0].id;
  }

  snippetList.innerHTML = "";
  filtered.forEach((snippet) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `snippet-item${snippet.id === currentSnippetId ? " active" : ""}`;
    button.innerHTML = `
      <strong>${snippet.title}</strong>
      <p>${snippet.tags.join(" | ")}</p>
    `;
    button.addEventListener("click", () => {
      currentSnippetId = snippet.id;
      renderSnippets(snippetSearch.value);
      renderSnippetDetails();
    });
    snippetList.appendChild(button);
  });
}

function renderSnippetDetails() {
  if (!snippetCode || !snippetTitle || !snippetScore || !snippetReview) return;
  const snippet = state.snippets.find((item) => item.id === currentSnippetId) || state.snippets[0];
  snippetTitle.textContent = snippet.title;
  snippetScore.textContent = snippet.score;
  snippetCode.textContent = snippet.code;
  snippetReview.innerHTML = snippet.review.map((item) => `<li>${item}</li>`).join("");
}

function renderComments() {
  if (!commentsFeed) return;
  commentsFeed.innerHTML = state.comments.map((comment) => {
    const highlighted = comment.text.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
    return `
      <div class="comment-card">
        <strong>${comment.author}</strong>
        <p>${highlighted}</p>
        <p>${comment.time}</p>
      </div>
    `;
  }).join("");
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
    button.addEventListener("click", () => {
      const member = state.members.find((entry) => entry.id === button.dataset.memberId);
      if (!member) return;

      if (button.dataset.memberAction === "promote") {
        member.role = member.role === "Viewer" ? "Member" : member.role === "Member" ? "Admin" : member.role;
        addActivity(`${member.name} was updated to role ${member.role}.`);
        addNotification("Role updated", `${member.name} is now ${member.role}.`);
        showToast(`${member.name} promoted to ${member.role}.`);
      }

      if (button.dataset.memberAction === "remove") {
        state.members = state.members.filter((entry) => entry.id !== member.id);
        addActivity(`${member.name} was removed from the workspace.`);
        addNotification("Member removed", `${member.name} was removed from the workspace.`);
        showToast(`${member.name} removed.`);
      }

      saveState();
      syncUI();
    });
  });
}

function renderBilling() {
  setText(billingPlanName, state.billing.plan);
  setText(billingPlanAmount, state.billing.amount);
  setText(billingMemberUsage, `${state.members.length} / ${state.billing.memberLimit === Infinity ? "Unlimited" : state.billing.memberLimit}`);
  setText(billingRenewal, state.billing.renewal);

  if (!savedCardBox) return;
  if (state.billing.savedCard) {
    savedCardBox.innerHTML = `
      <strong>Saved card</strong>
      <p>${state.billing.savedCard.name}</p>
      <p>${state.billing.savedCard.masked}</p>
    `;
  } else {
    savedCardBox.innerHTML = `<strong>No card saved yet.</strong>`;
  }
}

function renderNotifications() {
  if (!notificationList || !notificationCount) return;
  const notifications = state.notifications;
  notificationList.innerHTML = notifications.map((item) => `
    <div class="notification-item${item.unread ? " unread" : ""}">
      <strong>${item.title}</strong>
      <p>${item.body}</p>
    </div>
  `).join("");
  notificationCount.textContent = String(notifications.filter((item) => item.unread).length);
}

function renderAccount() {
  const user = getSessionUser();
  if (user) {
    setText(sessionIndicator, getCompactSessionLabel(user));
    if (sessionIndicator) {
      sessionIndicator.title = `Signed in as ${user.name}`;
    }
    setText(workspaceNameDisplay, user.workspaceName || "DevCollab");
    setText(workspaceSubtitle, user.workspaceDescription || "Student developer workspace");
    if (profileBox) {
      profileBox.innerHTML = `
      <strong>${user.name}</strong>
      <p>Avatar: ${user.profile.avatar}</p>
      <p>${user.email}</p>
      <p>${user.profile.bio}</p>
      <p>Skills: ${user.profile.skills}</p>
      <p>GitHub: ${user.profile.github}</p>
    `;
    }

    const profileAvatar = document.getElementById("profile-avatar");
    const profileBio = document.getElementById("profile-bio");
    const profileSkills = document.getElementById("profile-skills");
    const profileGithub = document.getElementById("profile-github");
    if (profileAvatar) profileAvatar.value = user.profile.avatar;
    if (profileBio) profileBio.value = user.profile.bio;
    if (profileSkills) profileSkills.value = user.profile.skills;
    if (profileGithub) profileGithub.value = user.profile.github;
  } else {
    setText(sessionIndicator, "Signed out");
    if (sessionIndicator) {
      sessionIndicator.title = "Signed out";
    }
  }

  if (recoveryBox) {
    recoveryBox.innerHTML = `
    <strong>Recovery log</strong>
    <p>${state.passwordResetLog}</p>
  `;
  }
}

function renderMetrics() {
  setText(metricMembers, String(state.members.length));
  setText(metricPlan, state.billing.plan);
  setText(metricTasks, String(state.tasks.filter((task) => task.status !== "done").length));
}

function syncUI() {
  state = normalizeState(state);
  updateAuthVisibility();
  renderSignals();
  renderActivity();
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
  renderMetrics();
}

function requireSession(actionName) {
  if (getSessionUser()) return true;
  showToast(`Sign in first to use ${actionName}.`);
  updateAuthVisibility();
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

jumpTabButtons.forEach((button) => {
  button.addEventListener("click", () => setTab(button.dataset.jumpTab));
});

viewTabs.forEach((button) => {
  button.addEventListener("click", () => setTaskView(button.dataset.taskView));
});

authSwitches.forEach((button) => {
  button.addEventListener("click", () => setAuthView(button.dataset.authView));
});

if (menuToggle && topbarMenu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = topbarMenu.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".app-topbar") && !currentTab) {
      topbarMenu.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    }
  });
}

document.getElementById("signin-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.getElementById("signin-email").value.trim().toLowerCase();
  const password = document.getElementById("signin-password").value;
  const user = state.users.find((entry) => entry.email.toLowerCase() === email && entry.password === password);

  if (!user) {
    showToast("Invalid email or password.");
    return;
  }

  state.sessionUserId = user.id;
  saveState();
  syncUI();
  setTab(null);
  if (topbarMenu && menuToggle) {
    topbarMenu.classList.add("open");
    menuToggle.setAttribute("aria-expanded", "true");
  }
  showToast(`Welcome back, ${user.name}.`);
  addActivity(`${user.name} signed in to the workspace.`);
});

document.getElementById("signup-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim().toLowerCase();
  const password = document.getElementById("signup-password").value;
  const workspaceName = document.getElementById("signup-workspace").value.trim();
  const github = document.getElementById("signup-github").value.trim();

  if (state.users.some((entry) => entry.email.toLowerCase() === email)) {
    showToast("An account with that email already exists.");
    return;
  }

  const firstName = name.split(/\s+/)[0] || "User";
  const user = {
    id: `u${Date.now()}`,
    name,
    email,
    password,
    resetRequestedAt: null,
    workspaceName,
    workspaceDescription: `${workspaceName} team workspace`,
    profile: {
      avatar: firstName.slice(0, 2).toUpperCase(),
      bio: "New DevCollab user",
      skills: "JavaScript, Collaboration",
      github: github || "Not added yet",
    },
  };

  state.users.push(user);
  state.sessionUserId = user.id;
  state.members.unshift({ id: `m${Date.now()}`, name, email, role: "Owner" });
  saveState();
  syncUI();
  setTab(null);
  if (topbarMenu && menuToggle) {
    topbarMenu.classList.add("open");
    menuToggle.setAttribute("aria-expanded", "true");
  }
  addNotification("Workspace created", `${workspaceName} was created successfully.`, true);
  showToast("Account and workspace created. Choose a section from the menu list.");
  addActivity(`${name} created a new DevCollab account and workspace.`);
});

document.getElementById("forgot-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.getElementById("forgot-email").value.trim().toLowerCase();
  const user = state.users.find((entry) => entry.email.toLowerCase() === email);
  const timestamp = new Date().toLocaleString();

  if (!user) {
    showToast("No account found for that email.");
    return;
  }

  user.resetRequestedAt = timestamp;
  state.passwordResetLog = `Reset link sent to ${user.email} on ${timestamp}.`;
  saveState();
  syncUI();
  setAuthView("reset");
  showToast("Reset link sent. Set your new password.");
  addActivity(`Password reset requested for ${user.email}.`);
});

document.getElementById("reset-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.getElementById("reset-email").value.trim().toLowerCase();
  const password = document.getElementById("reset-password").value;
  const user = state.users.find((entry) => entry.email.toLowerCase() === email);

  if (!user) {
    showToast("No account found for that email.");
    return;
  }

  user.password = password;
  user.resetRequestedAt = null;
  state.sessionUserId = user.id;
  state.passwordResetLog = `Password updated for ${user.email}.`;
  saveState();
  syncUI();
  setTab(null);
  if (topbarMenu && menuToggle) {
    topbarMenu.classList.add("open");
    menuToggle.setAttribute("aria-expanded", "true");
  }
  addNotification("Password updated", `${user.email} updated their password.`, true);
  showToast("Password updated. Signed in successfully. Choose a section from the menu list.");
  addActivity(`${user.name} updated their password and entered the workspace.`);
});

logoutButton.addEventListener("click", () => {
  const user = getSessionUser();
  state.sessionUserId = null;
  saveState();
  syncUI();
  setAuthView("signin");
  setTab(null);
  if (topbarMenu && menuToggle) {
    topbarMenu.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }
  showToast("Logged out.");
  if (user) addActivity(`${user.name} logged out.`);
});

document.querySelectorAll(".column").forEach((column) => {
  column.addEventListener("dragover", (event) => {
    event.preventDefault();
    column.classList.add("drag-over");
  });
  column.addEventListener("dragleave", () => {
    column.classList.remove("drag-over");
  });
  column.addEventListener("drop", (event) => {
    event.preventDefault();
    column.classList.remove("drag-over");
    if (!requireSession("the board")) return;

    const taskId = event.dataTransfer.getData("text/plain");
    const task = state.tasks.find((entry) => entry.id === taskId);
    if (!task) return;

    task.status = column.dataset.status;
    task.updated = "just now";
    saveState();
    syncUI();
    addActivity(`${task.title} moved to ${column.querySelector("h3").textContent}.`);
    addNotification("Task moved", `Riya moved your task to ${column.querySelector("h3").textContent}.`, true);
    setWorkspaceNotice(`Riya moved your task to ${column.querySelector("h3").textContent}`);
    showToast(`Task updated: ${task.title}`);
  });
});

if (snippetSearch) {
  snippetSearch.addEventListener("input", () => {
    renderSnippets(snippetSearch.value);
    renderSnippetDetails();
  });
}

bindClick("breakdown-button", () => {
  if (!requireSession("AI tools")) return;
  const prompt = featureInput.value.toLowerCase();
  const tasks = [];
  if (prompt.includes("login") || prompt.includes("auth")) {
    tasks.push("Design auth database schema and role permissions");
    tasks.push("Build email and password authentication flows");
  }
  if (prompt.includes("google") || prompt.includes("oauth")) {
    tasks.push("Integrate Google OAuth redirect handling");
  }
  if (prompt.includes("forgot") || prompt.includes("password")) {
    tasks.push("Create forgot-password token workflow");
  }
  if (prompt.includes("protected") || prompt.includes("route")) {
    tasks.push("Protect workspace routes and member actions");
  }
  tasks.push("Write edge-case tests and validation checks");

  generatedTasks.innerHTML = Array.from(new Set(tasks)).map((task) => `<li>${task}</li>`).join("");
  aiOutputBox.textContent = "AI Task Breakdown: Created a scoped implementation plan from your feature prompt with auth, OAuth, recovery, route protection, and testing tasks.";
  addActivity("AI Assistant generated a new task breakdown.");
  addNotification("AI breakdown ready", "A new task breakdown was generated from your feature prompt.", false);
  showToast("AI breakdown generated.");
});

bindClick("summarise-project-button", () => {
  const done = state.tasks.filter((task) => task.status === "done").length;
  const progress = state.tasks.filter((task) => task.status === "progress").length;
  const review = state.tasks.filter((task) => task.status === "review").length;
  aiOutputBox.textContent = `Project Summary: ${done} tasks are done, ${progress} tasks are in progress, and ${review} task is waiting in review. The sprint is moving, but auth and AI workflow items still need attention.`;
  addActivity("AI Assistant summarised the current project.");
  addNotification("AI summary ready", "Project summary was generated.", false);
  showToast("Project summary generated.");
});

bindClick("blocking-project-button", () => {
  const blockers = state.tasks.filter((task) => task.status === "progress" && task.updated.includes("d"));
  aiOutputBox.textContent = blockers.length
    ? `Blocking Analysis: ${blockers.map((task) => task.title).join(", ")} have been in progress too long and may be blocking the sprint.`
    : "Blocking Analysis: No long-running in-progress items were detected.";
  addActivity("AI Assistant checked project blockers.");
  addNotification("Blocker check complete", "AI checked sprint blockers.", false);
  showToast("Blocker analysis generated.");
});

bindClick("standup-project-button", () => {
  aiOutputBox.textContent = `Standup Report:
Yesterday: Billing plan gate moved to review, docs were updated.
Today: Finish OAuth login and AI blocker detector.
Blockers: OAuth login is still pending final verification.`;
  addActivity("AI Assistant created a standup report.");
  addNotification("Standup ready", "A standup report is available.", false);
  showToast("Standup report generated.");
});

bindSubmit("member-form", (event) => {
  event.preventDefault();
  if (!requireSession("member management")) return;

  const name = document.getElementById("member-name").value.trim();
  const email = document.getElementById("member-email").value.trim();
  const role = document.getElementById("member-role").value;

  if (state.billing.plan === "Free" && state.members.length >= state.billing.memberLimit) {
    showToast("Free plan member limit reached. Upgrade to Pro.");
    return;
  }

  state.members.push({ id: `m${Date.now()}`, name, email, role });
  saveState();
  syncUI();
  event.target.reset();
  addActivity(`${name} joined the workspace as ${role}.`);
  addNotification("Member added", `${name} joined as ${role}.`, true);
  showToast("Member added.");
});

bindSubmit("payment-form", (event) => {
  event.preventDefault();
  if (!requireSession("billing")) return;

  const name = document.getElementById("card-name").value.trim();
  const number = document.getElementById("card-number").value.replace(/\s+/g, "");
  state.billing.savedCard = { name, masked: `**** **** **** ${number.slice(-4) || "0000"}` };
  saveState();
  renderBilling();
  addActivity(`Payment method updated for ${name}.`);
  addNotification("Billing updated", "Payment method was updated.", false);
  showToast("Payment method saved.");
});

bindClick("upgrade-button", () => {
  if (!requireSession("upgrading")) return;
  state.billing.plan = "Pro";
  state.billing.amount = "Rs 499/month";
  state.billing.memberLimit = Infinity;
  state.billing.renewal = "June 21, 2026";
  saveState();
  syncUI();
  addActivity("Workspace upgraded to Pro plan.");
  addNotification("Plan upgraded", "Pro plan is now active.", true);
  showToast("Pro plan activated.");
});

bindClick("downgrade-button", () => {
  if (!requireSession("billing")) return;
  state.billing.plan = "Free";
  state.billing.amount = "Rs 0/month";
  state.billing.memberLimit = 5;
  state.billing.renewal = "Not applicable";
  saveState();
  syncUI();
  addActivity("Workspace switched back to Free plan.");
  addNotification("Plan changed", "Workspace switched back to Free.", false);
  showToast("Free plan restored.");
});

bindSubmit("profile-form", (event) => {
  event.preventDefault();
  const user = getSessionUser();
  if (!user) return;

  user.profile.avatar = document.getElementById("profile-avatar").value.trim().toUpperCase();
  user.profile.bio = document.getElementById("profile-bio").value.trim();
  user.profile.skills = document.getElementById("profile-skills").value.trim();
  user.profile.github = document.getElementById("profile-github").value.trim();
  saveState();
  syncUI();
  addNotification("Profile updated", "Your user profile was updated.", false);
  showToast("Profile updated.");
});

bindSubmit("password-form", (event) => {
  event.preventDefault();
  const user = getSessionUser();
  if (!user) {
    showToast("Sign in first to change your password.");
    return;
  }

  const currentPassword = document.getElementById("current-password").value;
  const newPassword = document.getElementById("new-password").value;
  if (user.password !== currentPassword) {
    showToast("Current password is incorrect.");
    return;
  }

  user.password = newPassword;
  saveState();
  syncUI();
  event.target.reset();
  addActivity(`${user.name} changed their password.`);
  addNotification("Password changed", "Your password was updated successfully.", false);
  showToast("Password changed successfully.");
});

bindClick("seed-activity-button", () => {
  addActivity("Live sync: Riya commented on OAuth login system and mentioned the auth team.");
  addNotification("New mention", "Riya mentioned you in OAuth login system.", true);
  setWorkspaceNotice("Riya moved your task to In Review");
  presenceStatus.textContent = "Ankush is viewing the board";
  showToast("Live activity simulated.");
});

bindClick("clear-feed-button", () => {
  state.activity = [];
  saveState();
  syncUI();
  showToast("Activity feed cleared.");
});

bindSubmit("comment-form", (event) => {
  event.preventDefault();
  if (!requireSession("comments")) return;

  const user = getSessionUser();
  const text = commentInput.value.trim();
  if (!text) return;

  state.comments.unshift({
    id: `c${Date.now()}`,
    author: user ? user.name.split(/\s+/)[0] : "You",
    text,
    time: "just now",
  });

  const mentionMatch = text.match(/@(\w+)/);
  if (mentionMatch) {
    setWorkspaceNotice(`${mentionMatch[1]} was notified by mention`);
    addActivity(`Mention sent to @${mentionMatch[1]} in task comments.`);
    addNotification("Mention sent", `@${mentionMatch[1]} was notified in task comments.`, true);
    showToast(`@${mentionMatch[1]} notified.`);
  } else {
    addActivity("A new task comment was posted.");
    addNotification("Comment posted", "A new task comment was added.", false);
    showToast("Comment posted.");
  }

  saveState();
  renderComments();
  event.target.reset();
});

if (notificationButton) {
  notificationButton.addEventListener("click", () => {
  state.notifications = state.notifications.map((item) => ({ ...item, unread: false }));
  saveState();
  renderNotifications();
  showToast("Notifications marked as read.");
  });
}

setTab(currentTab);
setAuthView(currentAuthView);
setTaskView(currentTaskView);
syncUI();
if (getSessionUser()) {
  setTab(null);
}
