(() => {
  function wrapCard(card, defaultOpen = false) {
    if (!card || card.classList.contains("section-accordion-ready")) return;

    const title = card.querySelector("h3");
    if (!title) return;

    const children = Array.from(card.children);
    const content = document.createElement("div");
    content.className = "accordion-content";

    children.forEach((child) => {
      if (child !== title) content.appendChild(child);
    });

    card.appendChild(content);
    card.classList.add("section-accordion-ready");

    if (defaultOpen) {
      card.classList.add("open");
    }

    card.addEventListener("click", (event) => {
      const isInteractive = ["BUTTON", "A", "INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName);
      if (isInteractive) return;

      card.classList.toggle("open");
    });
  }

  function setupScreen(screenId, defaultOpenSelectors = []) {
    const screen = document.getElementById(screenId);
    if (!screen) return;

    const cards = Array.from(screen.querySelectorAll(".daily-section"));
    cards.forEach((card, index) => {
      const shouldOpen = defaultOpenSelectors.some((selector) => card.matches(selector)) || index === 0;
      wrapCard(card, shouldOpen);
    });
  }

  function setupAccordions() {
    setupScreen("todayScreen", [".main-reading"]);
    setupScreen("monthScreen", [".main-reading"]);
  }

  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(setupAccordions, 500);
    setTimeout(setupAccordions, 1500);
  });
})();
