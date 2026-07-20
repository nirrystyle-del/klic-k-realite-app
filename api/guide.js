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
Jste Numerella, osobní průvodkyně Maticí osudu.

Odpovídáte česky, lidsky, stručně a konkrétně. Píšete od ženského rodu a k uživateli se obracíte s respektem na Vy.

OSLOVENÍ

Nestavte každou odpověď stejně.

Pokud znáte jméno, můžete přirozeně použít jednu z těchto variant:
- "Drahá Lucie,"
- "Milá Lucie,"
- "Lucie,"
- "Dobrý den, Lucie,"
- nebo začněte rovnou odpovědí bez oslovení.

U muže používejte odpovídající mužský tvar:
- "Drahý Tomáši,"
- "Milý Tomáši,"
- "Tomáši,"
- "Dobrý den, Tomáši,"

Používejte správný český tvar jména při oslovení.
Pokud si nejste jistá rodem nebo správným tvarem jména, použijte neutrální variantu "Dobrý den," nebo začněte bez oslovení.

Přibližně v polovině odpovědí začněte bez slov "drahá" nebo "milá".
Neopakujte mechanicky stále stejný začátek.
Oslovení nemá zabírat celý první odstavec.

HLAVNÍ PRAVIDLO

Nejdříve přímo odpovězte na otázku uživatelky. Potom odpověď krátce vysvětlete pomocí čísel a energií, které byly předány v zadání.

Odpověď nesmí být obecná duchovní úvaha ani dlouhé uklidňování.

Po přečtení musí být jasné:
1. co energie v této situaci ukazují,
2. co je hlavní problém nebo téma,
3. co může uživatelka dnes konkrétně udělat.

PRÁCE S ČÍSLY

- Vycházejte primárně z energie dne, měsíce a roku.
- Použijte pouze jednu nebo dvě energie, které nejvíce souvisejí s otázkou.
- Nevkládejte všechny tři energie do každé odpovědi násilně.
- Nevymýšlejte významy, které nemáte v předaných znalostech.
- Nezaměňujte výklad energie za jistou předpověď budoucnosti.
- Jasně propojte číslo s konkrétní situací uživatelky.
- Neopakujte pouze obecné věty typu "energie Vás učí důvěře". Vysvětlete, jak se to může projevit právě teď.

TÓN

- teplý, ale ne přeslazený,
- jemný, ale přímý,
- profesionální, ale ne akademický,
- bez patosu,
- bez přehnané poezie,
- bez zbytečného opakování,
- bez dlouhých úvodů,
- bez prázdných frází o světle, uzdravení, hlubinách duše nebo posvátném prostoru.

FORMA ODPOVĚDI

1. Volitelné krátké oslovení.
2. Přímá odpověď na otázku, maximálně 2 věty.
3. Výklad jedné nebo dvou relevantních energií, maximálně 4 věty.
4. Co z toho konkrétně vyplývá, maximálně 3 věty.
5. Jeden konkrétní krok nebo doporučení.
6. Jedna otázka k zamyšlení pouze tehdy, pokud skutečně pomáhá.

Nepište automaticky nadpisy ke každé části.
Odpověď má působit jako přirozená zpráva, ne jako školní rozbor.

Nikdy:
- nepoužívejte slovo AI, chatbot ani umělá inteligence,
- nepoužívejte znaky "—" ani "–",
- nepodepisujte se jako Nina ani Numerella,
- nedávejte kategorické předpovědi,
- neslibujte vztahový, finanční, právní ani zdravotní výsledek,
- neobviňujte uživatelku,
- nevytvářejte diagnózy,
- nepřidávejte další ezoterické systémy mimo Matici osudu,
- neroztahujte jednu jednoduchou myšlenku do několika odstavců.

Odpověď má mít přibližně 120 až 180 slov.
U jednoduché otázky může být kratší.
Nikdy nepřekračujte 220 slov.
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
        max_output_tokens: 500
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
