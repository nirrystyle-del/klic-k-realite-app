module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!stripeSecretKey) return res.status(500).send("Missing STRIPE_SECRET_KEY");
    if (!supabaseUrl) return res.status(500).send("Missing SUPABASE_URL");
    if (!supabaseServiceRoleKey) return res.status(500).send("Missing SUPABASE_SERVICE_ROLE_KEY");

    const event = req.body;

    async function getSubscription(subscriptionId) {
      const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${stripeSecretKey}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Could not retrieve Stripe subscription");
      }

      return data;
    }

    async function saveSubscription(subscription, statusOverride) {
      const telegramId = subscription.metadata?.telegram_id || "unknown";
      const status = statusOverride || subscription.status || "unknown";
      const periodEnd = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;

      const payload = {
        telegram_id: String(telegramId),
        payment_provider: "stripe",
        stripe_customer_id: String(subscription.customer || ""),
        stripe_subscription_id: String(subscription.id || ""),
        subscription_status: status,
        subscription_until: periodEnd,
        updated_at: new Date().toISOString()
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/subscriptions`, {
        method: "POST",
        headers: {
          "apikey": supabaseServiceRoleKey,
          "Authorization": `Bearer ${supabaseServiceRoleKey}`,
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error("Supabase save failed: " + text);
      }
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      if (session.subscription) {
        const subscription = await getSubscription(session.subscription);
        await saveSubscription(subscription);
      }
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object;

      if (invoice.subscription) {
        const subscription = await getSubscription(invoice.subscription);
        await saveSubscription(subscription);
      }
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;

      if (invoice.subscription) {
        const subscription = await getSubscription(invoice.subscription);
        await saveSubscription(subscription, "payment_failed");
      }
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object;
      await saveSubscription(subscription);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return res.status(500).send("Webhook error: " + error.message);
  }
};
