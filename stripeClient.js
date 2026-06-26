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

  function looksLikePaymentButton(el) {
    if (!el) return false;

    const text = (el.textContent || "").trim().toLowerCase();
    const id = (el.id || "").toLowerCase();
    const cls = (el.className || "").toString().toLowerCase();

    return (
      id.includes("stripecheckout") ||
      id.includes("pay") ||
      id.includes("payment") ||
      id.includes("subscribe") ||
      cls.includes("stripe-pay") ||
      text.includes("zaplatit") ||
      text.includes("aktivovat přístup") ||
      text.includes("aktivovat pristup") ||
      text.includes("předplatné") ||
      text.includes("predplatne") ||
      text.includes("240")
    );
  }

  function getPaymentButtons() {
    const buttons = Array.from(document.querySelectorAll("button, .primary-btn, [role='button']"));
    return buttons.filter(looksLikePaymentButton);
  }

  async function startCheckout(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }

    const button = event?.currentTarget || document.getElementById("stripeCheckoutButton");
    const telegramUser = getTelegramUser();
    const telegramId = getTelegramId();

    if (button) {
      button.disabled = true;
      button.dataset.oldText = button.textContent || "";
      button.textContent = "Připravuji platbu...";
    }

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

      if (button) {
        button.disabled = false;
        button.textContent = button.dataset.oldText || "Zaplatit kartou";
      }

      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert("Platbu se nepodařilo otevřít. Zkuste to prosím znovu.");
      }
    }
  }

  function attachPaymentHandlers() {
    const buttons = getPaymentButtons();

    buttons.forEach((button) => {
      if (button.dataset.stripeHandlerReady === "1") return;

      button.dataset.stripeHandlerReady = "1";

      const text = (button.textContent || "").trim().toLowerCase();
      if (
        text.includes("platba bude") ||
        text.includes("aktivovat") ||
        text.includes("240") ||
        button.id === "stripeCheckoutButton"
      ) {
        button.textContent = "Zaplatit kartou";
      }

      button.addEventListener("click", startCheckout, true);
    });
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
    checkPaymentReturn();
    setTimeout(attachPaymentHandlers, 300);
    setTimeout(attachPaymentHandlers, 1000);
    setTimeout(attachPaymentHandlers, 2500);
  });

  document.addEventListener("click", (event) => {
    const target = event.target.closest("button, .primary-btn, [role='button']");
    if (looksLikePaymentButton(target)) {
      startCheckout(event);
    }
  }, true);
})();
