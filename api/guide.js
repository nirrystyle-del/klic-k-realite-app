module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const body = req.body || {};

    const name = body.name || "váš profil";
    const question = body.question || "";
    const todayEnergy = body.todayEnergy || "";
    const monthEnergy = body.monthEnergy || "";
    const yearEnergy = body.yearEnergy || "";

    if (!question.trim()) {
      return res.status(400).json({
        error: "Missing question"
      });
    }

    const answer =
      `Vnímám vaši otázku: „${question}“\n\n` +
      `Dnes pracujete s energií ${todayEnergy}. Téma měsíce nese energii ${monthEnergy} a širší roční nastavení je spojeno s energií ${yearEnergy}.\n\n` +
      `V tuto chvíli je důležité nevyvíjet tlak na okamžité řešení. Zaměřte se na jeden konkrétní krok, který vám vrátí pocit vnitřní opory. Pokud se rozhodujete, neptejte se jen, co je správné, ale také kde cítíte klid a kde naopak ztrácíte vlastní sílu.\n\n` +
      `Tento výklad je připraven pro ${name}.`;

    return res.status(200).json({
      answer
    });
  } catch (error) {
    console.error("Guide error:", error);
    return res.status(500).json({
      error: "Guide error: " + error.message
    });
  }
};
