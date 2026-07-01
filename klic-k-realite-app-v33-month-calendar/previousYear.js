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

    return {
      ...profile,
      day: String(day),
      month: String(month),
      year: String(year)
    };
  }

  function readEmergencyProfile() {
    const userKey = getUserKey();
    const possibleKeys = [
      "klic_k_realite_profile_emergency_" + userKey,
      "klic_k_realite_profile_" + userKey,
      "profile_" + userKey
    ];

    for (const key of possibleKeys) {
      const profile = normalizeProfile(safeParse(localStorage.getItem(key)));
      if (profile) return profile;
    }

    // Last-resort scan of localStorage for any saved profile with birth data.
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (!key.includes("profile") && !key.includes("klic")) continue;

      const profile = normalizeProfile(safeParse(localStorage.getItem(key)));
      if (profile) return profile;
    }

    return null;
  }

  async function readProfile() {
    const userKey = getUserKey();
    const db = window.KLIC_DATABASE;

    if (db && typeof db.getProfile === "function") {
      try {
        const remoteProfile = normalizeProfile(await db.getProfile(userKey));
        if (remoteProfile) return remoteProfile;
      } catch (e) {
        console.warn("Previous year remote profile read failed", e);
      }
    }

    return readEmergencyProfile();
  }

  function formatBirthday(profile) {
    const year = new Date().getFullYear();
    const date = new Date(year, Number(profile.month) - 1, Number(profile.day));
    return date.toLocaleDateString("cs-CZ", {
      day: "numeric",
      month: "long"
    });
  }

  function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = value || "";
  }

  async function renderPreviousYear() {
    const profile = await readProfile();

    if (!profile || !profile.day || !profile.month || !profile.year) {
      setText("previousYearTitle", "Předchozí osobní rok");
      setText("previousYearIntro", "Tento blok se zobrazí po uložení profilu.");
      setText("previousYearPeriod", "");
      setText("previousYearText", "");
      return;
    }

    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    const previousEnergy = calcYearEnergy(profile, previousYear);
    const yearly = window.FORECAST_TEXTS?.yearly || {};
    const text = yearly[String(previousEnergy)] || "Výklad předchozího roku bude doplněn.";

    setText("previousYearTitle", `Předchozí osobní rok ${previousYear}, číslo ${previousEnergy}`);
    setText(
      "previousYearIntro",
      `Do vašich narozenin v tomto roce ještě dobíhá energie předchozího osobního roku. Proto je důležitá: ukazuje témata, která se mohou uzavírat, doznívat nebo se naposledy připomínat před vstupem do nové roční energie.`
    );
    setText(
      "previousYearPeriod",
      `Její vliv trvá do vašich narozenin v roce ${currentYear}, tedy do ${formatBirthday(profile)}.`
    );
    setText("previousYearText", text);
  }

  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(renderPreviousYear, 500);
    setTimeout(renderPreviousYear, 1500);
    setTimeout(renderPreviousYear, 3000);
  });

  window.addEventListener("storage", renderPreviousYear);
})();
