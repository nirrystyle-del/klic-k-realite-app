module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const appUrl = process.env.APP_URL || "https://klic-k-realite-app.vercel.app";

    if (!stripeSecretKey) return res.status(500).send("Missing STRIPE_SECRET_KEY");
    if (!supabaseUrl) return res.status(500).send("Missing SUPABASE_URL");
    if (!supabaseServiceRoleKey) return res.status(500).send("Missing SUPABASE_SERVICE_ROLE_KEY");

    const telegramId = req.query.telegram_id;

    if (!telegramId) {
      return res.status(400).send("Missing telegram_id");
    }

    const subscriptionResponse = await fetch(
      `${supabaseUrl}/rest/v1/subscriptions?telegram_id=eq.${encodeURIComponent(String(telegramId))}&select=*`,
      {
        method: "GET",
        headers: {
          "apikey": supabaseServiceRoleKey,
          "Authorization": `Bearer ${supabaseServiceRoleKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!subscriptionResponse.ok) {
      const text = await subscriptionResponse.text();
      throw new Error("Supabase read failed: " + text);
    }

    const rows = await subscriptionResponse.json();
    const subscription = rows && rows[0];

    if (!subscription || !subscription.stripe_customer_id) {
      return res.status(404).send("Stripe customer not found for this Telegram account");
    }

    const params = new URLSearchParams();
    params.append("customer", subscription.stripe_customer_id);
    params.append("return_url", appUrl);

    const portalResponse = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params
    });

    const data = await portalResponse.json();

    if (!portalResponse.ok) {
      throw new Error(data.error?.message || "Could not create customer portal session");
    }

    return res.redirect(303, data.url);
  } catch (error) {
    console.error("Customer portal error:", error);
    return res.status(500).send("Customer portal error: " + error.message);
  }
};
