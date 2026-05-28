function createNotificationsRoutes(deps) {
  return function registerNotificationsRoutes(app) {
    app.post("/api/notifications/read", deps.requireSession, deps.asyncRoute(async (req, res) => {
      await deps.query("update notifications set unread = false");
      await deps.respondWithState(res, req.user.id);
    }));
  };
}

module.exports = { createNotificationsRoutes };
