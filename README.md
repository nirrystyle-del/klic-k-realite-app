# Klíč k realitě, Mini App starter v29 previous year db fix

Oprava v29:
- previousYear.js už nečte jen emergency localStorage
- nejdřív se snaží načíst profil přes KLIC_DATABASE.getProfile
- potom zkouší několik lokálních uložišť
- pokud profil nenajde, blok už nevypisuje třikrát Nejdříve vyplňte profil
- cache busting změněný na ?v=29

Файлы для загрузки в GitHub:
- index.html
- styles.css
- app.js
- database.js
- forecastTexts.js
- previousYear.js
- README.md
