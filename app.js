(() => {
 const tg = window.Telegram?.WebApp;
 if (tg) {
 tg.ready();
 tg.expand();
 }

 const telegramUser = tg?.initDataUnsafe?.user || null;
 const userKey = telegramUser?.id ? String(telegramUser.id) : "browser";
 const db = window.KLIC_DATABASE || null;

 const emergencyProfileKey = "klic_k_realite_profile_emergency_" + userKey;
 const emergencyAccessKey = "klic_k_realite_access_emergency_" + userKey;

 const $ = (id) => document.getElementById(id);

 const screens = {
 access: $("accessScreen"),
 profile: $("profileScreen"),
 today: $("todayScreen"),
 month: $("monthScreen"),
 year: $("yearScreen"),
 guide: $("guideScreen"),
 subscription: $("subscriptionScreen")
 };

 const title = $("screenTitle");
 const subtitle = $("screenSubtitle");

 const nameInput = $("nameInput");
 const dayInput = $("dayInput");
 const monthInput = $("monthInput");
 const yearInput = $("yearInput");
 const profileMessage = $("profileMessage");
 const telegramStatus = $("telegramStatus");
 const storageStatus = $("storageStatus");
 const birthLockInfo = $("birthLockInfo");
 const editBirthdateBtn = $("editBirthdateBtn");

 const todayNumber = $("todayNumber");
 const todaySymbol = $("todaySymbol");
 const todayText = $("todayText");
 const todayRecommendations = $("todayRecommendations");
 const todayFinance = $("todayFinance");
 const todayRelationships = $("todayRelationships");
 const todayHealth = $("todayHealth");

 const monthNumber = $("monthNumber");
 const monthSubtitle = $("monthSubtitle");
 const monthText = $("monthText");
 const monthPositive = $("monthPositive");
 const monthNegative = $("monthNegative");
 const monthFinance = $("monthFinance");
 const monthRelationships = $("monthRelationships");
 const monthHealth = $("monthHealth");

 const yearNumber = $("yearNumber");
 const yearSubtitle = $("yearSubtitle");
 const yearText = $("yearText");

 const guideInput = $("guideInput");
 const guideAnswer = $("guideAnswer");
 const subscriptionStatus = $("subscriptionStatus");
 const subscriptionBadge = $("subscriptionBadge");
 const subscriptionExpires = $("subscriptionExpires");

 const BIRTHDATE_CHANGE_DAYS = 30;

 let currentProfile = null;
 let currentAccess = false;
 let birthdateEditUnlocked = false;

 function safeJsonParse(value) {
 try { return JSON.parse(value); } catch (e) { return null; }
 }

 function saveEmergencyProfile(profile) {
 localStorage.setItem(emergencyProfileKey, JSON.stringify(profile));
 currentProfile = profile;
 }

 function readEmergencyProfile() {
 return safeJsonParse(localStorage.getItem(emergencyProfileKey));
 }

 function saveEmergencyAccess(value) {
 localStorage.setItem(emergencyAccessKey, value ? "1" : "0");
 currentAccess = !!value;
 }

 function readEmergencyAccess() {
 return localStorage.getItem(emergencyAccessKey) === "1";
 }

 function renderTelegramStatus() {
 if (telegramStatus) telegramStatus.textContent = telegramUser ? "účet propojen" : "otevřeno mimo Telegram";
 }

 function renderStorageStatus() {
 if (!storageStatus) return;
 if (!telegramUser) {
 storageStatus.textContent = "technický režim: mimo Telegram";
 return;
 }
 storageStatus.textContent = db?.fallbackMode ? "technický režim: lokální záloha" : "technický režim: účet ověřen";
 }

 async function readProfile() {
 const emergency = readEmergencyProfile();

 if (!db || !telegramUser) {
 currentProfile = emergency;
 return currentProfile;
 }

 try {
 const remote = await db.getProfile(userKey);
 currentProfile = remote || emergency || null;
 return currentProfile;
 } catch (e) {
 console.warn("Profile read failed, using emergency profile", e);
 currentProfile = emergency;
 return currentProfile;
 }
 }

 async function saveProfile(profile) {
 saveEmergencyProfile(profile);

 if (db && telegramUser) {
 try {
 const remote = await db.saveProfile(userKey, profile);
 currentProfile = remote || profile;
 saveEmergencyProfile(currentProfile);
 renderStorageStatus();
 return currentProfile;
 } catch (e) {
 console.warn("Remote profile save failed, emergency profile saved", e);
 }
 }

 currentProfile = profile;
 renderStorageStatus();
 return currentProfile;
 }

 async function refreshAccess() {
 const emergency = readEmergencyAccess();

 if (!db || !telegramUser) {
 currentAccess = emergency;
 return currentAccess;
 }

 try {
 const remote = await db.hasActiveAccess(userKey);
 currentAccess = !!remote || emergency;
 return currentAccess;
 } catch (e) {
 console.warn("Access read failed, using emergency access", e);
 currentAccess = emergency;
 return currentAccess;
 }
 }

 async function setActiveAccess(value) {
 saveEmergencyAccess(value);

 if (db && telegramUser) {
 try {
 currentAccess = await db.setTestAccess(userKey, value);
 } catch (e) {
 console.warn("Remote access save failed, emergency access saved", e);
 currentAccess = !!value;
 }
 } else {
 currentAccess = !!value;
 }

 renderSubscription();
 return currentAccess;
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

 const sum = String(n).split("").reduce((total, digit) => total + Number(digit), 0);

 if (sum === 22) return 22;
 if (sum > 22) return sum - 22;

 return sum;
 }

 function calcYearEnergyFromProfile(profile, year) {
 const yearSum = String(year).split("").reduce((total, digit) => total + Number(digit), 0);
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

 function stableVariant(max, salt) {
 if (!max || max < 1) return "1";

 const profile = currentProfile || {};
 const raw = `${userKey}|${profile.day || ""}|${profile.month || ""}|${profile.year || ""}|${salt}`;
 let hash = 0;

 for (let i = 0; i < raw.length; i++) {
 hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
 }

 return String(Math.abs(hash) % max + 1);
 }

 function getDailyText(energy) {
 const daily = window.FORECAST_TEXTS?.daily || {};
 return daily[String(energy)] || daily.default || {};
 }

 function getMonthlyText(energy) {
 const monthly = window.FORECAST_TEXTS?.monthly || {};
 const variants = monthly[String(energy)];

 if (!variants) return monthly.default || {};
 if (variants.text || variants.intro || variants.positive) return variants;

 const keys = Object.keys(variants);
 const now = new Date();
 const salt = `${now.getFullYear()}-${now.getMonth()}|month|${energy}`;
 const variant = stableVariant(keys.length, salt);

 return variants[variant] || variants[keys[0]] || {};
 }

 function getYearlyText(energy) {
 const yearly = window.FORECAST_TEXTS?.yearly || {};
 return yearly[String(energy)] || "Roční výklad bude doplněn.";
 }

 function renderRecommendations(items) {
 const arr = Array.isArray(items) ? items : [];
 if (!arr.length) return "<li>Bude doplněno podle výkladů.</li>";
 return arr.map(item => `<li>${item}</li>`).join("");
 }

 function setText(el, value) {
 if (el) el.textContent = value || "";
 }

 function setHtml(el, value) {
 if (el) el.innerHTML = value || "";
 }

 function setVisible(el, visible) {
 if (!el) return;
 const section = el.closest(".daily-section") || el;
 section.style.display = visible ? "" : "none";
 }

 function renderForecast() {
 const profile = currentProfile;

 if (!profile) {
 setText(todayNumber, "?");
 setText(todaySymbol, "Nejdříve vyplňte profil.");
 setText(todayText, "Nejdříve vyplňte profil.");
 setHtml(todayRecommendations, "<li>Bude doplněno podle výkladů.</li>");
 setText(todayFinance, "Bude doplněno podle výkladů.");
 setText(todayRelationships, "Bude doplněno podle výkladů.");
 setText(todayHealth, "Bude doplněno podle výkladů.");

 setText(monthNumber, "?");
 setVisible(monthText, true);
 setVisible(monthPositive, true);
 setVisible(monthNegative, true);
 setVisible(monthFinance, true);
 setVisible(monthRelationships, true);
 setVisible(monthHealth, true);
 setText(monthSubtitle, "Nejdříve vyplňte profil.");
 setText(monthText, "Nejdříve vyplňte profil.");
 setText(monthPositive, "Bude doplněno podle výkladů.");
 setText(monthNegative, "Bude doplněno podle výkladů.");
 setText(monthFinance, "Bude doplněno podle výkladů.");
 setText(monthRelationships, "Bude doplněno podle výkladů.");
 setText(monthHealth, "Bude doplněno podle výkladů.");

 setText(yearNumber, "?");
 setText(yearSubtitle, "Nejdříve vyplňte profil.");
 setText(yearText, "Nejdříve vyplňte profil.");
 return;
 }

 const forecast = calculateForecast(profile);
 const daily = getDailyText(forecast.todayEnergy);
 const monthly = getMonthlyText(forecast.monthEnergy);
 const yearly = getYearlyText(forecast.yearEnergy);

 setText(todayNumber, forecast.todayEnergy);
 setText(todaySymbol, (window.FORECAST_TEXTS?.symbols || {})[String(forecast.todayEnergy)] || "Symbol bude doplněn");
 setText(todayText, daily.text || "Výklad bude doplněn.");
 setHtml(todayRecommendations, renderRecommendations(daily.recommendations));
 if (todayRecommendations) todayRecommendations.className = "recommendation-list";
 setText(todayFinance, daily.finance || "Bude doplněno podle výkladů.");
 setText(todayRelationships, daily.relationships || "Bude doplněno podle výkladů.");
 setText(todayHealth, daily.health || "Bude doplněno podle výkladů.");

 setText(monthNumber, forecast.monthEnergy);
 setText(monthSubtitle, `Číslo měsíce ${forecast.monthEnergy}`);

 setVisible(monthText, !!monthly.intro);
 setText(monthText, monthly.intro || "");

 setVisible(monthPositive, !!monthly.positive);
 setText(monthPositive, monthly.positive || "");

 setVisible(monthNegative, !!monthly.negative);
 setText(monthNegative, monthly.negative || "");

 setVisible(monthFinance, !!monthly.finance);
 setText(monthFinance, monthly.finance || "");

 setVisible(monthRelationships, !!monthly.relationships);
 setText(monthRelationships, monthly.relationships || "");

 setVisible(monthHealth, !!monthly.health);
 setText(monthHealth, monthly.health || "");

 setText(yearNumber, forecast.yearEnergy);
 setText(yearSubtitle, `Osobní číslo roku ${forecast.yearEnergy}`);
 setText(yearText, yearly);
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
 const diff = Date.now() - new Date(iso).getTime();
 if (!Number.isFinite(diff)) return 9999;
 return Math.floor(diff / 86400000);
 }

 function canChangeBirthdate(profile) {
 return !profile?.birthdateChangedAt || daysSince(profile.birthdateChangedAt) >= BIRTHDATE_CHANGE_DAYS;
 }

 function daysUntilChange(profile) {
 return Math.max(0, BIRTHDATE_CHANGE_DAYS - daysSince(profile?.birthdateChangedAt));
 }

 function setBirthdateFieldsLocked(locked) {
 if (dayInput) dayInput.disabled = locked;
 if (monthInput) monthInput.disabled = locked;
 if (yearInput) yearInput.disabled = locked;
 }

 function renderBirthdateLock() {
 if (!birthLockInfo || !editBirthdateBtn) return;

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

 function fillProfileForm() {
 const profile = currentProfile;
 if (!profile) return;

 if (nameInput) nameInput.value = profile.name || "";
 if (dayInput) dayInput.value = profile.day || "";
 if (monthInput) monthInput.value = profile.month || "";
 if (yearInput) yearInput.value = profile.year || "";
 }

 function protectedTab(tab) {
 return ["today", "month", "year", "guide"].includes(tab);
 }

 function showScreen(tab) {
 if (protectedTab(tab) && !currentAccess) tab = "access";

 Object.entries(screens).forEach(([key, element]) => {
 if (element) element.classList.toggle("active", key === tab);
 });

 document.querySelectorAll("[data-tab]").forEach(button => {
 button.classList.toggle("active", button.dataset.tab === tab);
 });

 const labels = {
 access: ["Přístup", "Aktivujte přístup k osobním výkladům."],
 profile: ["Váš profil", "Vyplňte své údaje. Datum narození je po uložení chráněné před častými změnami."],
 today: ["Dnešní energie", "Denní průvodce podle osobního výpočtu."],
 month: ["Téma měsíce", "Měsíční směr, doporučení a úkoly."],
 year: ["Číslo roku", "Osobní roční energie podle výpočtu."],
 guide: ["Průvodce", "Prostor pro osobní rozbor dne a vašeho stavu."],
 subscription: ["Přístup", "Zde bude později skutečná správa přístupu a plateb."]
 };

 if (title) title.textContent = labels[tab]?.[0] || "";
 if (subtitle) subtitle.textContent = labels[tab]?.[1] || "";
 }

 function bindEvents() {
 document.querySelectorAll("[data-tab]").forEach(button => {
 button.addEventListener("click", () => showScreen(button.dataset.tab));
 });

 const saveProfileBtn = $("saveProfileBtn");
 if (saveProfileBtn) {
 saveProfileBtn.addEventListener("click", async () => {
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
 String(oldProfile.day) !== String(newBirth.day) ||
 String(oldProfile.month) !== String(newBirth.month) ||
 String(oldProfile.year) !== String(newBirth.year)
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
 profileMessage.textContent = "Profil uložen.";
 fillProfileForm();
 renderBirthdateLock();
 renderForecast();

 if (!currentAccess) await setActiveAccess(true);
 showScreen("today");
 });
 }

 if (editBirthdateBtn) {
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
 }

 const activateTestBtn = $("activateTestBtn");
 if (activateTestBtn) {
 activateTestBtn.addEventListener("click", async () => {
 await setActiveAccess(true);
 showScreen("today");
 });
 }

 const activateFromSubscriptionBtn = $("activateFromSubscriptionBtn");
 if (activateFromSubscriptionBtn) {
 activateFromSubscriptionBtn.addEventListener("click", async () => {
 await setActiveAccess(true);
 showScreen("today");
 });
 }

 const resetAccessBtn = $("resetAccessBtn");
 if (resetAccessBtn) {
 resetAccessBtn.addEventListener("click", async () => {
 await setActiveAccess(false);
 showScreen("access");
 });
 }

 const futurePaymentBtn = $("futurePaymentBtn");
 if (futurePaymentBtn) {
 futurePaymentBtn.addEventListener("click", () => {
 alert("Platba bude spuštěna v další fázi. Zatím je aplikace v přípravě.");
 });
 }

 const futurePaymentFromSubscriptionBtn = $("futurePaymentFromSubscriptionBtn");
 if (futurePaymentFromSubscriptionBtn) {
 futurePaymentFromSubscriptionBtn.addEventListener("click", () => {
 alert("Platba bude spuštěna v další fázi. Zatím je aplikace v přípravě.");
 });
 }

 const guideBtn = $("guideBtn");
 if (guideBtn) {
 guideBtn.addEventListener("click", () => {
 const text = guideInput?.value?.trim() || "";

 if (!currentProfile) {
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

 const forecast = calculateForecast(currentProfile);
 guideAnswer.textContent =
 `Testovací odpověď průvodce:\n\nDnes pracujeme s energií ${forecast.todayEnergy}. V další verzi zde bude hlubší osobní rozbor podle systému Klíč k realitě.`;
 });
 }
 }

 async function init() {
 renderTelegramStatus();
 renderStorageStatus();
 bindEvents();

 await readProfile();
 await refreshAccess();

 fillProfileForm();
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

 init().catch((error) => {
 console.error("Init failed", error);
 currentProfile = readEmergencyProfile();
 currentAccess = readEmergencyAccess();
 fillProfileForm();
 renderBirthdateLock();
 renderForecast();
 renderSubscription();
 showScreen(currentProfile ? "today" : "profile");
 });
})();