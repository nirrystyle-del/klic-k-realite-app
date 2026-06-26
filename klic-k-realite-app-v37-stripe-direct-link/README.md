# Klíč k realitě, Mini App starter v37 Stripe direct link

Oprava v37:
- Zaplatit kartou už není JS tlačítko
- je to běžný odkaz na /api/checkout
- /api/checkout vytvoří Stripe Checkout session a přesměruje na platbu
- stripeClient.js už jen doplní telegram_id do odkazu, pokud se načte
- pokud se JS nenačte, platba se přesto otevře
- cache busting změněný na ?v=37

Файлы для загрузки в GitHub:
- все файлы из ZIP, включая api/checkout.js
