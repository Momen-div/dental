# Premium Dental Clinic Website

A responsive, single-page clinic website built with semantic HTML, CSS, and vanilla JavaScript. Arabic is the first-visit default; the complete interface is also available in English. The static pages do not require a Node.js server.

## Run locally

Use any static HTTP server from this directory. For example, with Python installed:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`. A local HTTP server is recommended over opening the HTML file directly so fonts, map content, and browser storage work consistently. There is no frontend build step or package installation.

## Customize for a real clinic

Edit [js/config.js](js/config.js) before publishing:

- `clinicName`: official Arabic and English clinic names; the current labels are placeholders.
- `images.hero`, `images.gallery`, `services[].image`, and `dentist.image`: replace all illustrative stock photos with appropriately licensed assets or clinic photography. Images are sourced from Unsplash and must be checked against its current license/terms. The interface labels the dentist, gallery, and hero imagery as illustrative; gallery photos are not patient cases.
- `services`: select only services actually provided. Each service `id` must have matching Arabic and English title/description entries in [js/translations.js](js/translations.js). **The clinic must verify every listed service and description before publication.**
- `dentist.name`, `dentist.title`, and `dentist.bio`: use only approved name, qualifications, specialty, and biography. Current content is deliberately placeholder text.
- `contact.phone`, `contact.whatsapp`, `contact.email`, `contact.address`, and `contact.hours`: add verified public clinic contact information. Phone and WhatsApp values should use international country-code format.
- `mapEmbedUrl`: replace the demonstration map of Amman with a Google Maps embed URL for the real clinic. The current map is fictional demonstration content and is not associated with the named dentist placeholder.
- `booking.phoneCountryCode`: defaults to Jordan's `+962` as an editable suggestion.
- `booking.openingDays`: configure JavaScript weekday numbers (`0` = Sunday through `6` = Saturday) to match clinic appointment days. `availableTimes` controls selectable preferred times. Verify both with the clinic.
- `social`: add verified social profile URLs; empty values are hidden.
- Brand colors and typography can be adjusted in the CSS custom properties at the top of [css/style.css](css/style.css).
- Keep Arabic/English interface copy in [js/translations.js](js/translations.js), including service names and descriptions.

The appointment and contact forms are **frontend-only previews**. They validate input locally and explain that nothing is sent, received, or saved. The project contains no form submission endpoint or persistence layer.

## Project structure and deployment

The site uses plain HTML, CSS, and native JavaScript modules. No build step, package installation, or server-side code is required. Serve the project root with a static HTTP server or deploy the complete folder to a static host. A local HTTP server is recommended because browsers restrict native JavaScript modules opened directly from `file://` URLs.

```text
index.html
README.md
assets/icons/favicon.svg
css/
    style.css       # Theme, global styles, and shared layout
    components.css  # Page sections and reusable components
    responsive.css  # Tablet, mobile, and reduced-motion rules
js/
    main.js         # Page initialization and dynamic content
    config.js       # Clinic customization
    translations.js # Arabic and English copy
    language.js     # Language switching and localized content
    navigation.js   # Mobile navigation
    gallery.js      # Gallery, lightbox, and image fallbacks
    forms.js        # Frontend-only form validation
```

Google Fonts, Unsplash images, and the demonstration/real Maps embed are external requests and require an internet connection. The forms do not send or save visitor data; this project includes no backend or API integration.
