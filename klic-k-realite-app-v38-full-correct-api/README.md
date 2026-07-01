# Klíč k realitě, Mini App starter v38 full correct api

Tato verze je kompletní balík pro znovunahrání všech souborů.

DŮLEŽITÉ:
- složka musí být přesně api, malými písmeny
- nesmí být API velkými písmeny
- uvnitř api musí být checkout.js

Správná struktura v GitHubu:
- index.html
- styles.css
- app.js
- database.js
- forecastTexts.js
- previousYear.js
- planetYear.js
- yearAccordion.js
- sectionAccordion.js
- monthlyCalendar.js
- stripeClient.js
- package.json
- supabase-stripe-migration.sql
- api/
  - checkout.js
  - check-access.js
  - create-checkout-session.js
  - stripe-webhook.js

Po nahrání:
1. Commit changes
2. Počkat na Vercel deploy
3. Otevřít https://klic-k-realite-app.vercel.app/api/checkout
