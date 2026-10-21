const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

const projectRoot = path.resolve(__dirname, "../..");
const sourcePath = process.env.APPOINTMENTS_DB_PATH
  ? path.resolve(process.env.APPOINTMENTS_DB_PATH)
  : path.join(projectRoot, "data", "appointments.db");
const backupDirectory = path.resolve(process.env.BACKUP_DIR || path.join(projectRoot, "data", "backups"));

function argument(name) {
  const position = process.argv.indexOf(name);
  return position >= 0 ? process.argv[position + 1] : null;
}

function canonicalFuturePath(target) {
  if (fs.existsSync(target)) return fs.realpathSync(target);
  let parent = path.dirname(target);
  const suffix = [path.basename(target)];
  while (!fs.existsSync(parent)) {
    suffix.unshift(path.basename(parent));
    parent = path.dirname(parent);
  }
  return path.resolve(fs.realpathSync(parent), ...suffix);
}

function isWithin(parent, target) {
  const relative = path.relative(parent, target);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function assertPrivatePath(target) {
  const canonical = canonicalFuturePath(path.resolve(target));
  const publicDirs = ["assets", "css", "js"].map((entry) => fs.realpathSync(path.join(projectRoot, entry)));
  if (publicDirs.some((directory) => isWithin(directory, canonical))) {
    throw new Error("Backup files must be stored outside public asset directories.");
  }
}

function validateSQLite(file) {
  const database = new Database(file, { readonly: true, fileMustExist: true });
  try {
    const result = database.pragma("integrity_check", { simple: true });
    if (result !== "ok") throw new Error("SQLite integrity check failed.");
  } finally {
    database.close();
  }
}

function formatTimestamp(date = new Date()) {
  return date.toISOString().replaceAll(":", "-").replaceAll(".", "-");
}

function pruneOldBackups() {
  const retentionDays = Number(process.env.BACKUP_RETENTION_DAYS || 30);
  if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 3650) {
    throw new Error("BACKUP_RETENTION_DAYS must be an integer from 1 through 3650.");
  }
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  for (const file of fs.readdirSync(backupDirectory)) {
    if (!/^clinic-backup-\d{4}-\d{2}-\d{2}T[\d-]+Z\.sqlite$/.test(file)) continue;
    const fullPath = path.join(backupDirectory, file);
    if (fs.statSync(fullPath).mtimeMs < cutoff) fs.unlinkSync(fullPath);
  }
}

async function createBackup() {
  if (!fs.existsSync(sourcePath)) throw new Error("Source database does not exist; nothing was backed up.");
  fs.mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });
  try { fs.chmodSync(backupDirectory, 0o700); } catch {}
  const requested = argument("--destination");
  const destination = requested ? path.resolve(requested) : path.join(backupDirectory, `clinic-backup-${formatTimestamp()}.sqlite`);
  assertPrivatePath(destination);
  if (path.resolve(destination) === path.resolve(sourcePath) || fs.existsSync(destination)) {
    throw new Error("Backup destination must be new and different from the source database.");
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
  const temporary = `${destination}.${process.pid}.partial`;
  const source = new Database(sourcePath, { readonly: true, fileMustExist: true });
  try {
    await source.backup(temporary);
    validateSQLite(temporary);
    fs.chmodSync(temporary, 0o600);
    fs.renameSync(temporary, destination);
    if (path.dirname(destination) === backupDirectory) pruneOldBackups();
    console.log(`Verified SQLite backup created: ${destination}`);
  } finally {
    source.close();
    if (fs.existsSync(temporary)) fs.rmSync(temporary, { force: true });
  }
}

function verifyBackup() {
  const file = argument("--file");
  if (!file) throw new Error("Pass --file with the backup path to verify.");
  const resolved = path.resolve(file);
  assertPrivatePath(resolved);
  validateSQLite(resolved);
  console.log("Backup integrity check passed.");
}

async function restoreBackup() {
  const file = argument("--file");
  const destination = argument("--destination");
  if (process.argv.indexOf("--confirm") < 0) throw new Error("Restore requires explicit --confirm.");
  if (!file || !destination) throw new Error("Pass --file and a separate --destination. Restore never overwrites an existing file.");
  const backup = path.resolve(file);
  const target = path.resolve(destination);
  assertPrivatePath(backup);
  assertPrivatePath(target);
  if (target === path.resolve(sourcePath) || fs.existsSync(target)) {
    throw new Error("Restore destination must be a new file and must not be the configured live database.");
  }
  validateSQLite(backup);
  fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
  const source = new Database(backup, { readonly: true, fileMustExist: true });
  try {
    await source.backup(target);
  } finally {
    source.close();
  }
  try {
    validateSQLite(target);
    fs.chmodSync(target, 0o600);
  } catch (error) {
    fs.rmSync(target, { force: true });
    throw error;
  }
  console.log(`Restore verified at new destination: ${target}. Stop the app and configure APPOINTMENTS_DB_PATH to this file only after reviewing it.`);
}

const command = process.argv[2];
const work = command === "create" ? createBackup()
  : command === "verify" ? Promise.resolve().then(verifyBackup)
    : command === "restore" ? restoreBackup()
      : Promise.reject(new Error("Use create, verify, or restore."));

work.catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
