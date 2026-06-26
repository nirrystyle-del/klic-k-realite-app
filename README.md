# Klíč k realitě, Mini App starter v34 Stripe subscriptions

Nové ve v34:
- přidaná karta předplatného a tlačítko Zaplatit kartou
- přidané Stripe Checkout předplatné
- přidané Vercel API funkce:
  - /api/create-checkout-session
  - /api/stripe-webhook
  - /api/check-access
- přidaný stripeClient.js
- přidaný package.json se závislostmi stripe a supabase
- přidaný soubor supabase-stripe-migration.sql
- cache busting změněný na ?v=34

Nutné Vercel Environment Variables:
- STRIPE_SECRET_KEY
- STRIPE_PRICE_ID
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- APP_URL

Další krok po uploadu:
1. Upload všech souborů do GitHubu.
2. Počkat na deploy ve Vercelu.
3. V Supabase spustit SQL ze souboru supabase-stripe-migration.sql.
4. Ve Stripe přidat webhook:
   https://klic-k-realite-app.vercel.app/api/stripe-webhook
