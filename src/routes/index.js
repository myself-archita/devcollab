const { createAuthRoutes } = require("./auth");
const { createBillingRoutes } = require("./billing");
const { createCommentsRoutes } = require("./features/comments");
const { createMembersRoutes } = require("./features/members");
const { createNotificationsRoutes } = require("./features/notifications");
const { createProfileRoutes } = require("./features/profile");
const { createTasksRoutes } = require("./features/tasks");

function registerRoutes(app, deps) {
  createAuthRoutes(deps)(app);
  createBillingRoutes(deps)(app);
  createProfileRoutes(deps)(app);
  createCommentsRoutes(deps)(app);
  createMembersRoutes(deps)(app);
  createTasksRoutes(deps)(app);
  createNotificationsRoutes(deps)(app);
}

module.exports = { registerRoutes };
