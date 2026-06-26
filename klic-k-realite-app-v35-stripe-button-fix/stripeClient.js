(() => {
  let checkoutInProgress = false;

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

  function findCheckoutButton(target) {
    if (!target) return null;
    if (target.id === "stripeCheckoutButton") return target;
    if (typeof target.closest === "function") {
      return target.closest("#stripeCheckoutButton");
    }
    return null;
  }

  async function startCheckout(button) {
    if (checkoutInProgress) return;
    checkoutInProgress = true;

    if (!button) button = document.getElementById("stripeCheckoutButton");

    const telegramUser = getTelegramUser();
    const telegramId = getTelegramId();

    const oldText = button?.textContent || "Zaplatit kartou";
    if (button) {
      button.disabled = true;
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

      let data = {};
      try {
        data = await response.json();
      } catch (e) {
        data = {};
      }

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Nepodařilo se vytvořit platbu.");
      }

      window.location.assign(data.url);
    } catch (error) {
      console.error("Stripe checkout error", error);
      setStatus("Platbu se nepodařilo otevřít. Zkuste to prosím znovu.", "error");
      checkoutInProgress = false;

      if (button) {
        button.disabled = false;
        button.textContent = oldText;
      }
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

  // Direct listener when the button exists.
  function attachDirectListener() {
    const button = document.getElementById("stripeCheckoutButton");
    if (!button || button.dataset.stripeReady === "1") return;

    button.dataset.stripeReady = "1";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      startCheckout(button);
    });
  }

  // Delegated listener survives screen redraws and late-rendered buttons.
  document.addEventListener("click", (event) => {
    const button = findCheckoutButton(event.target);
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();
    startCheckout(button);
  }, true);

  document.addEventListener("DOMContentLoaded", () => {
    attachDirectListener();
    checkPaymentReturn();
    setTimeout(attachDirectListener, 500);
    setTimeout(attachDirectListener, 1500);
    setTimeout(attachDirectListener, 3000);
  });
})();
