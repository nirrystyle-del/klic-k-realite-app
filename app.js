const tg=window.Telegram?.WebApp;if(tg){tg.ready();tg.expand()}
const telegramUser=tg?.initDataUnsafe?.user||null;
const userKey=telegramUser?.id?String(telegramUser.id):"browser";
const db=window.KLIC_DATABASE;
const screens={access:document.getElementById("accessScreen"),profile:document.getElementById("profileScreen"),today:document.getElementById("todayScreen"),month:document.getElementById("monthScreen"),guide:document.getElementById("guideScreen"),subscription:document.getElementById("subscriptionScreen")};
const title=document.getElementById("screenTitle"),subtitle=document.getElementById("screenSubtitle");
const nameInput=document.getElementById("nameInput"),dayInput=document.getElementById("dayInput"),monthInput=document.getElementById("monthInput"),yearInput=document.getElementById("yearInput"),profileMessage=document.getElementById("profileMessage"),telegramStatus=document.getElementById("telegramStatus"),storageStatus=document.getElementById("storageStatus"),birthLockInfo=document.getElementById("birthLockInfo"),editBirthdateBtn=document.getElementById("editBirthdateBtn");
const todayNumber=document.getElementById("todayNumber"),todayText=document.getElementById("todayText"),todayTask=document.getElementById("todayTask"),monthNumber=document.getElementById("monthNumber"),monthText=document.getElementById("monthText"),monthTask=document.getElementById("monthTask");
const guideInput=document.getElementById("guideInput"),guideAnswer=document.getElementById("guideAnswer"),subscriptionStatus=document.getElementById("subscriptionStatus");
const BIRTHDATE_CHANGE_DAYS=30;
let birthdateEditUnlocked=false;
let currentProfile=null;
let currentAccess=false;

function renderTelegramStatus(){if(telegramUser){telegramStatus.textContent=`účet propojen, ID ${telegramUser.id}`}else{telegramStatus.textContent="testovací otevření mimo Telegram"}}
function renderStorageStatus(){storageStatus.textContent=db?.mode==="local_test"?"režim ukládání: lokální test, později databáze":"režim ukládání: databáze"}
async function hasActiveAccess(){currentAccess=await db.hasActiveAccess(userKey);return currentAccess}
async function setActiveAccess(value){currentAccess=await db.setTestAccess(userKey,value);renderSubscription()}
function renderSubscription(){const source=telegramUser?`Účet: ${telegramUser.id}`:"testovací režim bez Telegram účtu";subscriptionStatus.textContent=currentAccess?`Testovací režim je aktivní. Budoucí platba se bude ověřovat podle účtu a databáze. ${source}.`:`Testovací režim není aktivní. Bez přístupu jsou denní výklady, měsíc a průvodce zamčené. ${source}.`}
function reduceTo22(n){let v=Math.abs(Number(n)||0);while(v>22){v=String(v).split("").reduce((s,d)=>s+Number(d),0)}return v||22}
async function readProfile(){currentProfile=await db.getProfile(userKey);return currentProfile}
async function saveProfile(p){currentProfile=await db.saveProfile(userKey,p);return currentProfile}
function isValidDate(day,month,year){const d=Number(day),m=Number(month),y=Number(year);if(!d||!m||!y)return false;if(y<1900||y>2100)return false;const date=new Date(y,m-1,d);return date.getFullYear()===y&&date.getMonth()===m-1&&date.getDate()===d}
function daysSince(iso){if(!iso)return 9999;return Math.floor((Date.now()-new Date(iso).getTime())/(1000*60*60*24))}
function canChangeBirthdate(profile){return !profile?.birthdateChangedAt||daysSince(profile.birthdateChangedAt)>=BIRTHDATE_CHANGE_DAYS}
function daysUntilChange(profile){return Math.max(0,BIRTHDATE_CHANGE_DAYS-daysSince(profile.birthdateChangedAt))}
function setBirthdateFieldsLocked(locked){dayInput.disabled=locked;monthInput.disabled=locked;yearInput.disabled=locked}
function renderBirthdateLock(){const p=currentProfile;if(!p){setBirthdateFieldsLocked(false);editBirthdateBtn.classList.add("hidden");birthLockInfo.textContent="Příklad: 27 / 6 / 1997";return}
if(birthdateEditUnlocked){setBirthdateFieldsLocked(false);editBirthdateBtn.classList.add("hidden");birthLockInfo.textContent="Režim úpravy je aktivní. Po uložení se datum opět uzamkne.";return}
setBirthdateFieldsLocked(true);editBirthdateBtn.classList.remove("hidden");
if(canChangeBirthdate(p)){birthLockInfo.textContent="Datum narození je uložené a uzamčené. V případě chyby ho můžete upravit."}else{birthLockInfo.textContent=`Datum narození je uzamčené. Další změna bude možná přibližně za ${daysUntilChange(p)} dnů.`}}
function calculateForecast(p){const now=new Date(),day=now.getDate(),month=now.getMonth()+1,year=now.getFullYear();const base=Number(p.day)+Number(p.month)+Number(p.year);return{todayEnergy:reduceTo22(base+day+month+year),monthEnergy:reduceTo22(base+month+year)}}
function getDailyText(e){const source=window.FORECAST_TEXTS?.daily||{};return source[e]||source.default}
function getMonthlyText(e){const source=window.FORECAST_TEXTS?.monthly||{};return source[e]||source.default}
function renderForecast(){const p=currentProfile;if(!p){todayNumber.textContent="?";todayText.textContent="Nejdříve vyplňte profil. Potom se zde zobrazí denní energie.";todayTask.textContent="Nejdříve vyplňte profil.";monthNumber.textContent="?";monthText.textContent="Nejdříve vyplňte profil.";monthTask.textContent="Nejdříve vyplňte profil.";return}
const f=calculateForecast(p),daily=getDailyText(f.todayEnergy),monthly=getMonthlyText(f.monthEnergy);todayNumber.textContent=f.todayEnergy;todayText.textContent=`Dobrý den, ${p.name||"krásná duše"}. ${daily.text} Energie dne: ${f.todayEnergy}.`;todayTask.textContent=daily.task;monthNumber.textContent=f.monthEnergy;monthText.textContent=`${monthly.text} Energie měsíce: ${f.monthEnergy}.`;monthTask.textContent=monthly.task}
function protectedTab(tab){return["today","month","guide"].includes(tab)}
function showScreen(tab){if(protectedTab(tab)&&!currentAccess)tab="access";Object.entries(screens).forEach(([k,el])=>el.classList.toggle("active",k===tab));document.querySelectorAll("[data-tab]").forEach(btn=>btn.classList.toggle("active",btn.dataset.tab===tab));const labels={access:["Přístup","Tato část připravuje logiku předplatného."],profile:["Váš profil","Vyplňte své údaje. Datum narození je po uložení chráněné před častými změnami."],today:["Dnešní energie","Denní průvodce podle osobního výpočtu."],month:["Téma měsíce","Měsíční směr, doporučení a úkoly."],guide:["Průvodce","Prostor pro osobní rozbor dne a vašeho stavu."],subscription:["Předplatné","Zde bude později skutečná správa přístupu a plateb."]};title.textContent=labels[tab][0];subtitle.textContent=labels[tab][1]}
document.querySelectorAll("[data-tab]").forEach(btn=>btn.addEventListener("click",()=>showScreen(btn.dataset.tab)));

