function createTasksRoutes(deps) {
  return function registerTasksRoutes(app) {
    app.patch("/api/tasks/:taskId/status", deps.requireSession, deps.asyncRoute(async (req, res) => {
      const task = await deps.queryOne("select * from tasks where id = $1", [req.params.taskId]);
      if (!task) return res.status(404).json({ error: "Task not found." });
      const status = String(req.body?.status || task.status);
      await deps.query("update tasks set status = $1, updated = $2 where id = $3", [status, "just now", task.id]);
      await deps.pushActivity(`${task.title} moved to ${status}.`);
      await deps.pushNotification("Task moved", `${task.title} moved to ${status}.`, true);
      await deps.respondWithState(res, req.user.id);
    }));
  };
}

module.exports = { createTasksRoutes };
