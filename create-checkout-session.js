const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      telegram_id,
      username = "",
      first_name = "",
      last_name = ""
    } = req.body || {};

    if (!telegram_id) {
      return res.status(400).json({ error: "Missing telegram_id" });
    }

    if (!process.env.STRIPE_PRICE_ID) {
      return res.status(500).json({ error: "Missing STRIPE_PRICE_ID" });
    }

    const appUrl = process.env.APP_URL || "https://klic-k-realite-app.vercel.app";

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
        telegram_id: String(telegram_id),
        username,
        first_name,
        last_name
      },
      subscription_data: {
        metadata: {
          telegram_id: String(telegram_id),
          username,
          first_name,
          last_name
        }
      }
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("create-checkout-session error", error);
    return res.status(500).json({ error: "Stripe checkout session failed" });
  }
};
