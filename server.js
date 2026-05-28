const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const { createPool } = require("./src/db/pool");
const { runBootstrap } = require("./src/db/bootstrap");
const { buildFullState } = require("./src/services/state");
const { registerRoutes } = require("./src/routes");
const { createStripeCheckoutSession } = require("./src/services/stripe");
const security = require("./src/services/security");

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const SESSION_COOKIE_NAME = "devcollab_session";
const COOKIE_IS_SECURE = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
const STRIPE_SECRET_KEY = String(process.env.STRIPE_SECRET_KEY || "").trim();
const STRIPE_PRICE_ID = String(process.env.STRIPE_PRICE_ID || "").trim();
const STRIPE_SUCCESS_URL = String(process.env.STRIPE_SUCCESS_URL || "").trim();
const STRIPE_CANCEL_URL = String(process.env.STRIPE_CANCEL_URL || "").trim();

const pool = createPool();
const useFallbackStore = !process.env.POSTGRES_URL && !process.env.DATABASE_URL && !process.env.PGHOST && !process.env.PGDATABASE;
const fallbackStore = globalThis.__devcollabFallbackStore || (globalThis.__devcollabFallbackStore = createFallbackStore());

app.use(express.json());
app.use((req, _res, next) => {
  req.cookies = Object.fromEntries(
    String(req.headers.cookie || "")
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const index = entry.indexOf("=");
        const key = index === -1 ? entry : entry.slice(0, index);
        const value = index === -1 ? "" : entry.slice(index + 1);
        return [decodeURIComponent(key), decodeURIComponent(value)];
      })
  );
  next();
});
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});
app.use(express.static(path.join(__dirname, "public")));

async function query(sql, params = []) {
  if (useFallbackStore) {
    return runFallbackQuery(sql, params);
  }
  return pool.query(sql, params);
}

async function queryOne(sql, params = []) {
  const result = await query(sql, params);
  return result.rows[0] || null;
}

function createFallbackStore() {
  return {
    users: [],
    members: [],
    billing: { id: 1, plan: "Free", amount: "Rs 0/month", member_limit: 5, renewal: "Not applicable", card_name: null, card_last4: null },
    app_meta: { passwordResetLog: "No reset requests yet." },
    tasks: [],
    snippets: [],
    activity: [],
    comments: [],
    notifications: [],
    sessions: []
  };
}

function normalizeSql(sql) {
  return String(sql).replace(/\s+/g, " ").trim().toLowerCase();
}

function rows(rows) {
  return { rows };
}

