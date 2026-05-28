function createBillingRoutes(deps) {
  const { asyncRoute, pushActivity, pushNotification, query, queryOne, requireSession, respondWithState } = deps;

  return function registerBillingRoutes(app) {
    app.patch("/api/billing/card", requireSession, asyncRoute(async (req, res) => {
      const name = String(req.body?.name || "").trim();
      const number = String(req.body?.number || "").replace(/\s+/g, "");
      await query("update billing set card_name = $1, card_last4 = $2 where id = 1", [name, number.slice(-4) || "0000"]);
      await pushActivity(`Payment method updated for ${name}.`);
      await pushNotification("Billing updated", "Payment method was updated.", false);
      await respondWithState(res, req.user.id);
    }));

    app.post("/api/billing/checkout", requireSession, asyncRoute(async (req, res) => {
      const plan = String(req.body?.plan || "Pro");
      const session = await deps.createStripeCheckoutSession({
        user: req.user,
        plan,
        config: deps.stripeConfig
      });
      await pushActivity(`${req.user.name} started a Stripe checkout session for ${plan}.`);
      res.json({ checkoutUrl: session.url, sessionId: session.id });
    }));

    app.patch("/api/billing/plan", requireSession, asyncRoute(async (req, res) => {
      const plan = String(req.body?.plan || "");
      if (plan === "Pro") {
        await query("update billing set plan = 'Pro', amount = 'Rs 499/month', member_limit = 999999, renewal = 'June 21, 2026' where id = 1");
        await pushActivity("Workspace upgraded to Pro plan.");
        await pushNotification("Plan upgraded", "Pro plan is now active.", true);
      } else if (plan === "Free") {
        await query("update billing set plan = 'Free', amount = 'Rs 0/month', member_limit = 5, renewal = 'Not applicable' where id = 1");
        await pushActivity("Workspace switched back to Free plan.");
        await pushNotification("Plan changed", "Workspace switched back to Free.", false);
      } else {
        return res.status(400).json({ error: "Unsupported billing plan." });
      }
      await respondWithState(res, req.user.id);
    }));
  };
}

module.exports = { createBillingRoutes };
