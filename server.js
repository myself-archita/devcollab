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
  return pool.query(sql, params);
}

async function queryOne(sql, params = []) {
  const result = await query(sql, params);
  return result.rows[0] || null;
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
