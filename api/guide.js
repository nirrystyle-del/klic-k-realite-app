module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      return res.status(500).json({
        error: "Missing OPENAI_API_KEY"
      });
    }

    const body = req.body || {};

    const name = body.name || "";
    const question = body.question || "";
    const day = body.day || "";
    const month = body.month || "";
    const year = body.year || "";
    const todayEnergy = body.todayEnergy || "";
    const monthEnergy = body.monthEnergy || "";
    const yearEnergy = body.yearEnergy || "";

    if (!question.trim()) {
      return res.status(400).json({
        error: "Missing question"
      });
    }

    const systemPrompt = `
Jste osobní průvodce v aplikaci Klíč k realitě.

Pište česky, jemně, hluboce, ale srozumitelně.
Nepoužívejte slovo AI.
Nepoužívejte dlouhé pomlčky.
Nevytvářejte diagnózy, lékařská tvrzení, právní ani finanční garance.
Nevěštěte katastroficky.
Neříkejte uživateli, že něco musí udělat.
Mluvte jako klidný osobní průvodce, který pomáhá člověku pochopit aktuální energii, vnitřní stav a jeden další krok.

Struktura odpovědi:
1. krátké naladění na otázku
2. výklad podle energie dne, měsíce a roku
3. konkrétní doporučení na dnešek
4. jedna otázka k sebereflexi

Odpověď má mít 180 až 280 slov.
`;

    const userPrompt = `
Jméno: ${name}
Datum narození: ${day}. ${month}. ${year}

Energie dne: ${todayEnergy}
Energie měsíce: ${monthEnergy}
Energie roku: ${yearEnergy}

Otázka uživatele:
${question}
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        max_output_tokens: 900
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "OpenAI request failed");
    }

    const answer =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text ||
      "Průvodce teď nevrátil odpověď. Zkuste to prosím znovu.";

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
