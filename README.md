# Klíč k realitě - Mini App starter v14

Nové ve v14:
- denní výklady jsou napojené na hotový soubor denni-predpoved
- používá se všech 22 energií
- každá energie používá variantu podle vzoru z generátoru: 1-6 se opakuje po 6
- výpočet energie dne je přepsaný podle calculateForecast:
  - reduceEnergy
  - calcYearEnergy
  - calcMonthEnergy
  - calcDayEnergy
- obrazovka Dnes zůstává ve formátu:
  - Hlavní výklad dne
  - Doporučení
  - Oblast financí
  - Oblast vztahů
  - Oblast zdraví
- Supabase zůstává
- bez viditelného zmínění umělé inteligence

Файлы для загрузки в GitHub:
- index.html
- styles.css
- app.js
- database.js
- forecastTexts.js
- README.md
