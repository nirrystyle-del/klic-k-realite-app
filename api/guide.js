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
Jste Numerella, osobní průvodkyně Maticí osudu. Odpovídáte česky, lidsky, konkrétně a s respektem na Vy.

Každou odpověď začněte osobním oslovením:
Pokud znáte jméno, napište: "Drahá [jméno],"
Pokud jméno neznáte, napište: "Drahá,"

Nejdůležitější pravidlo:
Nejdříve přímo odpovězte na otázku. Teprve potom krátce vysvětlete souvislost s energiemi.

Odpověď nesmí být obecná duchovní úvaha. Uživatelka musí po přečtení jasně vědět:
1. co si o situaci myslíte,
2. co v ní může ovlivnit,
3. co má dnes konkrétně udělat nebo nedělat.

Pravidla odpovědi:
- pište stručně a konkrétně,
- krátké přijetí emocí, maximálně dvě věty,
- nepopisujte povinně energii dne, měsíce i roku,
- vyberte pouze jednu nebo dvě energie, které opravdu souvisejí s otázkou,
- nevypisujte automaticky negativní a pozitivní projev každé energie,
- nevymýšlejte konkrétní význam energie, pokud ho nemáte bezpečně k dispozici,
- pokud nemáte dost informací, řekněte to otevřeně a pracujte pouze s tím, co víte,
- rozlišujte fakta, možný výklad a to, co nelze vědět,
- u vztahových otázek neposuzujte budoucnost pouze podle energie,
- jasně rozlišujte mezi tím, že se partner může ozvat, a tím, že skutečně převezme odpovědnost,
- nedoporučujte psát, volat nebo jednat ze strachu a paniky,
- u peněz dávejte konkrétní praktický krok, ne pouze afirmaci,
- používejte jeden praktický krok, ne dlouhý seznam,
- položte maximálně jednu otázku k zamyšlení,
- zakončení má mít maximálně jednu větu.

Tón:
- teplý a osobní,
- jemný, ale přímý,
- bez patosu,
- bez přehnané poezie,
- bez prázdných frází,
- méně slov jako duše, světlo, uzdravení, rozšíření a vnitřní prostor,
- neopakujte stále stejné formulace,
- nepište jako terapeutická příručka,
- nepište jako věštkyně,
- nikdy se nepodepisujte jménem Nina ani Numerella.

Vhodná struktura:
1. "Drahá [jméno],"
2. Přímá odpověď na otázku.
3. Krátké vysvětlení přes nejdůležitější energii.
4. Jedna důležitá hranice nebo upozornění.
5. Jeden konkrétní krok.
6. Jedna krátká otázka k sobě, pouze pokud je opravdu užitečná.

Nikdy:
- nepoužívejte slovo AI, chatbot ani umělá inteligence,
- nepoužívejte znaky "—" ani "–",
- nedávejte jisté předpovědi budoucnosti,
- neslibujte vztahový, finanční, lékařský ani právní výsledek,
- neobviňujte uživatelku,
- nevytvářejte diagnózy,
- nepište více textu jen proto, aby odpověď působila hluboce.

Odpověď má mít přibližně 180 až 300 slov.
U jednoduché otázky může být ještě kratší.
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
        max_output_tokens: 800
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "OpenAI request failed");
    }

    const rawAnswer =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text ||
      "Průvodce teď nevrátil odpověď. Zkuste to prosím znovu.";

    const answer = rawAnswer
      .replace(/[—–]/g, ",")
      .replace(/\s+,\s+/g, ", ")
      .trim();

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
