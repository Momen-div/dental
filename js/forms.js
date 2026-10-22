function setDateMinimum(dateInput) {
  if (!dateInput) return;

  dateInput.min = globalThis.DentalBookingRules.getClinicDate();
}

function isAvailableDate(value, openingDays) {
  return globalThis.DentalBookingRules.getDateError(
    value,
    globalThis.DentalBookingRules.getClinicDate(),
    openingDays
  );
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
  const name = form.querySelector("#booking-name");

  if (name.value.trim().length > 100) {
    showFieldError(name, text("invalidName"));
    isValid = false;
  }

  if (phone.value.trim() && !globalThis.DentalBookingRules.isValidPhone(phone.value)) {
    showFieldError(phone, text("invalidPhone"));
    isValid = false;
  }

  if (email.value.trim() && !globalThis.DentalBookingRules.isValidEmail(email.value.trim())) {
    showFieldError(email, text("invalidEmail"));
    isValid = false;
  }

  if (date.value) {
    const dateError = isAvailableDate(date.value, config.booking.openingDays);
    if (dateError) {
      showFieldError(date, text(dateError === "closedWeekday" ? "closedDay" : "invalidDate"));
      isValid = false;
    }
  }

  if (time.value && !config.booking.availableTimes.includes(time.value)) {
    showFieldError(time, text("invalidTime"));
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

const API_VALIDATION_MESSAGES = {
  NAME_REQUIRED: "required",
  NAME_TOO_LONG: "invalidName",
  PHONE_INVALID: "invalidPhone",
  EMAIL_INVALID: "invalidEmail",
  SERVICE_INVALID: "invalidService",
  DATE_INVALID: "invalidDate",
  DATE_PAST: "invalidDate",
  CLOSED_WEEKDAY: "closedDay",
  TIME_INVALID: "invalidTime",
  MESSAGE_TOO_LONG: "messageTooLong",
  MESSAGE_INVALID: "invalidMessage",
  SLOT_UNAVAILABLE: "slotUnavailable",
};

const BOOKING_FIELD_IDS = {
  name: "booking-name",
  phone: "booking-phone",
  email: "booking-email",
  service: "booking-service",
  date: "booking-date",
  time: "booking-time",
  message: "booking-message",
};

function showApiError(form, status, response, result, text) {
  const error = result?.error;
  const messageKey = error && API_VALIDATION_MESSAGES[error.code];
  const fieldName = Object.hasOwn(BOOKING_FIELD_IDS, error?.field)
    ? BOOKING_FIELD_IDS[error.field]
    : null;
  const field = fieldName ? form.elements.namedItem(fieldName) : null;

  if (messageKey && field) {
    const message = text(messageKey);
    showFieldError(field, message);
    status.textContent = message;
    field.focus();
  } else if (response.status === 409 || error?.code === "SLOT_UNAVAILABLE") {
    status.textContent = text("slotUnavailable");
  } else if (response.status === 400) {
    status.textContent = text("bookingInvalid");
  } else {
    status.textContent = text("bookingFailed");
  }

  status.classList.add("is-error");
}

export async function readJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!/(?:application|text)\/(?:[\w.-]+\+)?json\b/i.test(contentType)) return null;

  const body = await response.text();
  if (!body.trim()) return null;

  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}


async function submitBooking(form, status, text) {
  const submitButton = form.querySelector('[type="submit"]');

  if (submitButton) submitButton.disabled = true;

  status.textContent = text("submitting");
  status.classList.remove("is-error");

  const formData = new FormData(form);

  const payload = {
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    service: formData.get("service"),
    date: formData.get("date"),
    time: formData.get("time"),
    message: formData.get("message"),
  };

  try {
    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await readJsonResponse(response);

    if (!response.ok) {
      showApiError(form, status, response, result, text);
      return;
    }

    if (
      !result
      || typeof result !== "object"
      || result.status !== "pending"
      || result.appointmentId == null
    ) {
      status.textContent = text("bookingFailed");
      status.classList.add("is-error");
      return;
    }

    status.textContent = text("bookingSuccess");
    form.reset();
    setDateMinimum(form.querySelector("#booking-date"));
  } catch (error) {
    console.error("Booking request failed:", error);
    status.textContent = text("bookingFailed");
    status.classList.add("is-error");
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
}



function handleFormSubmit(event, config, text) {
  event.preventDefault();

  const form = event.currentTarget;
  const status = form.querySelector(".form-status");

  if (!status) return;

  clearFormErrors(form);
  status.textContent = "";
  status.classList.remove("is-error");

  if (!validateBooking(form, config, text)) {
    status.textContent = text("errorSummary");
    status.classList.add("is-error");
    form.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }

  submitBooking(form, status, text);
}


/** Clears previous messages after the display language changes. */
export function clearFormFeedback() {
  document.querySelectorAll("#booking-form").forEach((form) => {
    clearFormErrors(form);
    const status = form.querySelector(".form-status");
    if (!status) return;

    status.textContent = "";
    status.classList.remove("is-error");
  });
}

/** Sets up validation and feedback for the appointment booking form. */
export function initializeForms(config, text) {
  setDateMinimum(document.querySelector("#booking-date"));

  document.querySelectorAll("#booking-form").forEach((form) => {
    form.addEventListener("submit", (event) => handleFormSubmit(event, config, text));
  });

  document.querySelectorAll("#booking-form input, #booking-form select, #booking-form textarea").forEach((field) => {
    field.addEventListener("input", () => clearFieldError(field));
    field.addEventListener("change", () => clearFieldError(field));
  });
}
