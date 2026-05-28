function createCommentsRoutes(deps) {
  return function registerCommentsRoutes(app) {
    app.post("/api/comments", deps.requireSession, deps.asyncRoute(async (req, res) => {
      const text = String(req.body?.text || "").trim();
      if (!text) return res.status(400).json({ error: "Comment text is required." });
      const author = req.user.name.split(/\s+/)[0] || req.user.name;
      await deps.query("insert into comments (id, author, text, time) values ($1, $2, $3, $4)", [
        deps.createId("c"),
        author,
        text,
        "just now"
      ]);
      const mentionMatch = text.match(/@(\w+)/);
      if (mentionMatch) {
        await deps.pushActivity(`Mention sent to @${mentionMatch[1]} in task comments.`);
        await deps.pushNotification("Mention sent", `@${mentionMatch[1]} was notified in task comments.`, true);
      } else {
        await deps.pushActivity("A new task comment was posted.");
        await deps.pushNotification("Comment posted", "A new task comment was added.", false);
      }
      await deps.respondWithState(res, req.user.id);
    }));
  };
}

module.exports = { createCommentsRoutes };