async function runFallbackQuery(sql, params = []) {
  const normalized = normalizeSql(sql);
  if (normalized === "select 1") return rows([{ "?column?": 1 }]);
  if (normalized.startsWith("create table") || normalized.startsWith("create index")) return rows([]);
  if (normalized.startsWith("delete from sessions where expires_at")) {
    fallbackStore.sessions = fallbackStore.sessions.filter((session) => new Date(session.expires_at) > new Date());
    return rows([]);
  }
  if (normalized.startsWith("select count(*)::int as count from users")) return rows([{ count: fallbackStore.users.length }]);
  if (normalized.startsWith("select * from users order by id asc")) return rows([...fallbackStore.users].sort((a, b) => a.id.localeCompare(b.id)));
  if (normalized.startsWith("select * from members order by id asc")) return rows([...fallbackStore.members].sort((a, b) => a.id.localeCompare(b.id)));
  if (normalized.startsWith("select * from billing where id = 1")) return rows([fallbackStore.billing]);
  if (normalized.startsWith("select value from app_meta where key = 'passwordresetlog'")) return rows([{ value: fallbackStore.app_meta.passwordResetLog }]);
  if (normalized.startsWith("insert into app_meta")) {
    fallbackStore.app_meta.passwordResetLog = params[0];
    return rows([]);
  }
  if (normalized.startsWith("insert into users")) {
    const [id, name, email, password, resetRequestedAt, workspaceName, workspaceDescription, avatar, bio, skills, github] = params;
    fallbackStore.users.push({ id, name, email, password, reset_requested_at: resetRequestedAt, workspace_name: workspaceName, workspace_description: workspaceDescription, avatar, bio, skills, github });
    return rows([]);
  }
  if (normalized.startsWith("insert into members")) {
    const [id, name, email, role] = params;
    fallbackStore.members.push({ id, name, email, role });
    return rows([]);
  }
  if (normalized.startsWith("insert into tasks")) {
    const [id, title, priority, meta, status, due, updated] = params;
    fallbackStore.tasks.push({ id, title, priority, meta, status, due, updated });
    return rows([]);
  }
  if (normalized.startsWith("insert into snippets")) {
    const [id, title, tags, code, score, review] = params;
    fallbackStore.snippets.push({ id, title, tags: JSON.parse(tags), code, score, review: JSON.parse(review) });
    return rows([]);
  }
  if (normalized.startsWith("insert into billing")) {
    const [id, plan, amount, memberLimit, renewal, cardName, cardLast4] = [1, "Free", "Rs 0/month", 5, "Not applicable", null, null];
    fallbackStore.billing = { id, plan, amount, member_limit: memberLimit, renewal, card_name: cardName, card_last4: cardLast4 };
    return rows([]);
  }
  if (normalized.startsWith("update billing set card_name")) {
    fallbackStore.billing.card_name = params[0];
    fallbackStore.billing.card_last4 = params[1];
    return rows([]);
  }
  if (normalized.startsWith("update billing set plan = 'pro'")) {
    fallbackStore.billing.plan = "Pro";
    fallbackStore.billing.amount = "Rs 499/month";
    fallbackStore.billing.member_limit = 999999;
    fallbackStore.billing.renewal = "June 21, 2026";
    return rows([]);
  }
  if (normalized.startsWith("update billing set plan = 'free'")) {
    fallbackStore.billing.plan = "Free";
    fallbackStore.billing.amount = "Rs 0/month";
    fallbackStore.billing.member_limit = 5;
    fallbackStore.billing.renewal = "Not applicable";
    return rows([]);
  }
  if (normalized.startsWith("select * from tasks order by id asc")) return rows([...fallbackStore.tasks].sort((a, b) => a.id.localeCompare(b.id)));
  if (normalized.startsWith("update tasks set status")) {
    const [status, updated, taskId] = params;
    const task = fallbackStore.tasks.find((item) => item.id === taskId);
    if (task) {
      task.status = status;
      task.updated = updated;
    }
    return rows([]);
  }
  if (normalized.startsWith("select * from snippets order by id asc")) return rows([...fallbackStore.snippets].sort((a, b) => a.id.localeCompare(b.id)));
  if (normalized.startsWith("select message from activity order by id desc")) return rows([...fallbackStore.activity].slice().reverse().map((message) => ({ message })));
  if (normalized.startsWith("insert into activity")) {
    fallbackStore.activity.push(params[0]);
    return rows([]);
  }
  if (normalized.startsWith("select id, author, text, time from comments order by created_at desc, id desc")) return rows([...fallbackStore.comments].slice().reverse());
  if (normalized.startsWith("insert into comments")) {
    const [id, author, text, time] = params;
    fallbackStore.comments.unshift({ id, author, text, time });
    return rows([]);
  }
  if (normalized.startsWith("select id, title, body, unread from notifications order by created_at desc, id desc")) return rows([...fallbackStore.notifications].slice().reverse());
  if (normalized.startsWith("insert into notifications")) {
    const [id, title, body, unread] = params;
    fallbackStore.notifications.unshift({ id, title, body, unread });
    return rows([]);
  }
  if (normalized.startsWith("update notifications set unread = false")) {
    fallbackStore.notifications = fallbackStore.notifications.map((item) => ({ ...item, unread: false }));
    return rows([]);
  }
  if (normalized.startsWith("delete from sessions where user_id =")) {
    fallbackStore.sessions = fallbackStore.sessions.filter((session) => session.user_id !== params[0]);
    return rows([]);
  }
  if (normalized.startsWith("delete from sessions where token_hash =")) {
    fallbackStore.sessions = fallbackStore.sessions.filter((session) => session.token_hash !== params[0]);
    return rows([]);
  }
  if (normalized.startsWith("insert into sessions")) {
    const [id, userId, tokenHash, expiresAt] = params;
    fallbackStore.sessions.push({ id, user_id: userId, token_hash: tokenHash, expires_at: expiresAt });
    return rows([]);
  }
  if (normalized.startsWith("select s.id, s.user_id from sessions")) {
    const session = fallbackStore.sessions.find((item) => item.token_hash === params[0] && new Date(item.expires_at) > new Date());
    return rows(session ? [{ id: session.id, user_id: session.user_id }] : []);
  }
  if (normalized.startsWith("select * from users where lower(email) =")) {
    const email = String(params[0]).toLowerCase();
    return rows(fallbackStore.users.filter((user) => String(user.email).toLowerCase() === email));
  }
  if (normalized.startsWith("select 1 from users where lower(email) =")) {
    const email = String(params[0]).toLowerCase();
    return rows(fallbackStore.users.some((user) => String(user.email).toLowerCase() === email) ? [{}] : []);
  }
  if (normalized.startsWith("select * from users where id =")) {
    return rows(fallbackStore.users.filter((user) => user.id === params[0]));
  }
  if (normalized.startsWith("update users set reset_requested_at =")) {
    const [timestamp, userId] = params;
    const user = fallbackStore.users.find((item) => item.id === userId);
    if (user) user.reset_requested_at = timestamp;
    return rows([]);
  }
  if (normalized.startsWith("update users set password =") && normalized.includes("reset_requested_at = null")) {
    const [password, userId] = params;
    const user = fallbackStore.users.find((item) => item.id === userId);
    if (user) {
      user.password = password;
      user.reset_requested_at = null;
    }
    return rows([]);
  }
  if (normalized.startsWith("update users set password = $1 where id = $2")) {
    const [password, userId] = params;
    const user = fallbackStore.users.find((item) => item.id === userId);
    if (user) user.password = password;
    return rows([]);
  }
  if (normalized.startsWith("update users set avatar =")) {
    const [avatar, bio, skills, github, userId] = params;
    const user = fallbackStore.users.find((item) => item.id === userId);
    if (user) Object.assign(user, { avatar, bio, skills, github });
    return rows([]);
  }
  if (normalized.startsWith("delete from members where id =")) {
    fallbackStore.members = fallbackStore.members.filter((member) => member.id !== params[0]);
    return rows([]);
  }
  if (normalized.startsWith("update members set role =")) {
    const [role, memberId] = params;
    const member = fallbackStore.members.find((item) => item.id === memberId);
    if (member) member.role = role;
    return rows([]);
  }
  if (normalized.startsWith("select count(*)::int as count from members")) return rows([{ count: fallbackStore.members.length }]);
  if (normalized.startsWith("select * from billing where id = 1")) return rows([fallbackStore.billing]);
  if (normalized.startsWith("select 1")) return rows([{ "?column?": 1 }]);
  if (normalized.startsWith("insert into billing")) return rows([]);
  throw new Error(`Fallback store does not support query: ${sql}`);
}

