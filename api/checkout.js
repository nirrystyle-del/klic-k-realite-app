const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  try {
    if (!process.env.STRIPE_PRICE_ID) {
      return res.status(500).send("Missing STRIPE_PRICE_ID");
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
      cancel_url: `${appUrl}?payment=cancel`
    });

    return res.redirect(303, session.url);
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return res.status(500).send("Stripe checkout failed: " + error.message);
  }
};
