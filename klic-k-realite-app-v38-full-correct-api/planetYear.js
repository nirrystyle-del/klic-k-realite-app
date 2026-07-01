(() => {
  const PLANET_YEAR = {
    year: 2026,
    subtitle: "Rok 2026, energie 1 a 10",
    text: "Číslo roku pro celou planetu pro\nrok 2026\n2026 rok je velmi neobvyklý, protože v sobě nese hned dvě energie: energii 1 a 10.\nProto půjde o období neuvěřitelně silné, výjimečné a nepodobné tomu předchozímu. Co je vlastně Jednič‐\nka? Je to nová etapa. Předchozí cyklus uzavírá Devítka. Rok 2025 byl posledním rokem předchozího cyklu.\nJednička nám přináší zcela nový životní cyklus pro celé lidstvo. Očistily jsme se. Uzavřely jsme všechny ne‐\npotřebné vztahy, události, přátelství i práci. A teď je pro nás důležité zasít semínka ve všech oblastech života\na začít něco nového. Opět platí, že by měly být zasaženy všechny sféry života.\nV práci by se mělo objevit něco nového. Vztahy by měly znovu ožít a Vy do nich máte něco přinést - pří‐\npadně se stát v těchto vztazích novým člověkem. Totéž platí pro nová partnerství, nové lidi, nové peníze i\nnové zdroje příjmů. Také nová, výjimečná péče o zdraví. Pokud už máte pevný vztah s partnerem, měl by\nalespoň přejít na vyšší úroveň. Pokud máte stabilní podnikání, i ono by mělo povyrůst na další stupeň.\nVstoupit do toho všeho lze pouze skrze vlastní rozvoj a učení.\nV roce Jedničky je nesmírně důležité nesedět na místě, zapisovat si cíle a plány. A pokud se Vám na cestě\npřestanou líbit a vymyslíte něco nového, můžete se od původního směle odklonit. Hlavní je v Jedničce po‐\nložit základ pro nový cyklus a prostě se rozvíjet a růst jako osobnost. To je velmi, velmi důležité. Pokud bu‐\ndete zaměřená jen na jednu oblast života, pak se zbylých osm let budete buď popasovávat pouze s ní, nebo\nse rozvíjet jen v ní. Proto je klíčové dotknout se všeho, co je pro Vás v životě podstatné.\nStejně tak je v roce Jedničky důležité se nepřetěžovat, udržovat rovnováhu mezi zátěží a odpočinkem a ne‐\nzahlcovat se problémy. Zároveň však vstupujeme do Desítky. Tomuto číslu se říká Štěstí nebo Kolo štěstí.\nSoučasně je to ale velmi karmické číslo, které může udeřit zcela nečekaným způsobem. Máte-li nějaké kar‐\nmické záležitosti, které se Vám rok co rok či cyklus co cyklus opakují, pokud jste se v něčem zasekla, můžete\nbýt nečekaně „otočena“. Dostane se Vám šance z toho vystoupit - možná i přes bolest. To však platí pouze\ntehdy, pokud u Vás takové děje skutečně jsou.\nU Desítky je po celý rok zásadní jít přes důvěru v proměny. Umět důvěřovat, nekontrolovat, umět se uvol‐\nnit a své nápady realizovat hned. To je velmi důležité. Jinak Desítka umí „trestat“ ve chvíli, kdy se úzkostní‐\nme, nedůvěřujeme dění a snažíme se tlačit na vnější okolnosti místo toho, abychom důvěřovaly vnitřnímu\nvedení. Hlavní lekcí Desítky je proto naučit se důvěřovat sobě i Vyšším Silám a vše přijímat s obrovskou\nvděčností.\nProžíváte-li to v důvěře, přináší to neuvěřitelný úspěch. Události se budou skládat ve Váš prospěch. A i\nkdyž se na první pohled může zdát, že se vše hroutí, nakonec Desítka daruje ty nejcennější dary. Pokud se\nvšak žije „v minusu“, může být obtíží opravdu hodně - doslova boj s větrem: nekonečný, bezvýchodný a\nzcela zbytečný.\nVyužívejte tedy všechny příležitosti, které Vám život v tomto období nabízí. Nedržte se starého a buďte\notevřená změnám, protože k Vám přicházejí s maximální péčí."
  };

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "";
  }

  function renderPlanetYear() {
    setText("planetYearTitle", `Rok pro celou planetu ${PLANET_YEAR.year}`);
    setText("planetYearSubtitle", PLANET_YEAR.subtitle);
    setText("planetYearText", PLANET_YEAR.text);
  }

  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(renderPlanetYear, 300);
    setTimeout(renderPlanetYear, 1200);
  });
})();
