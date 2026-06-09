const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

const telegramUser = tg?.initDataUnsafe?.user || null;
const userKey = telegramUser?.id ? String(telegramUser.id) : "browser";
const db = window.KLIC_DATABASE;

const screens = {
  access: document.getElementById("accessScreen"),
  profile: document.getElementById("profileScreen"),
  today: document.getElementById("todayScreen"),
  month: document.getElementById("monthScreen"),
  guide: document.getElementById("guideScreen"),
  subscription: document.getElementById("subscriptionScreen")
};

const title = document.getElementById("screenTitle");
const subtitle = document.getElementById("screenSubtitle");

const nameInput = document.getElementById("nameInput");
const dayInput = document.getElementById("dayInput");
const monthInput = document.getElementById("monthInput");
const yearInput = document.getElementById("yearInput");
const profileMessage = document.getElementById("profileMessage");
const telegramStatus = document.getElementById("telegramStatus");
const storageStatus = document.getElementById("storageStatus");
const birthLockInfo = document.getElementById("birthLockInfo");
const editBirthdateBtn = document.getElementById("editBirthdateBtn");

const todayNumber = document.getElementById("todayNumber");
const todaySymbol = document.getElementById("todaySymbol");
const todayText = document.getElementById("todayText");
const todayRecommendations = document.getElementById("todayRecommendations");
const todayFinance = document.getElementById("todayFinance");
const todayRelationships = document.getElementById("todayRelationships");
const todayHealth = document.getElementById("todayHealth");

const monthNumber = document.getElementById("monthNumber");
const monthText = document.getElementById("monthText");
const monthTask = document.getElementById("monthTask");

const guideInput = document.getElementById("guideInput");
const guideAnswer = document.getElementById("guideAnswer");
const subscriptionStatus = document.getElementById("subscriptionStatus");
const subscriptionBadge = document.getElementById("subscriptionBadge");
const subscriptionExpires = document.getElementById("subscriptionExpires");

const BIRTHDATE_CHANGE_DAYS = 30;

let birthdateEditUnlocked = false;
let currentProfile = null;
let currentAccess = false;

function renderTelegramStatus() {
  if (!telegramStatus) return;
  telegramStatus.textContent = telegramUser ? "účet propojen" : "otevřeno mimo Telegram";
}

function renderStorageStatus() {
  if (!storageStatus) return;
  if (userKey === "browser") {
    storageStatus.textContent = "technický režim: mimo Telegram";
    return;
  }
  storageStatus.textContent = db?.fallbackMode ? "technický režim: lokální záloha" : "technický režim: účet ověřen";
}

async function refreshAccess() {
  currentAccess = await db.hasActiveAccess(userKey);
  renderStorageStatus();
  return currentAccess;
}

async function setActiveAccess(value) {
  currentAccess = await db.setTestAccess(userKey, value);
  renderStorageStatus();
  renderSubscription();
}

