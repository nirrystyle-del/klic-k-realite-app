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

  function readProfile() {
    const key = "klic_k_realite_profile_emergency_" + getUserKey();
    return safeParse(localStorage.getItem(key));
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

  function renderPreviousYear() {
    const profile = readProfile();

    if (!profile || !profile.day || !profile.month || !profile.year) {
      setText("previousYearTitle", "Předchozí osobní rok");
      setText("previousYearIntro", "Nejdříve vyplňte profil.");
      setText("previousYearPeriod", "Nejdříve vyplňte profil.");
      setText("previousYearText", "Nejdříve vyplňte profil.");
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
    setTimeout(renderPreviousYear, 300);
    setTimeout(renderPreviousYear, 1200);
  });

  window.addEventListener("storage", renderPreviousYear);
})();
