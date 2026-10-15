
(() => {
  "use strict";

  const config = window.CLINIC_CONFIG;
  const translations = window.TRANSLATIONS;
  const languageStorageKey = "dental-clinic-language";
  const allowedLanguages = ["ar", "en"];
  let currentLanguage = allowedLanguages.includes(localStorage.getItem(languageStorageKey))
    ? localStorage.getItem(languageStorageKey)
    : "ar";

  const text = (key) => translations[currentLanguage][key] || key;
  const localized = (value) => value && typeof value === "object"
    ? (value[currentLanguage] || value.en || value.ar || "")
    : (value || "");

  // Language and localized content.
  function applyLanguage(language) {
    currentLanguage = allowedLanguages.includes(language) ? language : "ar";
    localStorage.setItem(languageStorageKey, currentLanguage);
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = currentLanguage === "ar" ? "rtl" : "ltr";
    document.title = text("documentTitle");
    document.querySelector('meta[name="description"]').content = text("description");

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const value = text(element.dataset.i18n);
      if (value) element.textContent = value;
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
      element.setAttribute("aria-label", text(element.dataset.i18nAria));
    });
    document.querySelectorAll("[data-clinic-name]").forEach((element) => {
      element.textContent = localized(config.clinicName);
    });
    const configValues = {
      "dentist-bio": localized(config.dentist.bio),
      "dentist-name": localized(config.dentist.name),
      "dentist-title": localized(config.dentist.title)
    };
    document.querySelectorAll("[data-config]").forEach((element) => {
      element.textContent = configValues[element.dataset.config] || "";
    });

    const languageToggle = document.querySelector("#language-toggle");
    languageToggle.textContent = text("language");
    languageToggle.setAttribute("aria-label", text("languageLabel"));
    const nav = document.querySelector(".primary-navigation");
    nav.setAttribute("aria-label", currentLanguage === "ar" ? "التنقل الرئيسي" : "Primary navigation");
    const menuToggle = document.querySelector(".menu-toggle");
    menuToggle.setAttribute("aria-label", text(menuToggle.getAttribute("aria-expanded") === "true" ? "menuClose" : "menuOpen"));
    document.querySelector(".skip-link").textContent = currentLanguage === "ar" ? "تجاوز إلى المحتوى" : "Skip to content";
    document.querySelector("#clinic-map").title = text("mapTitle");
    document.querySelector("#image-dialog").setAttribute("aria-label", text("galleryTitle"));
    document.querySelector("#dentist-image").alt = currentLanguage === "ar"
      ? "صورة توضيحية لطبيب أسنان — ليست صورة الطبيب الفعلي"
      : "Illustrative dentist portrait—not the actual clinic dentist";
    document.querySelector("[data-clinic-image='hero']").alt = currentLanguage === "ar"
      ? "مساحة عيادة أسنان مشرقة وحديثة — صورة توضيحية"
      : "Bright, modern dental clinic interior—illustrative stock photo";
    document.querySelector("[data-clinic-image='hero']").src = config.images.hero;
    document.querySelector("#dentist-image").src = config.dentist.image;
    document.querySelectorAll(".gallery-item").forEach((item) => {
      const caption = item.querySelector("span").textContent;
      const galleryImage = config.images.gallery[Number(item.dataset.galleryIndex)];
      if (galleryImage) {
        item.dataset.full = galleryImage;
        item.querySelector("img").src = galleryImage;
      }
      item.querySelector("img").alt = `${caption} — ${text("illustrative")}`;
      item.setAttribute("aria-label", `${text("illustrative")}: ${caption}`);
    });
    document.querySelectorAll(".site-header .logo, .footer-brand .logo").forEach((logo) => {
      logo.setAttribute("aria-label", `${localized(config.clinicName)} — ${text("home")}`);
    });
    const phoneInput = document.querySelector("#booking-phone");
    phoneInput.placeholder = `${config.booking.phoneCountryCode} …`;
    renderServices();
    renderContactDetails();
    renderSocialLinks();
    renderSelectOptions();
    updateFormStatusLanguage();
  }

  function renderServices() {
    const grid = document.querySelector("#services-grid");
    grid.replaceChildren();
    config.services.forEach((service) => {
      const card = document.createElement("article");
      card.className = "service-card";
      card.dataset.reveal = "";
      const photo = document.createElement("div");
      photo.className = "service-photo";
      const image = document.createElement("img");
      image.src = service.image;
      image.alt = `${text(`service${capitalize(service.id)}Title`)} — ${text("illustrative")}`;
      image.loading = "lazy";
      image.addEventListener("error", () => photo.classList.add("image-unavailable"), { once: true });
      photo.append(image);
      const content = document.createElement("div");
      content.className = "service-card-body";
      const icon = document.createElement("span");
      icon.className = "service-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = service.icon;
      const title = document.createElement("h3");
      title.textContent = text(`service${capitalize(service.id)}Title`);
      const description = document.createElement("p");
      description.textContent = text(`service${capitalize(service.id)}Text`);
      content.append(icon, title, description);
      card.append(photo, content);
      grid.append(card);
    });
    observeReveals();
  }

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  // Dynamic form options and clinic details.
  function renderSelectOptions() {
    const serviceSelect = document.querySelector("#booking-service");
    const selectedService = serviceSelect.value;
    serviceSelect.replaceChildren(new Option(text("chooseService"), ""));
    config.services.forEach(({ id }) => {
      serviceSelect.add(new Option(translations[currentLanguage].serviceNames[id], id));
    });
    serviceSelect.value = selectedService;

    const timeSelect = document.querySelector("#booking-time");
    const selectedTime = timeSelect.value;
    timeSelect.replaceChildren(new Option(text("chooseTime"), ""));
    config.booking.availableTimes.forEach((time) => {
      timeSelect.add(new Option(translations[currentLanguage].timeLabels[time] || time, time));
    });
    timeSelect.value = selectedTime;
  }

  function renderContactDetails() {
    const entries = ["phone", "whatsapp", "email", "address", "hours"];
    const emptyLabels = {
      phone: currentLanguage === "ar" ? "أضف رقم الهاتف" : "Add clinic phone",
      whatsapp: currentLanguage === "ar" ? "أضف رقم واتساب" : "Add WhatsApp number",
      email: currentLanguage === "ar" ? "أضف البريد الإلكتروني" : "Add clinic email"
    };
    entries.forEach((key) => {
      const value = document.querySelector(`[data-contact-value="${key}"]`);
      const raw = key === "address" || key === "hours" ? localized(config.contact[key]) : config.contact[key];
      value.textContent = raw || emptyLabels[key] || "";
      const link = document.querySelector(`[data-contact-link="${key}"]`);
      if (!link) return;
      const digits = String(raw || "").replace(/[^\d+]/g, "");
      const hasValue = Boolean(raw);
      link.href = key === "phone" && hasValue ? `tel:${digits}`
        : key === "whatsapp" && hasValue ? `https://wa.me/${digits.replace(/\D/g, "")}`
          : key === "email" && hasValue ? `mailto:${raw}` : "#booking";
      if (key === "whatsapp" && hasValue) link.target = "_blank";
      link.setAttribute("aria-disabled", String(!hasValue));
      link.onclick = hasValue ? null : (event) => event.preventDefault();
    });
    const map = document.querySelector("#clinic-map");
    if (map.src !== config.mapEmbedUrl) map.src = config.mapEmbedUrl;
  }

  function renderSocialLinks() {
    document.querySelectorAll("[data-social]").forEach((link) => {
      const url = config.social[link.dataset.social];
      if (!url) {
        link.hidden = true;
        return;
      }
      link.hidden = false;
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    });
  }

  function setDateConstraints() {
    const dateInput = document.querySelector("#booking-date");
    const now = new Date();
    const localToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    dateInput.min = `${localToday.getFullYear()}-${String(localToday.getMonth() + 1).padStart(2, "0")}-${String(localToday.getDate()).padStart(2, "0")}`;
  }

  // Form validation and submission.
  function dateIsAvailable(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day || date < today) return false;
    return config.booking.openingDays.includes(date.getDay());
  }

  function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validatePhone(value) {
    const normalizedValue = value.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (digit) => {
      const codePoint = digit.charCodeAt(0);
      const zeroCodePoint = codePoint >= 0x06F0 ? 0x06F0 : 0x0660;
      return String(codePoint - zeroCodePoint);
    });
    const digits = normalizedValue.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15;
  }

  function clearErrors(form) {
    form.querySelectorAll(".field-error").forEach((error) => { error.textContent = ""; });
    form.querySelectorAll('[aria-invalid="true"]').forEach((field) => field.removeAttribute("aria-invalid"));
    form.querySelector(".form-status").textContent = "";
    form.querySelector(".form-status").classList.remove("is-error");
  }

  function showFieldError(field, message) {
    field.setAttribute("aria-invalid", "true");
    const error = document.getElementById(`${field.id}-error`);
    if (error) error.textContent = message;
  }

  function validateRequiredFields(form) {
    let valid = true;
    form.querySelectorAll("[required]").forEach((field) => {
      if (!field.value.trim()) {
        showFieldError(field, text("required"));
        valid = false;
      }
    });
    return valid;
  }

  function validateBooking(form) {
    let valid = validateRequiredFields(form);
    const phone = document.querySelector("#booking-phone");
    if (phone.value.trim() && !validatePhone(phone.value)) {
      showFieldError(phone, text("invalidPhone"));
      valid = false;
    }
    const email = document.querySelector("#booking-email");
    if (email.value.trim() && !validateEmail(email.value.trim())) {
      showFieldError(email, text("invalidEmail"));
      valid = false;
    }
    const date = document.querySelector("#booking-date");
    if (date.value && !dateIsAvailable(date.value)) {
      showFieldError(date, date.value >= date.min ? text("closedDay") : text("invalidDate"));
      valid = false;
    }
    const time = document.querySelector("#booking-time");
    if (time.value && !config.booking.availableTimes.includes(time.value)) {
      showFieldError(time, text("invalidTime"));
      valid = false;
    }
    return valid;
  }

  function validateContact(form) {
    let valid = validateRequiredFields(form);
    const method = document.querySelector("#contact-method");
    const value = method.value.trim();
    if (value && !validateEmail(value) && !validatePhone(value)) {
      showFieldError(method, text("invalidContact"));
      valid = false;
    }
    return valid;
  }

  function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const type = form.dataset.demoForm;
    const status = form.querySelector(".form-status");
    clearErrors(form);
    const valid = type === "booking" ? validateBooking(form) : validateContact(form);
    if (!valid) {
      status.textContent = text("errorSummary");
      status.classList.add("is-error");
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    status.textContent = text(type === "booking" ? "bookingSuccess" : "contactSuccess");
  }

  function updateFormStatusLanguage() {
    document.querySelectorAll(".form-status").forEach((status) => {
      status.textContent = "";
      status.classList.remove("is-error");
    });
    document.querySelectorAll(".field-error").forEach((error) => {
      error.textContent = "";
    });
    document.querySelectorAll('[aria-invalid="true"]').forEach((field) => field.removeAttribute("aria-invalid"));
  }

  function clearFieldError(field) {
    if (!field.hasAttribute("aria-invalid")) return;

    field.removeAttribute("aria-invalid");
    const error = document.getElementById(`${field.id}-error`);
    if (error) error.textContent = "";
  }

  // Navigation, image viewer, and scroll effects.
  function setupNavigation() {
    const toggle = document.querySelector(".menu-toggle");
    const navigation = document.querySelector(".primary-navigation");
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", text(open ? "menuClose" : "menuOpen"));
      navigation.classList.toggle("is-open", open);
    };
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    navigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  function setupLightbox() {
    const dialog = document.querySelector("#image-dialog");
    const image = dialog.querySelector("img");
    document.querySelectorAll(".gallery-item").forEach((item) => {
      item.addEventListener("click", () => {
        image.src = item.dataset.full;
        image.alt = item.querySelector("img").alt;
        dialog.showModal();
      });
    });
    dialog.querySelector(".lightbox-close").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener("close", () => { image.removeAttribute("src"); });
  }

  function observeReveals() {
    const items = document.querySelectorAll("[data-reveal]:not(.is-visible)");
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries, activeObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          activeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach((item) => observer.observe(item));
  }

  // Page initialization and event listeners.
  document.querySelector("#language-toggle").addEventListener("click", () => {
    applyLanguage(currentLanguage === "ar" ? "en" : "ar");
  });
  document.querySelectorAll("[data-demo-form]").forEach((form) => form.addEventListener("submit", handleFormSubmit));
  document.querySelectorAll("#booking-form input, #booking-form select, #contact-form input, #contact-form textarea").forEach((field) => {
    field.addEventListener("input", () => clearFieldError(field));
    field.addEventListener("change", () => clearFieldError(field));
  });
  document.querySelectorAll(".gallery-item img, #dentist-image, [data-clinic-image='hero']").forEach((image) => {
    image.addEventListener("error", () => image.classList.add("image-failed"), { once: true });
  });
  document.querySelector("#current-year").textContent = new Date().getFullYear();
  setDateConstraints();
  setupNavigation();
  setupLightbox();
  applyLanguage(currentLanguage);
  observeReveals();
})();
