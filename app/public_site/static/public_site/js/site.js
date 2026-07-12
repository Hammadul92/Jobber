(() => {
  const menu = document.getElementById("mobile-menu");
  const openButton = document.getElementById("mobile-menu-button");
  const closeButton = document.getElementById("mobile-menu-close");
  const header = document.getElementById("site-header");
  const industriesWrapper = document.getElementById("industries-menu-wrapper");
  const industriesButton = document.getElementById("industries-menu-button");
  const industriesMenu = document.getElementById("industries-menu");
  const industriesChevron = document.getElementById("industries-menu-chevron");
  const mobileIndustriesButton = document.getElementById(
    "mobile-industries-button",
  );
  const mobileIndustriesMenu = document.getElementById(
    "mobile-industries-menu",
  );
  const mobileIndustriesChevron = document.getElementById(
    "mobile-industries-chevron",
  );

  const updateHeader = () => {
    if (!header) return;
    const atTop = window.scrollY === 0;
    header.classList.toggle("top-0", !atTop);
    header.classList.toggle("top-9", atTop);
    header.classList.toggle("pb-2", !atTop);
    header.classList.toggle("pb-0", atTop);
    header.classList.toggle("md:pb-4", !atTop);
    header.classList.toggle("md:pb-0", atTop);
    header.classList.toggle("shadow", !atTop);
    header.classList.toggle("shadow-none", atTop);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const setMenuOpen = (open) => {
    if (!menu || !openButton) return;
    menu.classList.toggle("hidden", !open);
    menu.setAttribute("aria-hidden", String(!open));
    openButton.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("overflow-hidden", open);
  };

  const setIndustriesOpen = (open) => {
    if (!industriesButton || !industriesMenu) return;
    industriesMenu.classList.toggle("hidden", !open);
    industriesMenu.setAttribute("aria-hidden", String(!open));
    industriesButton.setAttribute("aria-expanded", String(open));
    industriesChevron?.classList.toggle("rotate-180", open);
  };

  industriesButton?.addEventListener("click", () => {
    setIndustriesOpen(
      industriesButton.getAttribute("aria-expanded") !== "true",
    );
  });

  document.addEventListener("click", (event) => {
    if (industriesWrapper && !industriesWrapper.contains(event.target)) {
      setIndustriesOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setIndustriesOpen(false);
      setMenuOpen(false);
      setAccountMenuOpen(false);
    }
  });

  const setMobileIndustriesOpen = (open) => {
    if (!mobileIndustriesButton || !mobileIndustriesMenu) return;
    mobileIndustriesMenu.classList.toggle("hidden", !open);
    mobileIndustriesMenu.setAttribute("aria-hidden", String(!open));
    mobileIndustriesButton.setAttribute("aria-expanded", String(open));
    mobileIndustriesChevron?.classList.toggle("rotate-180", open);
  };

  mobileIndustriesButton?.addEventListener("click", () => {
    setMobileIndustriesOpen(
      mobileIndustriesButton.getAttribute("aria-expanded") !== "true",
    );
  });

  openButton?.addEventListener("click", () => setMenuOpen(true));
  closeButton?.addEventListener("click", () => setMenuOpen(false));
  menu?.addEventListener("click", (event) => {
    if (event.target === menu) setMenuOpen(false);
  });

  const readPublicSession = () => {
    const prefix = "contractorz_public_session=";
    const value = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(prefix));
    if (!value) return null;

    try {
      const session = JSON.parse(
        decodeURIComponent(value.slice(prefix.length)),
      );
      if (!session || typeof session.name !== "string") return null;
      return {
        name: session.name.slice(0, 80) || "Account",
        email:
          typeof session.email === "string" ? session.email.slice(0, 120) : "",
        role: typeof session.role === "string" ? session.role : "",
      };
    } catch {
      return null;
    }
  };

  const accountWrapper = document.getElementById("desktop-account");
  const accountToggle = accountWrapper?.querySelector("[data-account-toggle]");
  const accountMenu = accountWrapper?.querySelector("[data-account-menu]");
  const accountOverlay = document.querySelector("[data-account-overlay]");

  const setAccountMenuOpen = (open) => {
    if (!accountToggle || !accountMenu) return;
    accountMenu.classList.toggle("hidden", !open);
    accountMenu.setAttribute("aria-hidden", String(!open));
    accountToggle.setAttribute("aria-expanded", String(open));
    accountOverlay?.classList.toggle("hidden", !open);
    accountWrapper
      .querySelector("[data-account-chevron]")
      ?.classList.toggle("rotate-180", open);
  };

  const renderPublicSession = (publicSession) => {
    const authenticated = Boolean(publicSession?.name);
    document.querySelectorAll("[data-account-login]").forEach((link) => {
      link.classList.toggle("hidden", authenticated);
      link.classList.toggle("md:hidden", authenticated);
      link.style.display = authenticated ? "none" : "";
    });
    accountToggle?.classList.toggle("hidden", !authenticated);
    accountToggle?.classList.toggle("flex", authenticated);
    if (accountToggle)
      accountToggle.style.display = authenticated ? "flex" : "none";
    document
      .querySelectorAll("[data-mobile-account]")
      .forEach((node) => node.classList.toggle("hidden", !authenticated));
    if (!authenticated) {
      setAccountMenuOpen(false);
      return;
    }
    document.querySelectorAll("[data-account-name]").forEach((node) => {
      node.textContent = publicSession.name;
    });
    document.querySelectorAll("[data-account-email]").forEach((node) => {
      node.textContent = publicSession.email;
    });
    document.querySelectorAll("[data-account-initial]").forEach((node) => {
      node.textContent = publicSession.name.charAt(0).toUpperCase();
    });
    const businessLink = accountWrapper?.querySelector("[data-business-link]");
    const showBusiness = ["USER", "MANAGER"].includes(publicSession.role);
    businessLink?.classList.toggle("hidden", !showBusiness);
    businessLink?.classList.toggle("block", showBusiness);
  };

  renderPublicSession(readPublicSession());

  window.addEventListener("message", (event) => {
    const frontendUrl = document.body.dataset.frontendUrl;
    if (!frontendUrl || event.origin !== new URL(frontendUrl).origin) return;
    if (event.data?.type !== "contractorz:public-session") return;
    renderPublicSession(event.data.user);
  });

  accountToggle?.addEventListener("click", () => {
    setAccountMenuOpen(accountToggle.getAttribute("aria-expanded") !== "true");
  });
  accountOverlay?.addEventListener("click", () => setAccountMenuOpen(false));

  document.addEventListener("click", (event) => {
    if (accountWrapper && !accountWrapper.contains(event.target))
      setAccountMenuOpen(false);
  });

  document.querySelectorAll("[data-accordion] article").forEach((item) => {
    const button = item.querySelector("button");
    const panel = item.querySelector("button + div");
    button?.addEventListener("click", () => {
      const opening = button.getAttribute("aria-expanded") !== "true";
      item.parentElement.querySelectorAll("article").forEach((other) => {
        const otherButton = other.querySelector("button");
        const otherPanel = other.querySelector("button + div");
        const otherChevron = otherButton?.querySelector("svg");
        otherButton?.setAttribute("aria-expanded", "false");
        otherButton?.querySelector("h3")?.classList.remove("text-accent");
        otherButton?.querySelector("h3")?.classList.add("text-white");
        otherChevron?.classList.remove("rotate-180");
        otherChevron?.classList.add("rotate-0");
        if (otherPanel) {
          otherPanel.style.maxHeight = "0px";
          otherPanel.style.opacity = "0";
        }
      });
      if (opening) {
        button.setAttribute("aria-expanded", "true");
        button.querySelector("h3")?.classList.add("text-accent");
        button.querySelector("h3")?.classList.remove("text-white");
        button.querySelector("svg")?.classList.add("rotate-180");
        button.querySelector("svg")?.classList.remove("rotate-0");
        if (panel) {
          panel.style.maxHeight = "500px";
          panel.style.opacity = "1";
        }
      }
    });
  });

  const contactForm = document.getElementById("contact-form");
  contactForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = document.getElementById("contact-status");
    const submit = contactForm.querySelector("button[type='submit']");
    submit.disabled = true;
    status.textContent = "Sending...";
    try {
      const response = await fetch("/api/user/contact/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...Object.fromEntries(new FormData(contactForm)),
          privacy_agreed: contactForm.elements.privacy_agreed?.checked ?? false,
        }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.detail || "Unable to send message.");
      contactForm.reset();
      status.className = "mt-4 text-sm text-green-700";
      status.textContent = payload.detail;
    } catch (error) {
      status.className = "mt-4 text-sm text-red-700";
      status.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  });
})();
