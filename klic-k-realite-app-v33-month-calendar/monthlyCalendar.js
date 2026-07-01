(() => {
  function $(id) {
    return document.getElementById(id);
  }

  function safeParse(value) {
    try {
      return JSON.parse(value);
    } catch (e) {
      return null;
    }
  }

  function reduceEnergy(n) {
    if (n === 22) return 22;
    if (n <= 22) return n;

    const sum = String(n)
      .split("")
      .reduce((total, digit) => total + Number(digit), 0);

    if (sum === 22) return 22;
    if (sum > 22) return sum - 22;

    return sum;
  }

  function calcYearEnergy(profile, year) {
    const yearSum = String(year)
      .split("")
      .reduce((total, digit) => total + Number(digit), 0);

    return reduceEnergy(Number(profile.day) + Number(profile.month) + yearSum);
  }

  function calcMonthEnergy(yearEnergy, monthIndex) {
    return reduceEnergy(yearEnergy + monthIndex + 1);
  }

  function calcDayEnergy(dayNumber, monthEnergy) {
    return reduceEnergy(dayNumber + monthEnergy);
  }

  function getUserKey() {
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    return tgUser?.id ? String(tgUser.id) : "browser";
  }

  function normalizeProfile(profile) {
    if (!profile) return null;

    const day = profile.day || profile.birth_day || profile.birthDay;
    const month = profile.month || profile.birth_month || profile.birthMonth;
    const year = profile.year || profile.birth_year || profile.birthYear;

    if (!day || !month || !year) return null;

    return { ...profile, day: String(day), month: String(month), year: String(year) };
  }

  async function readProfile() {
    const db = window.KLIC_DATABASE;
    const userKey = getUserKey();

    if (db && typeof db.getProfile === "function") {
      try {
        const profile = normalizeProfile(await db.getProfile(userKey));
        if (profile) return profile;
      } catch (e) {
        console.warn("Calendar profile read failed", e);
      }
    }

    const keys = [
      "klic_k_realite_profile_emergency_" + userKey,
      "klic_k_realite_profile_" + userKey,
      "profile_" + userKey
    ];

    for (const key of keys) {
      const profile = normalizeProfile(safeParse(localStorage.getItem(key)));
      if (profile) return profile;
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (!key.includes("profile") && !key.includes("klic")) continue;

      const profile = normalizeProfile(safeParse(localStorage.getItem(key)));
      if (profile) return profile;
    }

    return null;
  }

  function symbolForEnergy(energy) {
    const symbolText = (window.FORECAST_TEXTS?.symbols || {})[String(energy)] || "";
    const match = symbolText.match(/^\p{Emoji_Presentation}|\p{Extended_Pictographic}/u);
    if (match) return match[0];

    const fallback = {
      1: "✨", 2: "💞", 3: "💰", 4: "➕", 5: "📚", 6: "💞", 7: "🚗", 8: "💰", 9: "🌙", 10: "✨", 11: "🔥",
      12: "🌙", 13: "💞", 14: "➕", 15: "📚", 16: "💞", 17: "🚗", 18: "🌙", 19: "💰", 20: "💞", 21: "🚗", 22: "✨"
    };

    return fallback[energy] || "✦";
  }

  function renderEmpty() {
    const title = $("calendarTitle");
    const subtitle = $("calendarSubtitle");
    const energy = $("calendarMonthEnergy");
    const grid = $("calendarGrid");

    if (title) title.textContent = "Kalendář měsíce";
    if (subtitle) subtitle.textContent = "Nejdříve vyplňte profil.";
    if (energy) energy.textContent = "?";
    if (grid) grid.innerHTML = "";
  }

  async function renderCalendar() {
    const block = $("monthCalendarBlock");
    const grid = $("calendarGrid");
    if (!block || !grid) return;

    const profile = await readProfile();
    if (!profile) {
      renderEmpty();
      return;
    }

    const now = new Date();
    const year = now.getFullYear();
    const monthIndex = now.getMonth();
    const today = now.getDate();

    const yearEnergy = calcYearEnergy(profile, year);
    const monthEnergy = calcMonthEnergy(yearEnergy, monthIndex);
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const mondayOffset = firstDay === 0 ? 6 : firstDay - 1;

    const monthName = now.toLocaleDateString("cs-CZ", { month: "long", year: "numeric" });

    $("calendarTitle").textContent = `Kalendář na ${monthName}`;
    $("calendarSubtitle").textContent = `Energie měsíce ${monthEnergy}`;
    $("calendarMonthEnergy").textContent = monthEnergy;

    const weekdays = ["PO", "ÚT", "ST", "ČT", "PÁ", "SO", "NE"];
    let html = weekdays.map((day) => `<div class="calendar-weekday">${day}</div>`).join("");

    for (let i = 0; i < mondayOffset; i++) {
      html += `<div class="calendar-day empty"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayEnergy = calcDayEnergy(day, monthEnergy);
      const symbol = symbolForEnergy(dayEnergy);
      const isToday = day === today;

      html += `
        <div class="calendar-day ${isToday ? "today" : ""}">
          <div class="calendar-day-number">${day}</div>
          <div class="calendar-day-energy">energie ${dayEnergy}</div>
          <div class="calendar-day-symbol">${symbol}</div>
        </div>
      `;
    }

    grid.innerHTML = html;
  }

  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(renderCalendar, 500);
    setTimeout(renderCalendar, 1500);
    setTimeout(renderCalendar, 3000);
  });

  window.addEventListener("storage", renderCalendar);
})();
