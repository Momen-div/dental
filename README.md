# Premium Dental Clinic Website

A responsive, single-page clinic website built with semantic HTML, CSS, and vanilla JavaScript. Arabic is the first-visit default; the complete interface is also available in English. The static pages do not require a Node.js server.

## Run locally

Use any static HTTP server from this directory. For example, with Python installed:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`. A local HTTP server is recommended over opening the HTML file directly so fonts, map content, and browser storage work consistently. There is no frontend build step or package installation.

## Customize for a real clinic

Edit [config.js](config.js) before publishing:

- `clinicName`: official Arabic and English clinic names; the current labels are placeholders.
- `images.hero`, `images.gallery`, `services[].image`, and `dentist.image`: replace all illustrative stock photos with appropriately licensed assets or clinic photography. Images are sourced from Unsplash and must be checked against its current license/terms. The interface labels the dentist, gallery, and hero imagery as illustrative; gallery photos are not patient cases.
- `services`: select only services actually provided. Each service `id` must have matching Arabic and English title/description entries in [translations.js](translations.js). **The clinic must verify every listed service and description before publication.**
- `dentist.name`, `dentist.title`, and `dentist.bio`: use only approved name, qualifications, specialty, and biography. Current content is deliberately placeholder text.
- `contact.phone`, `contact.whatsapp`, `contact.email`, `contact.address`, and `contact.hours`: add verified public clinic contact information. Phone and WhatsApp values should use international country-code format.
- `mapEmbedUrl`: replace the demonstration map of Amman with a Google Maps embed URL for the real clinic. The current map is fictional demonstration content and is not associated with the named dentist placeholder.
- `booking.phoneCountryCode`: defaults to Jordan's `+962` as an editable suggestion.
- `booking.openingDays`: configure JavaScript weekday numbers (`0` = Sunday through `6` = Saturday) to match clinic appointment days. `availableTimes` controls selectable preferred times. Verify both with the clinic.
- `social`: add verified social profile URLs; empty values are hidden.
- Brand colors and typography can be adjusted in the CSS custom properties at the top of [style.css](style.css).
- Keep Arabic/English interface copy in [translations.js](translations.js), including service names and descriptions.

The appointment and contact forms are **frontend-only previews**. They validate input locally and explain that nothing is sent, received, or saved. The project contains no form submission endpoint or persistence layer.

## Deployment

Deploy the project root (`index.html`, `style.css`, `main.js`, `config.js`, and `translations.js`) to any static host such as GitHub Pages, Netlify, Cloudflare Pages, or an ordinary web server. The website has no mandatory backend dependency. HTTPS should be enabled on a public deployment. Google Fonts, Unsplash photos, and the demonstration/real Maps embed are external requests and require an internet connection. Google Maps API credentials are not used by the current iframe embed; a different map integration may have separate credentials and setup needs.

## Optional future backend (not implemented or connected)

The static site is independent. A future Node.js/Express/PostgreSQL service could use a separate structure such as:

```text
server/
├── package.json
├── .env.example
└── src/
    ├── app.js
    ├── routes/
    │   ├── appointments.js
    │   └── contact.js
    ├── controllers/
    ├── services/
    ├── middleware/
    └── db/
```

There is no client-side API integration in this project. No server, database, appointment persistence, email delivery, or API credential is included in this deliverable.

Before enabling this integration, the backend must validate and sanitize input, enforce server-side date/service rules, rate-limit submissions, apply security headers, use parameterized PostgreSQL queries, keep credentials in environment variables, handle database failures, and establish appropriate access controls and privacy safeguards. Document the required environment variables in `.env.example` without real secrets. Review local privacy, consent, retention, and applicable healthcare data obligations before collecting any real patient information.
