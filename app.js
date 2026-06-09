const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

const screens = {
  profile: document.getElementById("profileScreen"),
  today: document.getElementById("todayScreen"),
  month: document.getElementById("monthScreen"),
  guide: document.getElementById("guideScreen"),
};

const title = document.getElementById("screenTitle");
const subtitle = document.getElementById("screenSubtitle");

const nameInput = document.getElementById("nameInput");
const dayInput = document.getElementById("dayInput");
const monthInput = document.getElementById("monthInput");
const yearInput = document.getElementById("yearInput");
const profileMessage = document.getElementById("profileMessage");

const todayNumber = document.getElementById("todayNumber");
const todayText = document.getElementById("todayText");
const monthNumber = document.getElementById("monthNumber");
const monthText = document.getElementById("monthText");

const guideInput = document.getElementById("guideInput");
const guideAnswer = document.getElementById("guideAnswer");

const STORAGE_KEY = "klic_k_realite_profile_v2";

function reduceTo22(n) {
  let value = Math.abs(Number(n) || 0);
  while (value > 22) {
    value = String(value).split("").reduce((sum, d) => sum + Number(d), 0);
  }
  return value || 22;
}

function readProfile() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch {
    return null;
  }
}

function saveProfile(profile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
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

function calculateForecast(profile) {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const personalBase = Number(profile.day) + Number(profile.month) + Number(profile.year);
  const todayEnergy = reduceTo22(personalBase + day + month + year);
  const monthEnergy = reduceTo22(personalBase + month + year);

  return { todayEnergy, monthEnergy };
}

function renderForecast() {
  const profile = readProfile();

  if (!profile) {
    todayNumber.textContent = "?";
    todayText.textContent = "Nejdříve vyplňte profil. Potom se zde zobrazí technický test denní energie.";
    monthNumber.textContent = "?";
    monthText.textContent = "Nejdříve vyplňte profil.";
    return;
  }

  const forecast = calculateForecast(profile);

  todayNumber.textContent = forecast.todayEnergy;
  todayText.textContent =
    `Dobrý den, ${profile.name || "krásná duše"}. Toto je zatím testovací výpočet pro ověření aplikace. ` +
    `Dnešní energie vyšla jako ${forecast.todayEnergy}. V další verzi sem vložíme skutečné výklady podle databáze.`;

  monthNumber.textContent = forecast.monthEnergy;
  monthText.textContent =
    `Téma měsíce je zatím technicky označené energií ${forecast.monthEnergy}. ` +
    `Později se sem doplní plný měsíční text, doporučení a úkoly měsíce.`;
}

function showScreen(tab) {
  Object.entries(screens).forEach(([key, el]) => {
    el.classList.toggle("active", key === tab);
  });

  document.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });

  const labels = {
    profile: ["Váš profil", "Vyplňte své údaje. Datum narození je rozdělené na den, měsíc a rok, aby šlo pohodlně zadat i na počítači."],
    today: ["Dnešní energie", "První technická verze osobního denního průvodce."],
    month: ["Téma měsíce", "Měsíční směr, doporučení a úkoly budou doplněny v další fázi."],
    guide: ["AI průvodce", "Zatím testovací průvodce bez napojení na skutečnou AI databázi."],
  };

  title.textContent = labels[tab][0];
  subtitle.textContent = labels[tab][1];
}

document.querySelectorAll("[data-tab]").forEach((btn) => {
  btn.addEventListener("click", () => showScreen(btn.dataset.tab));
});

document.getElementById("saveProfileBtn").addEventListener("click", () => {
  const profile = {
    name: nameInput.value.trim(),
    day: dayInput.value.trim(),
    month: monthInput.value.trim(),
    year: yearInput.value.trim(),
    telegramUser: tg?.initDataUnsafe?.user || null,
    savedAt: new Date().toISOString(),
  };

  if (!profile.name) {
    profileMessage.textContent = "Prosím, vyplňte jméno.";
    return;
  }

  if (!isValidDate(profile.day, profile.month, profile.year)) {
    profileMessage.textContent = "Prosím, zadejte správné datum narození.";
    return;
  }

  saveProfile(profile);
  profileMessage.textContent = "Profil uložen. Můžete přejít na dnešní energii.";
  renderForecast();
  showScreen("today");
});

document.getElementById("guideBtn").addEventListener("click", () => {
  const text = guideInput.value.trim();
  const profile = readProfile();

  if (!profile) {
    guideAnswer.textContent = "Nejdříve si prosím uložte profil.";
    return;
  }

  if (!text) {
    guideAnswer.textContent = "Napište, co dnes řešíte.";
    return;
  }

  const forecast = calculateForecast(profile);
  guideAnswer.textContent =
    `Testovací odpověď průvodce:\n\n` +
    `Dnes pracujeme s energií ${forecast.todayEnergy}. To, co popisujete, bude později rozebráno v souvislosti s vaším osobním nastavením, měsícem a aktuální energií dne. ` +
    `V další verzi zde bude skutečná AI odpověď podle databáze Klíč k realitě.`;
});

const saved = readProfile();
if (saved) {
  nameInput.value = saved.name || "";
  dayInput.value = saved.day || "";
  monthInput.value = saved.month || "";
  yearInput.value = saved.year || "";
  renderForecast();
  showScreen("today");
} else {
  renderForecast();
  showScreen("profile");
}
