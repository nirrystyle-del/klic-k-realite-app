(() => {
  function getTelegramUser() {
    return window.Telegram?.WebApp?.initDataUnsafe?.user || null;
  }

  function enhanceCheckoutLink() {
    const link = document.getElementById("stripeCheckoutButton");
    if (!link) return;

    const user = getTelegramUser();
    if (!user?.id) {
      link.href = "/api/checkout";
      return;
    }

    const params = new URLSearchParams();
    params.set("telegram_id", String(user.id));
    if (user.username) params.set("username", user.username);

    link.href = `/api/checkout?${params.toString()}`;
  }

  function setStatus(message, type) {
    const el = document.getElementById("stripePaymentStatus");
    if (!el) return;
    el.textContent = message || "";
    el.classList.remove("error", "success");
    if (type) el.classList.add(type);
  }

  function checkPaymentReturn() {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("payment");

    if (status === "success") {
      setStatus("Platba proběhla úspěšně. Přístup se aktivuje během chvilky.", "success");
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (status === "cancel") {
      setStatus("Platba nebyla dokončena.", "error");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    enhanceCheckoutLink();
    checkPaymentReturn();
    setTimeout(enhanceCheckoutLink, 500);
    setTimeout(enhanceCheckoutLink, 1500);
  });
})();
