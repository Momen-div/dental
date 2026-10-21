const express = require("express");
const db = require("../db/database");
const bookingRules = require("../../js/booking-rules");

const router = express.Router();

const OPENING_DAYS = bookingRules.openingDays;
const AVAILABLE_TIMES = new Set(bookingRules.availableTimes);
const AVAILABLE_SERVICES = new Set(bookingRules.services);

function sendValidationError(res, code, field) {
  return res.status(400).json({ error: { code, field } });
}

router.post("/", (req, res) => {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ error: { code: "INVALID_BODY", field: null } });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
  const phone = bookingRules.normalizePhone(rawPhone);
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const service = typeof body.service === "string" ? body.service.trim() : "";
  const date = typeof body.date === "string" ? body.date : "";
  const time = typeof body.time === "string" ? body.time : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!name || name.length > 100) {
    return sendValidationError(res, name ? "NAME_TOO_LONG" : "NAME_REQUIRED", "name");
  }

  if (phone.length < 7 || phone.length > 15) {
    return sendValidationError(res, "PHONE_INVALID", "phone");
  }

  if (
    (body.email != null && typeof body.email !== "string")
    ||
    email.length > 254
    || (email && !bookingRules.isValidEmail(email))
  ) {
    return sendValidationError(res, "EMAIL_INVALID", "email");
  }

  if (!AVAILABLE_SERVICES.has(service)) {
    return sendValidationError(res, "SERVICE_INVALID", "service");
  }

  const dateError = bookingRules.getDateError(date, bookingRules.getClinicDate(), OPENING_DAYS);
  if (dateError === "invalidDate" || dateError === "pastDate") {
    return sendValidationError(res, dateError === "pastDate" ? "DATE_PAST" : "DATE_INVALID", "date");
  }

  if (dateError === "closedWeekday") {
    return sendValidationError(res, "CLOSED_WEEKDAY", "date");
  }

  if (!AVAILABLE_TIMES.has(time)) {
    return sendValidationError(res, "TIME_INVALID", "time");
  }

  if ((body.message != null && typeof body.message !== "string") || message.length > 500) {
    const code = typeof body.message === "string" ? "MESSAGE_TOO_LONG" : "MESSAGE_INVALID";
    return sendValidationError(res, code, "message");
  }

  try {
    const result = db.prepare(`
      INSERT INTO appointments (
        patient_name,
        phone,
        email,
        service,
        appointment_date,
        appointment_time,
        notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      phone,
      email || null,
      service,
      date,
      time,
      message || null
    );

    return res.status(201).json({
      message: "Appointment request received.",
      appointmentId: result.lastInsertRowid,
      status: "pending",
    });
  } catch (error) {
    if (
      error.code === "SQLITE_CONSTRAINT_UNIQUE"
      || error.code === "SQLITE_CONSTRAINT_PRIMARYKEY"
    ) {
      return res.status(409).json({
        error: { code: "SLOT_UNAVAILABLE", field: "time" },
      });
    }

    console.error("Failed to create appointment:", error);

    return res.status(500).json({
      error: { code: "INTERNAL_SERVER_ERROR", field: null },
    });
  }
});

module.exports = router;