function renderSubscription() {
  if (subscriptionBadge) {
    subscriptionBadge.textContent = currentAccess ? "Přístup aktivní" : "Přístup neaktivní";
    subscriptionBadge.classList.toggle("active", currentAccess);
    subscriptionBadge.classList.toggle("inactive", !currentAccess);
  }

  if (subscriptionStatus) {
    subscriptionStatus.textContent = currentAccess
      ? "Váš přístup je aktivní."
      : "Bez aktivního přístupu jsou denní výklady, měsíční téma a průvodce uzamčené.";
  }

  if (subscriptionExpires) {
    subscriptionExpires.textContent = currentAccess
      ? "Přístup je aktivní přibližně na 30 dní."
      : "Po aktivaci se zde bude zobrazovat datum konce přístupu.";
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

function calcYearEnergyFromProfile(profile, year) {
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

function calculateForecast(profile) {
  const now = new Date();
  const yearEnergy = calcYearEnergyFromProfile(profile, now.getFullYear());
  const monthEnergy = calcMonthEnergy(yearEnergy, now.getMonth());
  const todayEnergy = calcDayEnergy(now.getDate(), monthEnergy);

  return { todayEnergy, monthEnergy, yearEnergy };
}

async function readProfile() {
  currentProfile = await db.getProfile(userKey);
  renderStorageStatus();
  return currentProfile;
}

async function saveProfile(profile) {
  currentProfile = await db.saveProfile(userKey, profile);
  renderStorageStatus();
  return currentProfile;
}

function isValidDate(day, month, year) {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);

  if (!d || !m || !y) return false;
  if (y < 1900 || y > 2100) return false;

  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

function daysSince(iso) {
  if (!iso) return 9999;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function canChangeBirthdate(profile) {
  return !profile?.birthdateChangedAt || daysSince(profile.birthdateChangedAt) >= BIRTHDATE_CHANGE_DAYS;
}

function daysUntilChange(profile) {
  return Math.max(0, BIRTHDATE_CHANGE_DAYS - daysSince(profile.birthdateChangedAt));
}

function setBirthdateFieldsLocked(locked) {
  dayInput.disabled = locked;
  monthInput.disabled = locked;
  yearInput.disabled = locked;
}

function renderBirthdateLock() {
  const profile = currentProfile;

  if (!profile) {
    setBirthdateFieldsLocked(false);
    editBirthdateBtn.classList.add("hidden");
    birthLockInfo.textContent = "Příklad: 27 / 6 / 1997";
    return;
  }

  if (birthdateEditUnlocked) {
    setBirthdateFieldsLocked(false);
    editBirthdateBtn.classList.add("hidden");
    birthLockInfo.textContent = "Režim úpravy je aktivní. Po uložení se datum opět uzamkne.";
    return;
  }

  setBirthdateFieldsLocked(true);
  editBirthdateBtn.classList.remove("hidden");

  birthLockInfo.textContent = canChangeBirthdate(profile)
    ? "Datum narození je uložené a uzamčené. V případě chyby ho můžete upravit."
    : `Datum narození je uzamčené. Další změna bude možná přibližně za ${daysUntilChange(profile)} dnů.`;
}

function getDailyText(energy) {
  const daily = window.FORECAST_TEXTS?.daily || {};
  return daily[String(energy)] || daily.default || {};
}

function getMonthlyText(energy) {
  const monthly = window.FORECAST_TEXTS?.monthly || {};
  return monthly[String(energy)] || monthly.default || {};
}

function renderRecommendations(items) {
  const arr = Array.isArray(items) ? items : [];
  if (!arr.length) return "<li>Bude doplněno podle výkladů.</li>";
  return arr.map(item => `<li>${item}</li>`).join("");
}

function renderForecast() {
  const profile = currentProfile;

  if (!profile) {
    todayNumber.textContent = "?";
    todaySymbol.textContent = "Nejdříve vyplňte profil.";
    todayText.textContent = "Nejdříve vyplňte profil. Potom se zde zobrazí denní energie.";
    todayRecommendations.innerHTML = "<li>Nejdříve vyplňte profil.</li>";
    todayFinance.textContent = "Nejdříve vyplňte profil.";
    todayRelationships.textContent = "Nejdříve vyplňte profil.";
    todayHealth.textContent = "Nejdříve vyplňte profil.";

    monthNumber.textContent = "?";
    monthText.textContent = "Nejdříve vyplňte profil.";
    monthTask.textContent = "Nejdříve vyplňte profil.";
    return;
  }

  const forecast = calculateForecast(profile);
  const daily = getDailyText(forecast.todayEnergy);
  const monthly = getMonthlyText(forecast.monthEnergy);

  todayNumber.textContent = forecast.todayEnergy;
  todaySymbol.textContent = (window.FORECAST_TEXTS?.symbols || {})[String(forecast.todayEnergy)] || "Symbol bude doplněn";
  todayText.textContent = daily.text || "Výklad bude doplněn.";
  todayRecommendations.innerHTML = renderRecommendations(daily.recommendations);
  todayRecommendations.className = "recommendation-list";
  todayFinance.textContent = daily.finance || "Bude doplněno podle výkladů.";
  todayRelationships.textContent = daily.relationships || "Bude doplněno podle výkladů.";
  todayHealth.textContent = daily.health || "Bude doplněno podle výkladů.";

  monthNumber.textContent = forecast.monthEnergy;
  monthText.textContent = monthly.text || "Měsíční výklad bude doplněn.";
  monthTask.textContent = monthly.task || "Úkol měsíce bude doplněn.";
}

function protectedTab(tab) {
  return ["today", "month", "guide"].includes(tab);
}

function showScreen(tab) {
  if (protectedTab(tab) && !currentAccess) tab = "access";

  Object.entries(screens).forEach(([key, element]) => {
    element.classList.toggle("active", key === tab);
  });

  document.querySelectorAll("[data-tab]").forEach(button => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });

  const labels = {
    access: ["Přístup", "Tato část připravuje logiku předplatného."],
    profile: ["Váš profil", "Vyplňte své údaje. Datum narození je po uložení chráněné před častými změnami."],
    today: ["Dnešní energie", "Denní průvodce podle osobního výpočtu."],
    month: ["Téma měsíce", "Měsíční směr, doporučení a úkoly."],
    guide: ["Průvodce", "Prostor pro osobní rozbor dne a vašeho stavu."],
    subscription: ["Přístup", "Zde bude později skutečná správa přístupu a plateb."]
  };

  title.textContent = labels[tab][0];
  subtitle.textContent = labels[tab][1];
}

document.querySelectorAll("[data-tab]").forEach(button => {
  button.addEventListener("click", () => showScreen(button.dataset.tab));
});

document.getElementById("saveProfileBtn").addEventListener("click", async () => {
  const oldProfile = currentProfile;
  const newBirth = {
    day: dayInput.value.trim(),
    month: monthInput.value.trim(),
    year: yearInput.value.trim()
  };

  if (!nameInput.value.trim()) {
    profileMessage.textContent = "Prosím, vyplňte jméno.";
    return;
  }

  if (!isValidDate(newBirth.day, newBirth.month, newBirth.year)) {
    profileMessage.textContent = "Prosím, zadejte správné datum narození.";
    return;
  }

  const birthChanged = oldProfile && (
    oldProfile.day !== newBirth.day ||
    oldProfile.month !== newBirth.month ||
    oldProfile.year !== newBirth.year
  );

  if (birthChanged && !birthdateEditUnlocked) {
    profileMessage.textContent = "Datum narození je uzamčené. Pro úpravu nejdříve použijte tlačítko Upravit datum narození.";
    renderBirthdateLock();
    return;
  }

  if (birthChanged && oldProfile && !canChangeBirthdate(oldProfile)) {
    profileMessage.textContent = `Datum narození můžete znovu upravit přibližně za ${daysUntilChange(oldProfile)} dnů.`;
    birthdateEditUnlocked = false;
    renderBirthdateLock();
    return;
  }

  const profile = {
    telegramId: telegramUser?.id || null,
    telegramUsername: telegramUser?.username || "",
    telegramFirstName: telegramUser?.first_name || "",
    name: nameInput.value.trim(),
    day: newBirth.day,
    month: newBirth.month,
    year: newBirth.year,
    birthdateChangedAt: birthChanged || !oldProfile ? new Date().toISOString() : oldProfile.birthdateChangedAt,
    savedAt: new Date().toISOString()
  };

  await saveProfile(profile);
  birthdateEditUnlocked = false;
  profileMessage.textContent = "Profil uložen. Datum narození je nyní uzamčené.";
  renderBirthdateLock();
  renderForecast();
  showScreen(currentAccess ? "today" : "access");
});

editBirthdateBtn.addEventListener("click", () => {
  const profile = currentProfile;
  if (!profile) return;

  if (!canChangeBirthdate(profile)) {
    profileMessage.textContent = `Datum narození můžete znovu upravit přibližně za ${daysUntilChange(profile)} dnů.`;
    renderBirthdateLock();
    return;
  }

  birthdateEditUnlocked = true;
  profileMessage.textContent = "Můžete upravit datum narození. Po uložení se znovu uzamkne.";
  renderBirthdateLock();
});

document.getElementById("activateTestBtn").addEventListener("click", async () => {
  await setActiveAccess(true);
  showScreen("today");
});

document.getElementById("activateFromSubscriptionBtn").addEventListener("click", async () => {
  await setActiveAccess(true);
  showScreen("today");
});

document.getElementById("resetAccessBtn").addEventListener("click", async () => {
  await setActiveAccess(false);
  showScreen("access");
});

const futurePaymentBtn = document.getElementById("futurePaymentBtn");
if (futurePaymentBtn) {
  futurePaymentBtn.addEventListener("click", () => {
    alert("Platba bude spuštěna v další fázi. Zatím je aplikace v přípravě.");
  });
}

const futurePaymentFromSubscriptionBtn = document.getElementById("futurePaymentFromSubscriptionBtn");
if (futurePaymentFromSubscriptionBtn) {
  futurePaymentFromSubscriptionBtn.addEventListener("click", () => {
    alert("Platba bude spuštěna v další fázi. Zatím je aplikace v přípravě.");
  });
}

document.getElementById("guideBtn").addEventListener("click", () => {
  const text = guideInput.value.trim();
  const profile = currentProfile;

  if (!profile) {
    guideAnswer.textContent = "Nejdříve si prosím uložte profil.";
    return;
  }

  if (!currentAccess) {
    guideAnswer.textContent = "Pro průvodce je potřeba aktivní přístup.";
    return;
  }

  if (!text) {
    guideAnswer.textContent = "Napište, co dnes řešíte.";
    return;
  }

  const forecast = calculateForecast(profile);
  guideAnswer.textContent =
    `Testovací odpověď průvodce:\n\nDnes pracujeme s energií ${forecast.todayEnergy}. V další verzi zde bude hlubší osobní rozbor podle systému Klíč k realitě.`;
});

async function init() {
  renderTelegramStatus();
  renderStorageStatus();

  await readProfile();
  await refreshAccess();

  if (currentProfile) {
    nameInput.value = currentProfile.name || "";
    dayInput.value = currentProfile.day || "";
    monthInput.value = currentProfile.month || "";
    yearInput.value = currentProfile.year || "";
  }

  renderBirthdateLock();
  renderForecast();
  renderSubscription();

  if (!currentProfile) {
    showScreen("profile");
  } else if (!currentAccess) {
    showScreen("access");
  } else {
    showScreen("today");
  }
}

init();
