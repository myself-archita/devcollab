function createProfileRoutes(deps) {
  return function registerProfileRoutes(app) {
    app.patch("/api/profile", deps.requireSession, deps.asyncRoute(async (req, res) => {
      await deps.query("update users set avatar = $1, bio = $2, skills = $3, github = $4 where id = $5", [
        String(req.body?.avatar || "").trim().toUpperCase(),
        String(req.body?.bio || "").trim(),
        String(req.body?.skills || "").trim(),
        String(req.body?.github || "").trim(),
        req.user.id
      ]);
      await deps.pushNotification("Profile updated", "Your user profile was updated.", false);
      await deps.respondWithState(res, req.user.id);
    }));

    app.patch("/api/password", deps.requireSession, deps.asyncRoute(async (req, res) => {
      const currentPassword = String(req.body?.currentPassword || "");
      const newPassword = String(req.body?.newPassword || "");
      if (!(await deps.verifyPassword(currentPassword, req.user.password))) {
        res.status(400).json({ error: "Current password is incorrect." });
        return;
      }
      await deps.query("update users set password = $1 where id = $2", [await deps.hashPassword(newPassword), req.user.id]);
      await deps.deleteUserSessions(req.user.id);
      const nextToken = await deps.createSession(req.user.id);
      res.setHeader("Set-Cookie", deps.buildSessionCookie(nextToken));
      await deps.pushNotification("Password changed", "Your password was updated successfully.", false);
      await deps.pushActivity(`${req.user.name} changed their password.`);
      await deps.respondWithState(res, req.user.id, { ok: true });
    }));
  };
}

module.exports = { createProfileRoutes };
