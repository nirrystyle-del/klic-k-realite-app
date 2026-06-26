(() => {
  function getTelegramUser() {
    return window.Telegram?.WebApp?.initDataUnsafe?.user || null;
  }

  function getTelegramId() {
    const user = getTelegramUser();
    return user?.id ? String(user.id) : "browser";
  }

  function setStatus(message, type) {
    const el = document.getElementById("stripePaymentStatus");
    if (!el) return;
    el.textContent = message || "";
    el.classList.remove("error", "success");
    if (type) el.classList.add(type);
  }

  async function startCheckout() {
    const button = document.getElementById("stripeCheckoutButton");
    if (!button) return;

    const telegramUser = getTelegramUser();
    const telegramId = getTelegramId();

    button.disabled = true;
    const oldText = button.textContent;
    button.textContent = "Připravuji platbu...";
    setStatus("", "");

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_id: telegramId,
          username: telegramUser?.username || "",
          first_name: telegramUser?.first_name || "",
          last_name: telegramUser?.last_name || ""
        })
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Nepodařilo se vytvořit platbu.");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      setStatus("Platbu se nepodařilo otevřít. Zkuste to prosím znovu.", "error");
      button.disabled = false;
      button.textContent = oldText;
    }
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
    const button = document.getElementById("stripeCheckoutButton");
    if (button) button.addEventListener("click", startCheckout);
    checkPaymentReturn();
  });
})();
