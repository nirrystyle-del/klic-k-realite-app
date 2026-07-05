module.exports = async function handler(req, res) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_PRICE_ID;
    const appUrl = process.env.APP_URL || "https://klic-k-realite-app.vercel.app";
    const telegramId = req.query.telegram_id || "unknown";

    if (!secretKey) {
      return res.status(500).send("Missing STRIPE_SECRET_KEY");
    }

    if (!priceId) {
      return res.status(500).send("Missing STRIPE_PRICE_ID");
    }

    const params = new URLSearchParams();
    params.append("mode", "subscription");
    params.append("line_items[0][price]", priceId);
    params.append("line_items[0][quantity]", "1");
    params.append("success_url", `${appUrl}?payment=success`);
    params.append("cancel_url", `${appUrl}?payment=cancel`);
    params.append("metadata[telegram_id]", String(telegramId));
    params.append("subscription_data[metadata][telegram_id]", String(telegramId));

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).send(
        "Stripe checkout failed: " + (data.error?.message || JSON.stringify(data))
      );
    }

    return res.redirect(303, data.url);
  } catch (error) {
    return res.status(500).send("Checkout error: " + error.message);
  }
};
