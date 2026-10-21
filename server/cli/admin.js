const readline = require("node:readline");
const db = require("../db/database");
const { normalizeUsername, hashPassword } = require("../auth/security");

function argument(name) {
  const position = process.argv.indexOf(name);
  return position >= 0 ? process.argv[position + 1] : null;
}

function readSecret(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    return Promise.reject(new Error("Run this provisioning command from an interactive terminal."));
  }
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    let value = "";
    process.stdout.write(prompt);
    input.setRawMode(true);
    input.resume();
    const finish = (error) => {
      input.setRawMode(false);
      input.pause();
      input.removeListener("data", onData);
      process.stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (buffer) => {
      for (const character of buffer.toString("utf8")) {
        if (character === "\u0003") return finish(new Error("Cancelled."));
        if (character === "\r" || character === "\n") return finish();
        if (character === "\u007f" || character === "\b") value = value.slice(0, -1);
        else if (character >= " ") value += character;
      }
    };
    input.on("data", onData);
  });
}

async function main() {
  const command = process.argv[2];
  const username = normalizeUsername(argument("--username"));
  if (!username) throw new Error("Pass a valid --username (3–64 lowercase letters, digits, dots, underscores, or hyphens; or an email address).");

  const current = db.prepare("SELECT id FROM administrators WHERE username = ? COLLATE NOCASE").get(username);
  if (command === "create" && db.prepare("SELECT COUNT(*) AS count FROM administrators").get().count !== 0) {
    throw new Error("An administrator already exists. Initial account creation is one-time; use set-password to reset it.");
  }
  if (command === "set-password" && !current) throw new Error("No administrator with that username exists.");
  if (command !== "create" && command !== "set-password") throw new Error("Use create or set-password.");

  const first = await readSecret("New password (hidden): ");
  const second = await readSecret("Repeat password (hidden): ");
  if (first !== second) throw new Error("The passwords did not match.");
  const passwordHash = await hashPassword(first);

  if (command === "create") {
    const create = db.transaction(() => {
      if (db.prepare("SELECT COUNT(*) AS count FROM administrators").get().count !== 0) {
        throw new Error("An administrator already exists; no account was changed.");
      }
      db.prepare("INSERT INTO administrators (username, password_hash) VALUES (?, ?)").run(username, passwordHash);
    });
    create.immediate();
    console.log("Initial administrator created. Keep the username private and store the password in an approved password manager.");
  } else {
    db.transaction(() => {
      db.prepare("UPDATE administrators SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(passwordHash, current.id);
      db.prepare("DELETE FROM sessions").run();
    }).immediate();
    console.log("Administrator password updated and all existing sessions invalidated.");
  }
  db.close();
}

main().catch((error) => {
  console.error(error.message);
  db.close();
  process.exitCode = 1;
});
