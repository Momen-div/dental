const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { after, before, test } = require("node:test");

const projectRoot = path.resolve(__dirname, "..");
const dataDirectory = path.join(projectRoot, "data");
const testDirectory = fs.mkdtempSync(path.join(dataDirectory, "admin-api-test-"));
const databasePath = path.join(testDirectory, "isolated.sqlite");
const backupDirectory = path.join(testDirectory, "backups");
process.env.APPOINTMENTS_DB_PATH = databasePath;
process.env.SESSION_SECRET = "test-only-session-secret-never-use-in-production-32bytes";
process.env.NODE_ENV = "test";

const { hashPassword, verifyPassword } = require("../server/auth/security");
const app = require("../server/app");
const db = require("../server/db/database");
const server = http.createServer(app);
let origin;
let browserCookie = "";
let csrfToken = "";

function storedCookie(response) {
  const entries = response.headers.getSetCookie?.() ?? [response.headers.get("set-cookie")].filter(Boolean);
  const sessionCookie = entries.find((value) => value.startsWith("clinic.sid="));
  return sessionCookie ? sessionCookie.split(";")[0] : null;
}

async function request(route, options = {}) {
  const headers = new Headers(options.headers || {});
  if (browserCookie) headers.set("Cookie", browserCookie);
  const response = await fetch(`${origin}${route}`, { ...options, headers, redirect: "manual" });
  const updatedCookie = storedCookie(response);
  if (updatedCookie) browserCookie = updatedCookie;
  return response;
}

async function getCsrf() {
  const response = await request("/api/auth/csrf");
  assert.equal(response.status, 200);
  csrfToken = (await response.json()).csrfToken;
  assert.equal(typeof csrfToken, "string");
  return csrfToken;
}

function jordanFutureWeekday(weekday) {
  const dateText = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Amman", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  const [year, month, day] = dateText.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  for (let offset = 1; offset <= 14; offset += 1) {
    const candidate = new Date(date);
    candidate.setUTCDate(candidate.getUTCDate() + offset);
    if (candidate.getUTCDay() === weekday) return candidate.toISOString().slice(0, 10);
  }
  throw new Error("Could not find a future open clinic day.");
}

async function makeAppointment(time) {
  const response = await request("/api/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Synthetic Patient", phone: "+962790000111", email: "synthetic@example.invalid",
      service: "general", date: jordanFutureWeekday(1), time, message: "Synthetic test record",
    }),
  });
  assert.equal(response.status, 201);
  return (await response.json()).appointmentId;
}

before(async () => {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      origin = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server.listening) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  db.close();
  const resolved = path.resolve(testDirectory);
  if (path.dirname(resolved) !== dataDirectory || !path.basename(resolved).startsWith("admin-api-test-")) {
    throw new Error("Refusing cleanup outside the isolated admin test directory.");
  }
  fs.rmSync(resolved, { recursive: true, force: true });
});

