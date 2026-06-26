const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function upsertSubscription({
  telegramId,
  status,
  stripeCustomerId,
  stripeSubscriptionId,
  currentPeriodEnd,
  paymentProvider = "stripe"
}) {
  if (!telegramId) return;

  const subscriptionUntil = currentPeriodEnd
    ? new Date(currentPeriodEnd * 1000).toISOString()
    : null;

  const payload = {
    telegram_id: String(telegramId),
    subscription_status: status,
    payment_provider: paymentProvider,
    stripe_customer_id: stripeCustomerId || null,
    stripe_subscription_id: stripeSubscriptionId || null,
    updated_at: new Date().toISOString()
  };

  if (subscriptionUntil) {
    payload.subscription_until = subscriptionUntil;
  }

  const { error } = await supabase
    .from("subscriptions")
    .upsert(payload, { onConflict: "telegram_id" });

  if (error) {
    console.error("Supabase subscription upsert error", error);
    throw error;
  }
}

module.exports.config = {
  api: {
    bodyParser: false
  }
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method not allowed");
  }

  const sig = req.headers["stripe-signature"];
  const rawBody = await buffer(req);

  let event;

  try {
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } else {
      event = JSON.parse(rawBody.toString("utf8"));
    }
  } catch (error) {
    console.error("Webhook signature verification failed", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const telegramId = session.metadata?.telegram_id;

      if (session.mode === "subscription" && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);

        await upsertSubscription({
          telegramId,
          status: subscription.status,
          stripeCustomerId: session.customer,
          stripeSubscriptionId: subscription.id,
          currentPeriodEnd: subscription.current_period_end
        });
      }
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object;

      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const telegramId = subscription.metadata?.telegram_id;

        await upsertSubscription({
          telegramId,
          status: subscription.status,
          stripeCustomerId: subscription.customer,
          stripeSubscriptionId: subscription.id,
          currentPeriodEnd: subscription.current_period_end
        });
      }
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;

      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const telegramId = subscription.metadata?.telegram_id;

        await upsertSubscription({
          telegramId,
          status: "payment_failed",
          stripeCustomerId: subscription.customer,
          stripeSubscriptionId: subscription.id,
          currentPeriodEnd: subscription.current_period_end
        });
      }
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object;
      const telegramId = subscription.metadata?.telegram_id;

      await upsertSubscription({
        telegramId,
        status: subscription.status,
        stripeCustomerId: subscription.customer,
        stripeSubscriptionId: subscription.id,
        currentPeriodEnd: subscription.current_period_end
      });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("stripe webhook handler error", error);
    return res.status(500).send("Webhook handler failed");
  }
};
