function createAuthRoutes(deps) {
  const {
    asyncRoute,
    createSession,
    deleteSession,
    deleteUserSessions,
    hashPassword,
    pushActivity,
    pushNotification,
    query,
    queryOne,
    requireSession,
    respondWithState,
    verifyPassword
  } = deps;

  return function registerAuthRoutes(app) {
    app.post("/api/auth/signin", asyncRoute(async (req, res) => {
      const email = String(req.body?.email || "").trim().toLowerCase();
      const password = String(req.body?.password || "");
      const user = await queryOne("select * from users where lower(email) = $1", [email]);
      if (!user || !(await verifyPassword(password, user.password))) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }
      const token = await createSession(user.id);
      await pushActivity(`${user.name} signed in to the workspace.`);
      res.setHeader("Set-Cookie", deps.buildSessionCookie(token));
      await respondWithState(res, user.id, { ok: true });
    }));

    app.post("/api/auth/signup", asyncRoute(async (req, res) => {
      const name = String(req.body?.name || "").trim();
      const email = String(req.body?.email || "").trim().toLowerCase();
      const password = String(req.body?.password || "");
      const workspaceName = String(req.body?.workspaceName || "").trim();
      const github = String(req.body?.github || "").trim() || "Not added yet";

      if (!name || !email || !password || !workspaceName) {
        res.status(400).json({ error: "Name, email, password, and workspace are required." });
        return;
      }

      if (await queryOne("select 1 from users where lower(email) = $1", [email])) {
        res.status(409).json({ error: "An account with that email already exists." });
        return;
      }

      const firstName = name.split(/\s+/)[0] || "User";
      const userId = deps.createId("u");
      await query(
        `insert into users (
          id, name, email, password, reset_requested_at, workspace_name,
          workspace_description, avatar, bio, skills, github
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          userId,
          name,
          email,
          await hashPassword(password),
          null,
          workspaceName,
          `${workspaceName} team workspace`,
          firstName.slice(0, 2).toUpperCase(),
          "New DevCollab user",
          "JavaScript, Collaboration",
          github
        ]
      );
      await query("insert into members (id, name, email, role) values ($1, $2, $3, $4)", [deps.createId("m"), name, email, "Owner"]);
      await pushNotification("Workspace created", `${workspaceName} was created successfully.`, true);
      await pushActivity(`${name} created a new DevCollab account and workspace.`);
      const token = await createSession(userId);
      res.setHeader("Set-Cookie", deps.buildSessionCookie(token));
      await respondWithState(res, userId, { ok: true });
    }));

    app.post("/api/auth/forgot", asyncRoute(async (req, res) => {
      const email = String(req.body?.email || "").trim().toLowerCase();
      const user = await queryOne("select * from users where lower(email) = $1", [email]);
      if (!user) return res.status(404).json({ error: "No account found for that email." });
      const timestamp = new Date().toLocaleString();
      await query("update users set reset_requested_at = $1 where id = $2", [timestamp, user.id]);
      await deps.setPasswordResetLog(`Reset link sent to ${user.email} on ${timestamp}.`);
      await pushActivity(`Password reset requested for ${user.email}.`);
      res.json({ message: "Reset link simulated. Set your new password." });
    }));

    app.post("/api/auth/reset", asyncRoute(async (req, res) => {
      const email = String(req.body?.email || "").trim().toLowerCase();
      const password = String(req.body?.password || "");
      const user = await queryOne("select * from users where lower(email) = $1", [email]);
      if (!user) return res.status(404).json({ error: "No account found for that email." });
      await query("update users set password = $1, reset_requested_at = null where id = $2", [await hashPassword(password), user.id]);
      await deleteUserSessions(user.id);
      await deps.setPasswordResetLog(`Password updated for ${user.email}.`);
      await pushNotification("Password updated", `${user.email} updated their password.`, true);
      await pushActivity(`${user.name} updated their password and entered the workspace.`);
      const token = await createSession(user.id);
      res.setHeader("Set-Cookie", deps.buildSessionCookie(token));
      await respondWithState(res, user.id, { ok: true });
    }));

    app.post("/api/auth/logout", requireSession, asyncRoute(async (req, res) => {
      const token = req.cookies?.[deps.SESSION_COOKIE_NAME] || null;
      await deleteSession(token);
      res.setHeader("Set-Cookie", `${deps.SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${deps.COOKIE_IS_SECURE ? "; Secure" : ""}`);
      res.json({ ok: true });
    }));
  };
}

module.exports = { createAuthRoutes };