document.getElementById("saveProfileBtn").addEventListener("click",async()=>{const old=currentProfile;const newBirth={day:dayInput.value.trim(),month:monthInput.value.trim(),year:yearInput.value.trim()};if(!nameInput.value.trim()){profileMessage.textContent="Prosím, vyplňte jméno.";return}if(!isValidDate(newBirth.day,newBirth.month,newBirth.year)){profileMessage.textContent="Prosím, zadejte správné datum narození.";return}
const birthChanged=old&&(old.day!==newBirth.day||old.month!==newBirth.month||old.year!==newBirth.year);
if(birthChanged&&!birthdateEditUnlocked){profileMessage.textContent="Datum narození je uzamčené. Pro úpravu nejdříve použijte tlačítko Upravit datum narození.";renderBirthdateLock();return}
if(birthChanged&&old&&!canChangeBirthdate(old)){profileMessage.textContent=`Datum narození můžete znovu upravit přibližně za ${daysUntilChange(old)} dnů.`;birthdateEditUnlocked=false;renderBirthdateLock();return}
const p={telegramId:telegramUser?.id||null,telegramUsername:telegramUser?.username||"",telegramFirstName:telegramUser?.first_name||"",name:nameInput.value.trim(),day:newBirth.day,month:newBirth.month,year:newBirth.year,birthdateChangedAt:birthChanged||!old?new Date().toISOString():old.birthdateChangedAt,savedAt:new Date().toISOString()};
await saveProfile(p);birthdateEditUnlocked=false;profileMessage.textContent="Profil uložen. Datum narození je nyní uzamčené.";renderBirthdateLock();renderForecast();showScreen(currentAccess?"today":"access")});

editBirthdateBtn.addEventListener("click",()=>{const p=currentProfile;if(!p)return;if(!canChangeBirthdate(p)){profileMessage.textContent=`Datum narození můžete znovu upravit přibližně za ${daysUntilChange(p)} dnů.`;renderBirthdateLock();return}birthdateEditUnlocked=true;profileMessage.textContent="Můžete upravit datum narození. Po uložení se znovu uzamkne.";renderBirthdateLock()});
document.getElementById("activateTestBtn").addEventListener("click",async()=>{await setActiveAccess(true);showScreen("today")});
document.getElementById("activateFromSubscriptionBtn").addEventListener("click",async()=>{await setActiveAccess(true);showScreen("today")});
document.getElementById("resetAccessBtn").addEventListener("click",async()=>{await setActiveAccess(false);showScreen("access")});
document.getElementById("guideBtn").addEventListener("click",()=>{const text=guideInput.value.trim(),p=currentProfile;if(!p){guideAnswer.textContent="Nejdříve si prosím uložte profil.";return}if(!currentAccess){guideAnswer.textContent="Pro průvodce je potřeba aktivní přístup.";return}if(!text){guideAnswer.textContent="Napište, co dnes řešíte.";return}const f=calculateForecast(p);guideAnswer.textContent=`Testovací odpověď průvodce:\n\nDnes pracujeme s energií ${f.todayEnergy}. V další verzi zde bude hlubší osobní rozbor podle systému Klíč k realitě.`});

async function init(){renderTelegramStatus();renderStorageStatus();await readProfile();await hasActiveAccess();if(currentProfile){nameInput.value=currentProfile.name||"";dayInput.value=currentProfile.day||"";monthInput.value=currentProfile.month||"";yearInput.value=currentProfile.year||""}renderBirthdateLock();renderForecast();renderSubscription();if(!currentProfile)showScreen("profile");else if(!currentAccess)showScreen("access");else showScreen("today")}
init();