async function passwordResetLog() {
  return (await queryOne("select value from app_meta where key = 'passwordResetLog'"))?.value || "No reset requests yet.";
}

function formatUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    resetRequestedAt: row.reset_requested_at,
    workspaceName: row.workspace_name,
    workspaceDescription: row.workspace_description,
    profile: {
      avatar: row.avatar,
      bio: row.bio,
      skills: row.skills,
      github: row.github
    }
  };
}

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

async function requestUser(req) {
  const token = req.cookies?.[SESSION_COOKIE_NAME] || null;
  if (!token) return null;
  const session = await queryOne(
    "select s.id, s.user_id from sessions s where s.token_hash = $1 and s.expires_at > now()",
    [security.hashToken(token)]
  );
  if (!session) return null;
  return queryOne("select * from users where id = $1", [session.user_id]);
}

async function requireSession(req, res, next) {
  const user = await requestUser(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  req.user = user;
  next();
}

async function pushActivity(message) {
  await query("insert into activity (message) values ($1)", [message]);
}

async function pushNotification(title, body, unread = true) {
  await query("insert into notifications (id, title, body, unread) values ($1, $2, $3, $4)", [
    security.createId("n"),
    title,
    body,
    unread
  ]);
}

async function createSession(userId) {
  const token = security.createToken();
  await query("insert into sessions (id, user_id, token_hash, expires_at) values ($1, $2, $3, $4)", [
    security.createId("s"),
    userId,
    security.hashToken(token),
    security.createSessionExpiry()
  ]);
  return token;
}

function buildSessionCookie(token) {
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${security.SESSION_TTL_DAYS * 24 * 60 * 60}`
  ];
  if (COOKIE_IS_SECURE) parts.push("Secure");
  return parts.join("; ");
}

async function deleteSession(token) {
  if (!token) return;
  await query("delete from sessions where token_hash = $1", [security.hashToken(token)]);
}

async function deleteUserSessions(userId) {
  await query("delete from sessions where user_id = $1", [userId]);
}

async function setPasswordResetLog(value) {
  await query(
    "insert into app_meta (key, value) values ('passwordResetLog', $1) on conflict (key) do update set value = excluded.value",
    [value]
  );
}

async function respondWithState(res, userId = null, extras = {}) {
  const user = userId ? await queryOne("select * from users where id = $1", [userId]) : null;
  res.json({
    ...extras,
    user: user ? formatUser(user) : null,
    state: await buildFullState({ query, queryOne, passwordResetLog, sessionUserId: userId, formatUser })
  });
}

const createRoutesContext = {
  asyncRoute,
  buildSessionCookie,
  createId: security.createId,
  createSession,
  deleteSession,
  deleteUserSessions,
  hashPassword: security.hashPassword,
  pushActivity,
  pushNotification,
  query,
  queryOne,
  requireSession,
  respondWithState,
  setPasswordResetLog,
  SESSION_COOKIE_NAME,
  COOKIE_IS_SECURE,
  verifyPassword: security.verifyPassword
};

registerRoutes(app, {
  ...createRoutesContext,
  createStripeCheckoutSession,
  stripeConfig: {
    secretKey: STRIPE_SECRET_KEY,
    priceId: STRIPE_PRICE_ID,
    successUrl: STRIPE_SUCCESS_URL,
    cancelUrl: STRIPE_CANCEL_URL
  }
});

app.get("/api/health", asyncRoute(async (_req, res) => {
  await query("select 1");
  res.json({ ok: true });
}));

app.get("/api/bootstrap", asyncRoute(async (req, res) => {
  const user = await requestUser(req);
  await respondWithState(res, user?.id || null);
}));

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error." });
});

async function start() {
  await runBootstrap({ query, queryOne, hashPassword: security.hashPassword, createId: security.createId });
  await query("delete from sessions where expires_at <= now()");
}

const ready = start();

if (process.env.VERCEL !== "1") {
  ready.then(() => app.listen(PORT, () => console.log(`DevCollab running locally on http://localhost:${PORT}`))).catch((error) => {
    console.error("Failed to start DevCollab:", error);
    process.exit(1);
  });
}

module.exports = app;
