async function createStripeCheckoutSession({ user, plan, config }) {
  if (!config.secretKey) {
    throw new Error("Stripe is not configured yet.");
  }
  if (!config.priceId && plan !== "Pro") {
    throw new Error("Stripe price is missing.");
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      mode: "subscription",
      success_url: config.successUrl || "http://localhost:3000/?billing=success",
      cancel_url: config.cancelUrl || "http://localhost:3000/?billing=cancel",
      customer_email: user.email,
      "line_items[0][price]": config.priceId,
      "line_items[0][quantity]": "1",
      "metadata[workspace]": user.workspace_name,
      "metadata[userId]": user.id
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Unable to start Stripe checkout.");
  }
  return payload;
}

module.exports = { createStripeCheckoutSession };
