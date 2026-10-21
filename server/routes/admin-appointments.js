const express = require("express");
const db = require("../db/database");
const bookingRules = require("../../js/booking-rules");
const { requireAdministrator, requireCsrf } = require("../auth/security");

const router = express.Router();
const validStatuses = new Set(["pending", "confirmed", "cancelled"]);
const validServices = new Set(bookingRules.services);
const selectAppointment = db.prepare(`
  SELECT id, patient_name AS name, phone, email, service, appointment_date AS date,
    appointment_time AS time, notes, status, created_at AS createdAt
  FROM appointments WHERE id = ?
`);
const statusCounts = db.prepare(`
  SELECT COUNT(*) AS total,
    COALESCE(SUM(status = 'pending'), 0) AS pending,
    COALESCE(SUM(status = 'confirmed'), 0) AS confirmed,
    COALESCE(SUM(status = 'cancelled'), 0) AS cancelled
  FROM appointments
`);

router.use(requireAdministrator);
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

function parseId(value) {
  if (!/^\d{1,12}$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

router.get("/", (req, res) => {
  const { date, from, to, service, status, search } = req.query;
  const rawPage = req.query.page ?? "1";
  const rawLimit = req.query.limit ?? "25";
  if (typeof rawPage !== "string" || !/^\d{1,6}$/.test(rawPage) || Number(rawPage) < 1
    || typeof rawLimit !== "string" || !/^\d{1,3}$/.test(rawLimit) || Number(rawLimit) < 1 || Number(rawLimit) > 100) {
    return res.status(400).json({ error: { code: "FILTER_INVALID", field: "page" } });
  }
  if ((date && !validDate(date)) || (from && !validDate(from)) || (to && !validDate(to)) || (from && to && from > to)) {
    return res.status(400).json({ error: { code: "FILTER_INVALID", field: "date" } });
  }
  if (service && !validServices.has(service)) return res.status(400).json({ error: { code: "FILTER_INVALID", field: "service" } });
  if (status && status !== "all" && !validStatuses.has(status)) return res.status(400).json({ error: { code: "FILTER_INVALID", field: "status" } });
  if (search != null && (typeof search !== "string" || search.length > 100)) {
    return res.status(400).json({ error: { code: "FILTER_INVALID", field: "search" } });
  }

  const clauses = [];
  const values = [];
  if (date) { clauses.push("appointment_date = ?"); values.push(date); }
  if (from) { clauses.push("appointment_date >= ?"); values.push(from); }
  if (to) { clauses.push("appointment_date <= ?"); values.push(to); }
  if (service) { clauses.push("service = ?"); values.push(service); }
  if (status && status !== "all") { clauses.push("status = ?"); values.push(status); }
  if (search) {
    const escaped = search.replace(/[\\%_]/g, "\\$&");
    clauses.push("(patient_name LIKE ? ESCAPE '\\' OR phone LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\')");
    values.push(`%${escaped}%`, `%${escaped}%`, `%${escaped}%`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const page = Number(rawPage);
  const limit = Number(rawLimit);
  const total = db.prepare(`SELECT COUNT(*) AS count FROM appointments ${where}`).get(...values).count;
  const appointments = db.prepare(`
    SELECT id, patient_name AS name, phone, email, service, appointment_date AS date,
      appointment_time AS time, notes, status, created_at AS createdAt
    FROM appointments ${where}
    ORDER BY appointment_date DESC, appointment_time DESC, id DESC
    LIMIT ? OFFSET ?
  `).all(...values, limit, (page - 1) * limit);

  return res.set("Cache-Control", "no-store").json({
    appointments,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    summary: statusCounts.get(),
  });
});

router.get("/:id", (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: { code: "ID_INVALID", field: "id" } });
  const appointment = selectAppointment.get(id);
  if (!appointment) return res.status(404).json({ error: { code: "APPOINTMENT_NOT_FOUND", field: null } });
  return res.set("Cache-Control", "no-store").json({ appointment });
});

router.patch("/:id", requireCsrf, (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: { code: "ID_INVALID", field: "id" } });
  const targetStatus = req.body?.status;
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)
    || Object.keys(req.body).some((key) => key !== "status")
    || !validStatuses.has(targetStatus) || targetStatus === "pending") {
    return res.status(400).json({ error: { code: "STATUS_INVALID", field: "status" } });
  }

  const current = selectAppointment.get(id);
  if (!current) return res.status(404).json({ error: { code: "APPOINTMENT_NOT_FOUND", field: null } });
  if (current.status === "cancelled" || current.status === targetStatus) {
    return res.status(409).json({ error: { code: "STATUS_TRANSITION_INVALID", field: "status" } });
  }

  try {
    const update = db.prepare("UPDATE appointments SET status = ? WHERE id = ? AND status = ?").run(targetStatus, id, current.status);
    if (!update.changes) return res.status(409).json({ error: { code: "STATUS_TRANSITION_INVALID", field: "status" } });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ error: { code: "SLOT_UNAVAILABLE", field: "time" } });
    }
    throw error;
  }
  return res.json({ appointment: selectAppointment.get(id) });
});

router.delete("/:id", requireCsrf, (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: { code: "ID_INVALID", field: "id" } });
  const result = db.prepare("DELETE FROM appointments WHERE id = ?").run(id);
  if (!result.changes) return res.status(404).json({ error: { code: "APPOINTMENT_NOT_FOUND", field: null } });
  return res.status(204).end();
});

module.exports = router;
