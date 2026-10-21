const express = require("express");
const { rateLimit } = require("express-rate-limit");
const db = require("../db/database");
const {
  normalizeUsername,
  verifyPassword,
  csrfToken,
  requireCsrf,
  isAdministrator,
  requireAdministrator,
} = require("../auth/security");

const router = express.Router();
const findAdministrator = db.prepare("SELECT id, username, password_hash FROM administrators WHERE username = ? COLLATE NOCASE");
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: { code: "AUTHENTICATION_FAILED", field: null } },
});
const csrfLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

router.get("/csrf", csrfLimiter, (req, res) => {
  if (!req.session.csrfToken) req.session.csrfToken = csrfToken();
  res.set("Cache-Control", "no-store").json({ csrfToken: req.session.csrfToken });
});

router.post("/login", loginLimiter, requireCsrf, async (req, res) => {
  const body = req.body;
  const username = normalizeUsername(body?.username);
  const password = typeof body?.password === "string" ? body.password : "";
  const administrator = username ? findAdministrator.get(username) : null;
  const validPassword = await verifyPassword(password, administrator?.password_hash);

  if (!administrator || !validPassword) {
    return res.status(401).json({ error: { code: "AUTHENTICATION_FAILED", field: null } });
  }

  req.session.regenerate((error) => {
    if (error) return res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR", field: null } });
    req.session.administrator = { id: administrator.id, username: administrator.username };
    req.session.csrfToken = csrfToken();
    return req.session.save((saveError) => {
      if (saveError) return res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR", field: null } });
      return res.json({ administrator: { username: administrator.username }, csrfToken: req.session.csrfToken });
    });
  });
});

router.get("/session", (req, res) => {
  if (!isAdministrator(req)) return res.status(401).json({ error: { code: "AUTHENTICATION_REQUIRED", field: null } });
  return res.set("Cache-Control", "no-store").json({
    administrator: { username: req.session.administrator.username },
    csrfToken: req.session.csrfToken,
  });
});

router.post("/logout", requireAdministrator, requireCsrf, (req, res) => {
  req.session.destroy((error) => {
    if (error) return res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR", field: null } });
    res.clearCookie("clinic.sid", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
    return res.status(204).end();
  });
});

module.exports = router;
