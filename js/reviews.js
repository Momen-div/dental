const GOOGLE_MAPS_HOSTS = new Set([
  "google.com",
  "www.google.com",
  "maps.google.com",
  "maps.app.goo.gl",
  "goo.gl",
]);

function getGoogleMapsUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !GOOGLE_MAPS_HOSTS.has(url.hostname)) return "";
    if (["google.com", "www.google.com", "maps.google.com", "goo.gl"].includes(url.hostname)
      && !url.pathname.startsWith("/maps")) return "";

    return url.href;
  } catch {
    return "";
  }
}

function isValidReview(review) {
  return review
    && typeof review.text === "string"
    && review.text.trim()
    && Number.isInteger(review.rating)
    && review.rating >= 1
    && review.rating <= 5;
}

function formatReviewDate(value, language) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";

  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return "";

  return new Intl.DateTimeFormat(language, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function createReviewCard(review, text, language) {
  const card = document.createElement("article");
  card.className = "review-card";

  const stars = document.createElement("div");
  stars.className = "review-stars";
  stars.setAttribute("role", "img");
  stars.setAttribute("aria-label", text("reviewRating").replace("{rating}", review.rating));
  stars.textContent = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);

  const quote = document.createElement("blockquote");
  quote.className = "review-quote";
  quote.textContent = review.text.trim();

  const meta = document.createElement("div");
  meta.className = "review-meta";

  const reviewer = document.createElement("div");
  if (typeof review.author === "string" && review.author.trim()) {
    const author = document.createElement("span");
    author.className = "review-author";
    author.textContent = review.author.trim();
    reviewer.append(author);
  }

  const dateText = formatReviewDate(review.date, language);
  if (dateText) {
    const date = document.createElement("time");
    date.dateTime = review.date;
    date.setAttribute("aria-label", text("reviewDate"));
    date.textContent = dateText;
    reviewer.append(date);
  }

  const source = document.createElement("span");
  source.className = "review-source";
  source.setAttribute("aria-label", text("googleAttribution"));
  const mark = document.createElement("span");
  mark.className = "google-mark";
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = "G";
  const sourceName = document.createElement("span");
  sourceName.textContent = "Google";
  source.append(mark, sourceName);

  meta.append(reviewer, source);
  card.append(stars, quote, meta);
  return card;
}

export function renderGoogleReviews(config, text, language) {
  const grid = document.querySelector("#google-reviews");
  const emptyState = document.querySelector("#reviews-empty");
  const emptyTitle = document.querySelector("#reviews-empty-title");
  const emptyText = document.querySelector("#reviews-empty-text");
  const link = document.querySelector("#google-reviews-link");
  if (!grid || !emptyState || !emptyTitle || !emptyText || !link) return;

  const reviews = Array.isArray(config.googleReviews)
    ? config.googleReviews.filter(isValidReview)
    : [];
  const mapsUrl = getGoogleMapsUrl(config.googleReviewsUrl);

  grid.replaceChildren(...reviews.map((review) => createReviewCard(review, text, language)));
  emptyState.hidden = reviews.length > 0;
  emptyTitle.textContent = text(mapsUrl ? "reviewsEmptyTitle" : "reviewsSetupTitle");
  emptyText.textContent = text(mapsUrl ? "reviewsEmptyText" : "reviewsSetupText");

  link.hidden = !mapsUrl;
  if (mapsUrl) link.href = mapsUrl;
  else link.removeAttribute("href");
}