test("administrator authentication, authorization, CSRF, lifecycle, and backups", async () => {
  const testUsername = "synthetic-owner";
  const testPassword = "Test-only-Clinic-Password-42!";
  const encoded = await hashPassword(testPassword);
  assert.notEqual(encoded, testPassword);
  assert.match(encoded, /^\$2[aby]\$12\$/);
  assert.equal(await verifyPassword(testPassword, encoded), true);
  assert.equal(await verifyPassword("wrong-test-password", encoded), false);
  assert.equal(await verifyPassword(`${testPassword}unintended-suffix`, encoded), false, "bcrypt input truncation must not permit suffix passwords");
  assert.throws(() => hashPassword("x".repeat(80)), /no more than 72 UTF-8 bytes/);
  db.prepare("INSERT INTO administrators (username, password_hash) VALUES (?, ?)").run(testUsername, encoded);

  const firstId = await makeAppointment("09:00");
  const secondId = await makeAppointment("10:00");
  const publicHtml = await request("/admin", { redirect: "manual" });
  assert.equal(publicHtml.status, 303);
  assert.equal(publicHtml.headers.get("location"), "/admin/login");
  const loginPage = await request("/admin/login");
  assert.equal(loginPage.status, 200);
  const loginHtml = await loginPage.text();
  assert.match(loginHtml, /data-page="login"/);
  assert.doesNotMatch(loginHtml, /Synthetic Patient|Synthetic test record/);

  for (const [method, route, body] of [
    ["GET", "/api/admin/appointments"],
    ["GET", `/api/admin/appointments/${firstId}`],
    ["PATCH", `/api/admin/appointments/${firstId}`, { status: "confirmed" }],
    ["PATCH", `/api/admin/appointments/${firstId}`, { status: "cancelled" }],
    ["DELETE", `/api/admin/appointments/${firstId}`],
  ]) {
    const response = await request(route, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    assert.equal(response.status, 401, `${method} ${route} must require administrator authentication`);
  }
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM appointments").get().n, 2);

  const originalSessionCookie = browserCookie;
  await getCsrf();
  const unauthorizedName = await request("/api/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
    body: JSON.stringify({ username: "unknown-owner", password: testPassword }),
  });
  const unknownError = await unauthorizedName.json();
  assert.equal(unauthorizedName.status, 401);
  assert.deepEqual(unknownError, { error: { code: "AUTHENTICATION_FAILED", field: null } });
  const wrongPassword = await request("/api/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
    body: JSON.stringify({ username: testUsername, password: "incorrect-test-password" }),
  });
  assert.equal(wrongPassword.status, 401);
  assert.deepEqual(await wrongPassword.json(), unknownError);

  const noCsrf = await request("/api/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: testUsername, password: testPassword }),
  });
  assert.equal(noCsrf.status, 403);
  assert.deepEqual(await noCsrf.json(), { error: { code: "CSRF_REJECTED", field: null } });
  const crossOrigin = await request("/api/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken, Origin: "https://attacker.invalid" },
    body: JSON.stringify({ username: testUsername, password: testPassword }),
  });
  assert.equal(crossOrigin.status, 403);

  const login = await request("/api/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
    body: JSON.stringify({ username: " SYNTHETIC-OWNER ", password: testPassword }),
  });
  assert.equal(login.status, 200);
  const loginResult = await login.json();
  csrfToken = loginResult.csrfToken;
  assert.deepEqual(loginResult.administrator, { username: testUsername });
  assert.notEqual(browserCookie, originalSessionCookie, "login regenerates the session identifier");
  assert.match(login.headers.get("set-cookie"), /HttpOnly/i);
  assert.match(login.headers.get("set-cookie"), /SameSite=Lax/i);
  assert.doesNotMatch(login.headers.get("set-cookie"), /Secure/i, "test mode does not set production-only Secure cookie flag");

  const listed = await request("/api/admin/appointments?status=pending&page=1&limit=1");
  assert.equal(listed.status, 200);
  const listData = await listed.json();
  assert.equal(listData.appointments.length, 1);
  assert.equal(listData.pagination.total, 2);
  assert.deepEqual(listData.summary, { total: 2, pending: 2, confirmed: 0, cancelled: 0 });
  assert.equal(listed.headers.get("cache-control"), "no-store");
  const filtered = await request("/api/admin/appointments?search=Synthetic&service=general&status=pending");
  assert.equal(filtered.status, 200);
  assert.equal((await filtered.json()).pagination.total, 2);
  const detail = await request(`/api/admin/appointments/${firstId}`);
  assert.equal(detail.status, 200);
  assert.equal((await detail.json()).appointment.phone, "962790000111");

  const noMutationToken = await request(`/api/admin/appointments/${firstId}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "confirmed" }),
  });
  assert.equal(noMutationToken.status, 403);
  const confirmed = await request(`/api/admin/appointments/${firstId}`, {
    method: "PATCH", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
    body: JSON.stringify({ status: "confirmed" }),
  });
  assert.equal(confirmed.status, 200);
  assert.equal((await confirmed.json()).appointment.status, "confirmed");
  const cancelled = await request(`/api/admin/appointments/${firstId}`, {
    method: "PATCH", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
    body: JSON.stringify({ status: "cancelled" }),
  });
  assert.equal(cancelled.status, 200);
  assert.equal((await cancelled.json()).appointment.status, "cancelled");
  const cancelledList = await request("/api/admin/appointments?status=cancelled");
  assert.equal((await cancelledList.json()).pagination.total, 1, "cancellation preserves the appointment record");
  const restoreCancelled = await request(`/api/admin/appointments/${firstId}`, {
    method: "PATCH", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
    body: JSON.stringify({ status: "confirmed" }),
  });
  assert.equal(restoreCancelled.status, 409);
  const invalidBody = await request(`/api/admin/appointments/${secondId}`, {
    method: "PATCH", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
    body: JSON.stringify({ status: "confirmed", phone: "tampered" }),
  });
  assert.equal(invalidBody.status, 400);
  const deleteFirst = await request(`/api/admin/appointments/${firstId}`, {
    method: "DELETE", headers: { "X-CSRF-Token": csrfToken },
  });
  assert.equal(deleteFirst.status, 204);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM appointments WHERE id = ?").get(firstId).n, 0);
  const confirmedSecond = await request(`/api/admin/appointments/${secondId}`, {
    method: "PATCH", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
    body: JSON.stringify({ status: "confirmed" }),
  });
  assert.equal(confirmedSecond.status, 200);

  const languageJs = fs.readFileSync(path.join(projectRoot, "js/admin.js"), "utf8");
  assert.match(languageJs, /ar:\s*\{/);
  assert.match(languageJs, /en:\s*\{/);
  assert.match(languageJs, /document\.documentElement\.dir/);
  const protectedPage = await request("/admin");
  assert.equal(protectedPage.status, 200);
  assert.match(await protectedPage.text(), /id="appointment-list"/);

  const logout = await request("/api/auth/logout", { method: "POST", headers: { "X-CSRF-Token": csrfToken } });
  assert.equal(logout.status, 204);
  const afterLogout = await request("/api/auth/session");
  assert.equal(afterLogout.status, 401);
  assert.equal((await request("/admin")).status, 303);

  await getCsrf();
  const secondLogin = await request("/api/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
    body: JSON.stringify({ username: testUsername, password: testPassword }),
  });
  assert.equal(secondLogin.status, 200);
  csrfToken = (await secondLogin.json()).csrfToken;
  const currentSessionId = decodeURIComponent(browserCookie.slice("clinic.sid=".length)).slice(2).split(".")[0];
  db.prepare("UPDATE sessions SET expires_at = 0 WHERE sid = ?").run(currentSessionId);
  const expired = await request("/api/auth/session");
  assert.equal(expired.status, 401);
  await getCsrf();

  for (let attempts = 0; attempts < 2; attempts += 1) {
    const failed = await request("/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
      body: JSON.stringify({ username: "unknown-owner", password: testPassword }),
    });
    assert.equal(failed.status, 401);
  }
  const rateLimited = await request("/api/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
    body: JSON.stringify({ username: testUsername, password: testPassword }),
  });
  assert.equal(rateLimited.status, 429);
  assert.deepEqual(await rateLimited.json(), { error: { code: "AUTHENTICATION_FAILED", field: null } });

  const privateDatabase = spawnSync(process.execPath, ["-e", "const db=require('./server/db/database'); console.log(db.prepare('SELECT COUNT(*) AS count FROM appointments').get().count); db.close()"], {
    cwd: projectRoot,
    env: { ...process.env, APPOINTMENTS_DB_PATH: databasePath, NO_COLOR: "1" }, encoding: "utf8",
  });
  assert.equal(privateDatabase.status, 0, privateDatabase.stderr);
  assert.equal(privateDatabase.stdout.replace(/\u001b\[[0-9;]*m/g, "").trim().split("\n").at(-1), "1", "records remain persisted for a fresh process");

  const productionCheck = spawnSync(process.execPath, ["-e", "const app=require('./server/app'); console.log(JSON.stringify(app.locals.sessionCookie)); require('./server/db/database').close()"], {
    cwd: projectRoot,
    env: { ...process.env, APPOINTMENTS_DB_PATH: databasePath, NODE_ENV: "production", SESSION_SECRET: "production-test-secret-with-at-least-32-bytes", TRUST_PROXY: "loopback" },
    encoding: "utf8",
  });
  assert.equal(productionCheck.status, 0, productionCheck.stderr);
  const productionCookie = JSON.parse(productionCheck.stdout.trim().split("\n").at(-1));
  assert.equal(productionCookie.secure, true);
  assert.equal(productionCookie.httpOnly, true);
  assert.equal(productionCookie.sameSite, "lax");

  const backupEnv = { ...process.env, APPOINTMENTS_DB_PATH: databasePath, BACKUP_DIR: backupDirectory };
  const createBackup = spawnSync(process.execPath, ["server/cli/backup.js", "create"], { cwd: projectRoot, env: backupEnv, encoding: "utf8" });
  assert.equal(createBackup.status, 0, createBackup.stderr);
  const backupFile = fs.readdirSync(backupDirectory).find((file) => file.endsWith(".sqlite"));
  assert.ok(backupFile);
  const backupPath = path.join(backupDirectory, backupFile);
  const verifyBackup = spawnSync(process.execPath, ["server/cli/backup.js", "verify", "--file", backupPath], { cwd: projectRoot, env: backupEnv, encoding: "utf8" });
  assert.equal(verifyBackup.status, 0, verifyBackup.stderr);
  assert.match(verifyBackup.stdout, /integrity check passed/);
  const restorePath = path.join(testDirectory, "restored.sqlite");
  const restore = spawnSync(process.execPath, ["server/cli/backup.js", "restore", "--file", backupPath, "--destination", restorePath, "--confirm"], { cwd: projectRoot, env: backupEnv, encoding: "utf8" });
  assert.equal(restore.status, 0, restore.stderr);
  const Database = require("better-sqlite3");
  const restoredDb = new Database(restorePath, { readonly: true });
  assert.equal(restoredDb.prepare("SELECT COUNT(*) AS n FROM appointments").get().n, 1);
  assert.equal(restoredDb.prepare("SELECT COUNT(*) AS n FROM administrators").get().n, 1);
  restoredDb.close();
  const refusal = spawnSync(process.execPath, ["server/cli/backup.js", "restore", "--file", backupPath, "--destination", restorePath, "--confirm"], { cwd: projectRoot, env: backupEnv, encoding: "utf8" });
  assert.notEqual(refusal.status, 0, "restore must not overwrite an existing destination");
});

test("production refuses an absent or weak session secret before serving", () => {
  const result = spawnSync(process.execPath, ["-e", "require('./server/app')"], {
    cwd: projectRoot,
    env: { ...process.env, NODE_ENV: "production", SESSION_SECRET: "short", APPOINTMENTS_DB_PATH: path.join(testDirectory, "weak-secret.sqlite") },
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /SESSION_SECRET must contain at least 32 bytes/);
});
