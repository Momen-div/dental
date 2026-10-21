const Database = require("better-sqlite3");
const path = require("node:path");
const fs = require("node:fs");

// Restrict newly created SQLite WAL/SHM and session artifacts for this process.
process.umask(0o077);

const dataDirectory = path.join(__dirname, "../../data");
const projectRoot = path.resolve(__dirname, "../..");
const databasePath = process.env.APPOINTMENTS_DB_PATH
  ? path.resolve(process.env.APPOINTMENTS_DB_PATH)
  : path.join(dataDirectory, "appointments.db");

function resolveThroughExistingParent(targetPath) {
  let existingPath = targetPath;
  const remainingPath = [];

  while (!fs.existsSync(existingPath)) {
    remainingPath.unshift(path.basename(existingPath));
    existingPath = path.dirname(existingPath);
  }

  return path.resolve(fs.realpathSync(existingPath), ...remainingPath);
}

function isWithinDirectory(directory, targetPath) {
  const relativePath = path.relative(directory, targetPath);
  return relativePath === "" || (!relativePath.startsWith(`..${path.sep}`) && relativePath !== ".." && !path.isAbsolute(relativePath));
}

const realProjectRoot = fs.realpathSync(projectRoot);
const realDataDirectory = resolveThroughExistingParent(dataDirectory);
const realDatabasePath = resolveThroughExistingParent(databasePath);
const publicDirectories = ["assets", "css", "js"].map((directory) =>
  fs.realpathSync(path.join(projectRoot, directory))
);
const dataDirectoryIsPublic = publicDirectories.some((directory) =>
  isWithinDirectory(directory, realDataDirectory)
);

if (
  dataDirectoryIsPublic
  || (isWithinDirectory(realProjectRoot, realDatabasePath)
    && !isWithinDirectory(realDataDirectory, realDatabasePath))
) {
  throw new Error("APPOINTMENTS_DB_PATH must be inside data/ or outside the project directory.");
}

fs.mkdirSync(path.dirname(databasePath), { recursive: true, mode: 0o700 });
const db = new Database(databasePath);
try {
  fs.chmodSync(databasePath, 0o600);
} catch {}

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");
db.pragma("synchronous = NORMAL");

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      service TEXT NOT NULL,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'cancelled')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS administrators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      sid TEXT PRIMARY KEY,
      sess TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions (expires_at);
  `);

  // Add new columns safely to databases created by earlier versions.
  const columns = db.prepare("PRAGMA table_info(appointments)").all();
  const existingColumns = new Set(columns.map((column) => column.name));

  if (!existingColumns.has("email")) {
    db.exec("ALTER TABLE appointments ADD COLUMN email TEXT");
  }

  if (!existingColumns.has("service")) {
    db.exec(
      "ALTER TABLE appointments ADD COLUMN service TEXT NOT NULL DEFAULT ''"
    );
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_appointments_date_time
    ON appointments (appointment_date, appointment_time);
  `);

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_appointment
    ON appointments (appointment_date, appointment_time)
    WHERE status IN ('pending', 'confirmed');
  `);

  console.log("Database initialized successfully.");
} catch (error) {
  db.close();
  throw error;
}

module.exports = db;
