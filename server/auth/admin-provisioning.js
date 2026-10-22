const db = require("../db/database");
const { normalizeUsername, hashPassword } = require("./security");

function requiredUsername(value) {
  const username = normalizeUsername(value);
  if (!username) {
    throw new Error("Pass a valid username (3–64 lowercase letters, digits, dots, underscores, or hyphens; or an email address).");
  }
  return username;
}

async function createAdministrator(usernameValue, password) {
  const username = requiredUsername(usernameValue);
  if (db.prepare("SELECT COUNT(*) AS count FROM administrators").get().count !== 0) {
    throw new Error("An administrator already exists. Initial account creation is one-time; use set-password to reset it.");
  }
  const passwordHash = await hashPassword(password);
  const create = db.transaction(() => {
    if (db.prepare("SELECT COUNT(*) AS count FROM administrators").get().count !== 0) {
      throw new Error("An administrator already exists; no account was changed.");
    }
    db.prepare("INSERT INTO administrators (username, password_hash) VALUES (?, ?)").run(username, passwordHash);
  });
  create.immediate();
  return username;
}

async function resetAdministrator(usernameValue, password) {
  const username = requiredUsername(usernameValue);
  const passwordHash = await hashPassword(password);
  const reset = db.transaction(() => {
    const current = db.prepare("SELECT id FROM administrators WHERE username = ? COLLATE NOCASE").get(username);
    if (!current) throw new Error("No administrator with that username exists.");
    db.prepare("UPDATE administrators SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(passwordHash, current.id);
    db.prepare("DELETE FROM sessions").run();
  });
  reset.immediate();
  return username;
}

module.exports = { createAdministrator, resetAdministrator };
