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

    async function saveAccess(subscription, statusOverride) {
      const telegramId = subscription.metadata?.telegram_id;

      if (!telegramId || telegramId === "unknown") {
        throw new Error("Missing telegram_id in Stripe subscription metadata");
      }

      const stripeStatus = statusOverride || subscription.status || "unknown";
      const accessStatus = stripeStatus === "active" || stripeStatus === "trialing"
        ? "active"
        : stripeStatus;

      const periodEnd = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;

      const payload = {
        telegram_id: String(telegramId),
        status: accessStatus,
        provider: "stripe",
        expires_at: periodEnd,
        payment_provider: "stripe",
        stripe_customer_id: String(subscription.customer || ""),
        stripe_subscription_id: String(subscription.id || ""),
        subscription_status: stripeStatus,
        subscription_until: periodEnd,
        updated_at: new Date().toISOString()
      };

      const updateUrl = `${supabaseUrl}/rest/v1/subscriptions?telegram_id=eq.${encodeURIComponent(String(telegramId))}`;

      const updateResponse = await fetch(updateUrl, {
        method: "PATCH",
        headers: {
          "apikey": supabaseServiceRoleKey,
          "Authorization": `Bearer ${supabaseServiceRoleKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify(payload)
      });

      if (!updateResponse.ok) {
        const text = await updateResponse.text();
        throw new Error("Supabase update failed: " + text);
      }

      const updatedRows = await updateResponse.json();

      if (Array.isArray(updatedRows) && updatedRows.length > 0) {
        return;
      }

      const insertResponse = await fetch(`${supabaseUrl}/rest/v1/subscriptions`, {
        method: "POST",
        headers: {
          "apikey": supabaseServiceRoleKey,
          "Authorization": `Bearer ${supabaseServiceRoleKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify(payload)
      });

      if (!insertResponse.ok) {
        const text = await insertResponse.text();
        throw new Error("Supabase insert failed: " + text);
      }
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      if (session.subscription) {
        const subscription = await getSubscription(session.subscription);
        await saveAccess(subscription);
      }
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object;

      if (invoice.subscription) {
        const subscription = await getSubscription(invoice.subscription);
        await saveAccess(subscription);
      }
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;

      if (invoice.subscription) {
        const subscription = await getSubscription(invoice.subscription);
        await saveAccess(subscription, "payment_failed");
      }
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object;
      await saveAccess(subscription);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return res.status(500).send("Webhook error: " + error.message);
  }
};
