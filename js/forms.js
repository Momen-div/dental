function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizePhoneDigits(value) {
  const latinDigitValue = value.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (digit) => {
    const codePoint = digit.charCodeAt(0);
    const zeroCodePoint = codePoint >= 0x06F0 ? 0x06F0 : 0x0660;
    return String(codePoint - zeroCodePoint);
  });

  return latinDigitValue.replace(/\D/g, "");
}

function validatePhone(value) {
  const digitCount = normalizePhoneDigits(value).length;
  return digitCount >= 7 && digitCount <= 15;
}

function setDateMinimum(dateInput) {
  if (!dateInput) return;

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  dateInput.min = `${year}-${month}-${day}`;
}

function isAvailableDate(value, openingDays) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const selectedDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isRealDate = selectedDate.getFullYear() === year
    && selectedDate.getMonth() === month - 1
    && selectedDate.getDate() === day;

  return isRealDate
    && selectedDate >= today
    && openingDays.includes(selectedDate.getDay());
}

function showFieldError(field, message) {
  field.setAttribute("aria-invalid", "true");
  const errorMessage = document.getElementById(`${field.id}-error`);
  if (errorMessage) errorMessage.textContent = message;
}

function validateRequiredFields(form, text) {
  let isValid = true;

  form.querySelectorAll("[required]").forEach((field) => {
    if (field.value.trim()) return;

    showFieldError(field, text("required"));
    isValid = false;
  });

  return isValid;
}

function validateBooking(form, config, text) {
  let isValid = validateRequiredFields(form, text);
  const phone = form.querySelector("#booking-phone");
  const email = form.querySelector("#booking-email");
  const date = form.querySelector("#booking-date");
  const time = form.querySelector("#booking-time");

  if (phone.value.trim() && !validatePhone(phone.value)) {
    showFieldError(phone, text("invalidPhone"));
    isValid = false;
  }

  if (email.value.trim() && !validateEmail(email.value.trim())) {
    showFieldError(email, text("invalidEmail"));
    isValid = false;
  }

  if (date.value && !isAvailableDate(date.value, config.booking.openingDays)) {
    const messageKey = date.value >= date.min ? "closedDay" : "invalidDate";
    showFieldError(date, text(messageKey));
    isValid = false;
  }

  if (time.value && !config.booking.availableTimes.includes(time.value)) {
    showFieldError(time, text("invalidTime"));
    isValid = false;
  }

  return isValid;
}

function validateContact(form, text) {
  let isValid = validateRequiredFields(form, text);
  const contactMethod = form.querySelector("#contact-method");
  const value = contactMethod.value.trim();

  if (value && !validateEmail(value) && !validatePhone(value)) {
    showFieldError(contactMethod, text("invalidContact"));
    isValid = false;
  }

  return isValid;
}

function clearFormErrors(form) {
  form.querySelectorAll(".field-error").forEach((error) => {
    error.textContent = "";
  });
  form.querySelectorAll('[aria-invalid="true"]').forEach((field) => {
    field.removeAttribute("aria-invalid");
  });
}

function clearFieldError(field) {
  if (!field.hasAttribute("aria-invalid")) return;

  field.removeAttribute("aria-invalid");
  const errorMessage = document.getElementById(`${field.id}-error`);
  if (errorMessage) errorMessage.textContent = "";
}

function handleFormSubmit(event, config, text) {
  event.preventDefault();

  const form = event.currentTarget;
  const formType = form.dataset.demoForm;
  const status = form.querySelector(".form-status");
  if (!status) return;

  clearFormErrors(form);
  status.textContent = "";
  status.classList.remove("is-error");

  const isValid = formType === "booking"
    ? validateBooking(form, config, text)
    : validateContact(form, text);

  if (!isValid) {
    status.textContent = text("errorSummary");
    status.classList.add("is-error");
    form.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }

  // This frontend-only preview does not send or store form data.
  status.textContent = text(formType === "booking" ? "bookingSuccess" : "contactSuccess");
}

/** Clears previous messages after the display language changes. */
export function clearFormFeedback() {
  document.querySelectorAll("[data-demo-form]").forEach((form) => {
    clearFormErrors(form);
    const status = form.querySelector(".form-status");
    if (!status) return;

    status.textContent = "";
    status.classList.remove("is-error");
  });
}

/** Sets up local validation and feedback for the booking and contact forms. */
export function initializeForms(config, text) {
  setDateMinimum(document.querySelector("#booking-date"));

  document.querySelectorAll("[data-demo-form]").forEach((form) => {
    form.addEventListener("submit", (event) => handleFormSubmit(event, config, text));
  });

  document.querySelectorAll(
    "#booking-form input, #booking-form select, #contact-form input, #contact-form textarea"
  ).forEach((field) => {
    field.addEventListener("input", () => clearFieldError(field));
    field.addEventListener("change", () => clearFieldError(field));
  });
}
