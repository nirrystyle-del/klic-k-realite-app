const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).send("Method not allowed");
  }

  try {
    if (!process.env.STRIPE_PRICE_ID) {
      return res.status(500).send("Missing STRIPE_PRICE_ID");
    }

    const appUrl = process.env.APP_URL || "https://klic-k-realite-app.vercel.app";

    const telegramId = req.query.telegram_id || req.query.tg || "unknown";
    const username = req.query.username || "";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1
        }
      ],
      success_url: `${appUrl}?payment=success`,
      cancel_url: `${appUrl}?payment=cancel`,
      allow_promotion_codes: false,
      metadata: {
        telegram_id: String(telegramId),
        username: String(username),
        source: "direct_link"
      },
      subscription_data: {
        metadata: {
          telegram_id: String(telegramId),
          username: String(username),
          source: "direct_link"
        }
      }
    });

    return res.redirect(303, session.url);
  } catch (error) {
    console.error("direct checkout error", error);
    return res.status(500).send(`Stripe checkout failed: ${error.message}`);
  }
};
