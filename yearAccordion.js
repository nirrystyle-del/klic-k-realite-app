(() => {
  function wrapCard(card, defaultOpen = false) {
    if (!card || card.classList.contains("accordion-ready")) return;

    const children = Array.from(card.children);
    if (!children.length) return;

    const title = card.querySelector("h3");
    const content = document.createElement("div");
    content.className = "accordion-content";

    children.forEach((child) => {
      if (child !== title) content.appendChild(child);
    });

    card.appendChild(content);
    card.classList.add("accordion-card", "accordion-ready");

    if (defaultOpen) {
      card.classList.add("open");
    }

    const toggle = (event) => {
      const isInteractive = ["BUTTON", "A", "INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName);
      if (isInteractive) return;

      card.classList.toggle("open");
    };

    card.addEventListener("click", toggle);
  }

  function setupYearAccordions() {
    const yearScreen = document.getElementById("yearScreen");
    if (!yearScreen) return;

    const planetText = document.getElementById("planetYearText");
    const currentText = document.getElementById("yearText");
    const previousText = document.getElementById("previousYearText");

    const planetCard = planetText?.closest(".daily-section");
    const currentCard = currentText?.closest(".daily-section");
    const previousCard = previousText?.closest(".daily-section");

    wrapCard(planetCard, false);
    wrapCard(currentCard, true);
    wrapCard(previousCard, false);
  }

  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(setupYearAccordions, 500);
    setTimeout(setupYearAccordions, 1500);
  });
})();
