import clinicConfig from "./config.js";
import translations from "./translations.js";
import { createLanguageController } from "./language.js";
import { initializeNavigation } from "./navigation.js";
import { initializeGallery, initializeImageFallbacks } from "./gallery.js";
import { clearFormFeedback, initializeForms } from "./forms.js";

const language = createLanguageController(clinicConfig, translations);
const text = language.text;
const localized = language.localized;

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function observeReveals() {
  const items = document.querySelectorAll("[data-reveal]:not(.is-visible)");
  const shouldShowImmediately = !("IntersectionObserver" in window)
    || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (shouldShowImmediately) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries, activeObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add("is-visible");
      activeObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  items.forEach((item) => observer.observe(item));
}

function renderServices() {
  const servicesGrid = document.querySelector("#services-grid");
  if (!servicesGrid) return;

  servicesGrid.replaceChildren();

  clinicConfig.booking.services.forEach((serviceId) => {
    const service = clinicConfig.services[serviceId];
    const serviceKey = `service${capitalize(serviceId)}`;
    const card = document.createElement("article");
    card.className = "service-card";
    card.dataset.reveal = "";

    const photo = document.createElement("div");
    photo.className = "service-photo";

    const image = document.createElement("img");
    image.src = service.image;
    image.alt = `${text(`${serviceKey}Title`)} — ${text("illustrative")}`;
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
    title.textContent = text(`${serviceKey}Title`);

    const description = document.createElement("p");
    description.textContent = text(`${serviceKey}Text`);

    content.append(icon, title, description);
    card.append(photo, content);
    servicesGrid.append(card);
  });

  observeReveals();
}

function renderSelectOptions() {
  const currentTranslations = translations[language.getCurrentLanguage()];
  const serviceSelect = document.querySelector("#booking-service");
  const timeSelect = document.querySelector("#booking-time");

  if (serviceSelect) {
    const selectedService = serviceSelect.value;
    serviceSelect.replaceChildren(new Option(text("chooseService"), ""));

    clinicConfig.booking.services.forEach((serviceId) => {
      serviceSelect.add(new Option(currentTranslations.serviceNames[serviceId], serviceId));
    });

    serviceSelect.value = selectedService;
  }

  if (timeSelect) {
    const selectedTime = timeSelect.value;
    timeSelect.replaceChildren(new Option(text("chooseTime"), ""));

    clinicConfig.booking.availableTimes.forEach((time) => {
      const label = currentTranslations.timeLabels[time] || time;
      timeSelect.add(new Option(label, time));
    });

    timeSelect.value = selectedTime;
  }
}

function renderContactDetails() {
  const contactKeys = ["phone", "whatsapp", "email", "address", "hours"];
  const emptyLabels = {
    phone: language.getCurrentLanguage() === "ar" ? "أضف رقم الهاتف" : "Add clinic phone",
    whatsapp: language.getCurrentLanguage() === "ar" ? "أضف رقم واتساب" : "Add WhatsApp number",
    email: language.getCurrentLanguage() === "ar" ? "أضف البريد الإلكتروني" : "Add clinic email"
  };

  contactKeys.forEach((key) => {
    const valueElement = document.querySelector(`[data-contact-value="${key}"]`);
    if (!valueElement) return;

    const configuredValue = key === "address" || key === "hours"
      ? localized(clinicConfig.contact[key])
      : clinicConfig.contact[key];
    valueElement.textContent = configuredValue || emptyLabels[key] || "";

    const contactLink = document.querySelector(`[data-contact-link="${key}"]`);
    if (!contactLink) return;

    const hasValue = Boolean(configuredValue);
    const phoneDigits = String(configuredValue || "").replace(/[^\d+]/g, "");

    if (key === "phone" && hasValue) {
      contactLink.href = `tel:${phoneDigits}`;
    } else if (key === "whatsapp" && hasValue) {
      contactLink.href = `https://wa.me/${phoneDigits.replace(/\D/g, "")}`;
      contactLink.target = "_blank";
      contactLink.rel = "noopener noreferrer";
    } else if (key === "email" && hasValue) {
      contactLink.href = `mailto:${configuredValue}`;
    } else {
      contactLink.href = "#booking";
    }

    contactLink.setAttribute("aria-disabled", String(!hasValue));
    contactLink.onclick = hasValue ? null : (event) => event.preventDefault();
  });

  const map = document.querySelector("#clinic-map");
  if (map && map.src !== clinicConfig.mapEmbedUrl) {
    map.src = clinicConfig.mapEmbedUrl;
  }
}

function renderSocialLinks() {
  document.querySelectorAll("[data-social]").forEach((link) => {
    const url = clinicConfig.social[link.dataset.social];
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

function applyPageLanguage(selectedLanguage) {
  language.applyLanguage(selectedLanguage);
  renderServices();
  renderContactDetails();
  renderSocialLinks();
  renderSelectOptions();
  clearFormFeedback();
}

function initializePage() {
  const languageToggle = document.querySelector("#language-toggle");
  languageToggle?.addEventListener("click", () => {
    const nextLanguage = language.getCurrentLanguage() === "ar" ? "en" : "ar";
    applyPageLanguage(nextLanguage);
  });

  const currentYear = document.querySelector("#current-year");
  if (currentYear) currentYear.textContent = new Date().getFullYear();

  initializeNavigation(text);
  initializeGallery();
  initializeImageFallbacks();
  initializeForms(clinicConfig, text);
  applyPageLanguage(language.getCurrentLanguage());
}

initializePage();
