function createMembersRoutes(deps) {
  return function registerMembersRoutes(app) {
    app.post("/api/members", deps.requireSession, deps.asyncRoute(async (req, res) => {
      const billing = await deps.queryOne("select * from billing where id = 1");
      const memberCount = await deps.queryOne("select count(*)::int as count from members");
      if (billing?.plan === "Free" && memberCount?.count >= billing.member_limit) {
        return res.status(400).json({ error: "Free plan member limit reached. Upgrade to Pro." });
      }
      const name = String(req.body?.name || "").trim();
      const email = String(req.body?.email || "").trim();
      const role = String(req.body?.role || "Member");
      await deps.query("insert into members (id, name, email, role) values ($1, $2, $3, $4)", [
        deps.createId("m"),
        name,
        email,
        role
      ]);
      await deps.pushActivity(`${name} joined the workspace as ${role}.`);
      await deps.pushNotification("Member added", `${name} joined as ${role}.`, true);
      await deps.respondWithState(res, req.user.id);
    }));

    app.patch("/api/members/:memberId", deps.requireSession, deps.asyncRoute(async (req, res) => {
      const member = await deps.queryOne("select * from members where id = $1", [req.params.memberId]);
      if (!member) return res.status(404).json({ error: "Member not found." });
      const action = req.body?.action;
      if (action === "promote") {
        const nextRole = member.role === "Viewer" ? "Member" : member.role === "Member" ? "Admin" : member.role;
        await deps.query("update members set role = $1 where id = $2", [nextRole, member.id]);
        await deps.pushActivity(`${member.name} was updated to role ${nextRole}.`);
        await deps.pushNotification("Role updated", `${member.name} is now ${nextRole}.`, true);
      } else if (action === "remove") {
        await deps.query("delete from members where id = $1", [member.id]);
        await deps.pushActivity(`${member.name} was removed from the workspace.`);
        await deps.pushNotification("Member removed", `${member.name} was removed from the workspace.`, true);
      } else {
        return res.status(400).json({ error: "Unsupported member action." });
      }
      await deps.respondWithState(res, req.user.id);
    }));
  };
}

module.exports = { createMembersRoutes };
