const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  const telegramId = req.query.telegram_id || req.body?.telegram_id;

  if (!telegramId) {
    return res.status(400).json({ active: false, error: "Missing telegram_id" });
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("telegram_id", String(telegramId))
    .maybeSingle();

  if (error) {
    console.error("check-access error", error);
    return res.status(500).json({ active: false, error: "Database error" });
  }

  const activeStatuses = ["active", "trialing"];
  const until = data?.subscription_until ? new Date(data.subscription_until) : null;
  const isActive =
    data &&
    activeStatuses.includes(data.subscription_status) &&
    (!until || until.getTime() > Date.now());

  return res.status(200).json({
    active: Boolean(isActive),
    subscription: data || null
  });
};
