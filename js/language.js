const LANGUAGE_STORAGE_KEY = "dental-clinic-language";
const AVAILABLE_LANGUAGES = ["ar", "en"];

function readSavedLanguage() {
  try {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return AVAILABLE_LANGUAGES.includes(savedLanguage) ? savedLanguage : "ar";
  } catch {
    return "ar";
  }
}

/** Creates the text helpers and language-switching behavior for the page. */
export function createLanguageController(config, translations) {
  let currentLanguage = readSavedLanguage();

  function text(key) {
    return translations[currentLanguage][key] || key;
  }

  function localized(value) {
    if (!value || typeof value !== "object") return value || "";
    return value[currentLanguage] || value.en || value.ar || "";
  }

  function applyLanguage(language) {
    currentLanguage = AVAILABLE_LANGUAGES.includes(language) ? language : "ar";

    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
    } catch {
      // Language switching still works when browser storage is unavailable.
    }

    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = currentLanguage === "ar" ? "rtl" : "ltr";
    document.title = text("documentTitle");

    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = text("description");

    const socialTitle = document.querySelector('meta[property="og:title"]');
    if (socialTitle) socialTitle.content = text("documentTitle");

    const socialDescription = document.querySelector('meta[property="og:description"]');
    if (socialDescription) socialDescription.content = text("description");

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const translatedText = text(element.dataset.i18n);
      if (translatedText) element.textContent = translatedText;
    });

    document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
      element.setAttribute("aria-label", text(element.dataset.i18nAria));
    });

    document.querySelectorAll("[data-clinic-name]").forEach((element) => {
      element.textContent = localized(config.clinicName);
    });

    const dentistValues = {
      "dentist-bio": localized(config.dentist.bio),
      "dentist-name": localized(config.dentist.name),
      "dentist-title": localized(config.dentist.title)
    };
    document.querySelectorAll("[data-config]").forEach((element) => {
      element.textContent = dentistValues[element.dataset.config] || "";
    });

    const languageToggle = document.querySelector("#language-toggle");
    if (languageToggle) {
      languageToggle.textContent = text("language");
      languageToggle.setAttribute("aria-label", text("languageLabel"));
    }

    const navigation = document.querySelector(".primary-navigation");
    if (navigation) {
      navigation.setAttribute(
        "aria-label",
        currentLanguage === "ar" ? "التنقل الرئيسي" : "Primary navigation"
      );
    }

    const menuToggle = document.querySelector(".menu-toggle");
    if (menuToggle) {
      const menuLabel = menuToggle.getAttribute("aria-expanded") === "true" ? "menuClose" : "menuOpen";
      menuToggle.setAttribute("aria-label", text(menuLabel));
    }

    const skipLink = document.querySelector(".skip-link");
    if (skipLink) {
      skipLink.textContent = currentLanguage === "ar" ? "تجاوز إلى المحتوى" : "Skip to content";
    }

    const map = document.querySelector("#clinic-map");
    if (map) map.title = text("mapTitle");

    const imageDialog = document.querySelector("#image-dialog");
    if (imageDialog) imageDialog.setAttribute("aria-label", text("galleryTitle"));

    const dentistImage = document.querySelector("#dentist-image");
    if (dentistImage) {
      dentistImage.alt = currentLanguage === "ar"
        ? "صورة توضيحية لطبيب أسنان — ليست صورة الطبيب الفعلي"
        : "Illustrative dentist portrait—not the actual clinic dentist";
      dentistImage.src = config.dentist.image;
    }

    const heroImage = document.querySelector("[data-clinic-image='hero']");
    if (heroImage) {
      heroImage.alt = currentLanguage === "ar"
        ? "مساحة عيادة أسنان مشرقة وحديثة — صورة توضيحية"
        : "Bright, modern dental clinic interior—illustrative stock photo";
      heroImage.src = config.images.hero;
    }

    document.querySelectorAll(".gallery-item").forEach((item) => {
      const caption = item.querySelector("span")?.textContent || "";
      const image = item.querySelector("img");
      const galleryImage = config.images.gallery[Number(item.dataset.galleryIndex)];

      if (galleryImage) {
        item.dataset.full = galleryImage;
        if (image) image.src = galleryImage;
      }

      if (image) image.alt = `${caption} — ${text("illustrative")}`;
      item.setAttribute("aria-label", `${text("illustrative")}: ${caption}`);
    });

    document.querySelectorAll(".site-header .logo, .footer-brand .logo").forEach((logo) => {
      logo.setAttribute("aria-label", `${localized(config.clinicName)} — ${text("home")}`);
    });

    const phoneInput = document.querySelector("#booking-phone");
    if (phoneInput) phoneInput.placeholder = `${config.booking.phoneCountryCode} …`;

    return currentLanguage;
  }

  return {
    applyLanguage,
    getCurrentLanguage: () => currentLanguage,
    localized,
    text
  };
}
