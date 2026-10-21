const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const db = require("../db/database");

const PASSWORD_COST = 12;
const DUMMY_HASH = bcrypt.hashSync(crypto.randomBytes(32).toString("hex"), PASSWORD_COST);

function normalizeUsername(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().normalize("NFKC").toLowerCase();
  if (normalized.length > 254 || normalized.length < 3) return null;
  const usernameValid = /^[a-z0-9][a-z0-9._-]{2,63}$/.test(normalized);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
  return usernameValid || emailValid ? normalized : null;
}

function validPassword(value) {
  return typeof value === "string"
    && value.length >= 12
    && value.length <= 128
    && Buffer.byteLength(value, "utf8") <= 72;
}

function hashPassword(value) {
  if (!validPassword(value)) throw new Error("Password must be 12–128 characters and no more than 72 UTF-8 bytes.");
  return bcrypt.hash(value, PASSWORD_COST);
}

async function verifyPassword(value, encodedHash) {
  const hash = typeof encodedHash === "string" ? encodedHash : DUMMY_HASH;
  try {
    const validInput = validPassword(value);
    const matched = await bcrypt.compare(validInput ? value : "", hash);
    return Boolean(encodedHash) && validInput && matched;
  } catch {
    return false;
  }
}

function isAdministrator(req) {
  const administrator = req.session?.administrator;
  if (!administrator || !Number.isSafeInteger(administrator.id)) return false;
  return Boolean(db.prepare("SELECT 1 FROM administrators WHERE id = ?").get(administrator.id));
}

function requireAdministrator(req, res, next) {
  if (!isAdministrator(req)) {
    return res.status(401).json({ error: { code: "AUTHENTICATION_REQUIRED", field: null } });
  }
  return next();
}

function csrfToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function safeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function requireCsrf(req, res, next) {
  const origin = req.get("origin");
  if (origin) {
    try {
      const parsed = new URL(origin);
      const expectedHost = req.get("host");
      const expectedProtocol = req.protocol;
      if (parsed.host !== expectedHost || parsed.protocol !== `${expectedProtocol}:`) {
        return res.status(403).json({ error: { code: "CSRF_REJECTED", field: null } });
      }
    } catch {
      return res.status(403).json({ error: { code: "CSRF_REJECTED", field: null } });
    }
  }

  if (!safeEqual(req.session?.csrfToken, req.get("x-csrf-token"))) {
    return res.status(403).json({ error: { code: "CSRF_REJECTED", field: null } });
  }
  return next();
}

module.exports = {
  PASSWORD_COST,
  normalizeUsername,
  validPassword,
  hashPassword,
  verifyPassword,
  isAdministrator,
  requireAdministrator,
  csrfToken,
  requireCsrf,
};
