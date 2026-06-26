(() => {
  let checkoutInProgress = false;

  function getTelegramUser() {
    return window.Telegram?.WebApp?.initDataUnsafe?.user || null;
  }

  function getTelegramId() {
    const user = getTelegramUser();
    return user?.id ? String(user.id) : "browser";
  }

  function ensureStatusBox() {
    let el = document.getElementById("stripePaymentStatus");
    if (el) return el;

    const box = document.getElementById("stripePaymentBox");
    if (!box) return null;

    el = document.createElement("p");
    el.id = "stripePaymentStatus";
    el.className = "stripe-status";
    box.appendChild(el);
    return el;
  }

  function setStatus(message, type) {
    const el = ensureStatusBox();
    if (!el) return;

    const time = new Date().toLocaleTimeString("cs-CZ", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });

    el.textContent = message ? `${message} (${time})` : "";
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
    if (checkoutInProgress) {
      setStatus("Platba už se připravuje, počkejte prosím.", "");
      return;
    }

    checkoutInProgress = true;

    if (!button) button = document.getElementById("stripeCheckoutButton");

    setStatus("Klik funguje. Připravuji Stripe platbu...", "success");

    const telegramUser = getTelegramUser();
    const telegramId = getTelegramId();

    const oldText = button?.textContent || "Zaplatit kartou";
    if (button) {
      button.disabled = true;
      button.textContent = "Připravuji platbu...";
    }

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

      const rawText = await response.text();
      let data = {};

      try {
        data = JSON.parse(rawText);
      } catch (e) {
        data = {};
      }

      if (!response.ok) {
        throw new Error(data.error || rawText || `HTTP ${response.status}`);
      }

      if (!data.url) {
        throw new Error("Stripe nevrátil URL platby.");
      }

      setStatus("Stripe odkaz vytvořen. Přesměrovávám...", "success");
      window.location.assign(data.url);
    } catch (error) {
      console.error("Stripe checkout error", error);
      setStatus(`Chyba: ${error.message}`, "error");

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

  function attachDirectListener() {
    const button = document.getElementById("stripeCheckoutButton");
    if (!button) return;

    button.style.pointerEvents = "auto";
    button.style.position = "relative";
    button.style.zIndex = "9999";

    if (button.dataset.stripeReady === "1") return;

    button.dataset.stripeReady = "1";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      startCheckout(button);
    });
  }

  document.addEventListener("click", (event) => {
    const button = findCheckoutButton(event.target);
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();
    startCheckout(button);
  }, true);

  document.addEventListener("touchstart", (event) => {
    const button = findCheckoutButton(event.target);
    if (!button) return;

    setStatus("Dotyk tlačítka zachycen.", "success");
  }, true);

  document.addEventListener("DOMContentLoaded", () => {
    attachDirectListener();
    checkPaymentReturn();

    const button = document.getElementById("stripeCheckoutButton");
    if (button) {
      setStatus("Platební tlačítko je připravené.", "success");
    }

    setTimeout(attachDirectListener, 500);
    setTimeout(attachDirectListener, 1500);
    setTimeout(attachDirectListener, 3000);
  });

  setTimeout(() => {
    attachDirectListener();
    const button = document.getElementById("stripeCheckoutButton");
    if (button && !document.getElementById("stripePaymentStatus")?.textContent) {
      setStatus("Platební tlačítko je připravené.", "success");
    }
  }, 4000);
})();
