const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { after, before, test } = require("node:test");
const bookingRules = require("../js/booking-rules");

const dataDirectory = path.resolve(__dirname, "../data");
const developmentDatabasePath = path.join(dataDirectory, "appointments.db");
fs.mkdirSync(dataDirectory, { recursive: true });
const testDirectory = fs.mkdtempSync(path.join(dataDirectory, "api-test-"));
const testDatabasePath = path.join(testDirectory, "appointments.db");

if (
  testDatabasePath === developmentDatabasePath
  || path.dirname(testDatabasePath) !== testDirectory
  || path.dirname(testDirectory) !== dataDirectory
  || !path.basename(testDirectory).startsWith("api-test-")
) {
  throw new Error("Refusing to run API tests without an isolated database path.");
}

process.env.APPOINTMENTS_DB_PATH = testDatabasePath;

let db;
let server;
let origin;

after(async () => {
  if (server?.listening) {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }

  db?.close();

  const resolvedTestDirectory = path.resolve(testDirectory);
  if (
    path.dirname(resolvedTestDirectory) !== dataDirectory
    || !path.basename(resolvedTestDirectory).startsWith("api-test-")
    || testDatabasePath === developmentDatabasePath
  ) {
    throw new Error("Refusing to clean up a directory outside this test's database folder.");
  }

  fs.rmSync(resolvedTestDirectory, { recursive: true, force: true });
});

const app = require("../server/app");
db = require("../server/db/database");
server = http.createServer(app);

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

function jordanToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Amman",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts.filter(({ type }) => type !== "literal").map(({ type, value }) => [type, value])
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function dateForWeekday(targetWeekday, startDate = jordanToday()) {
  const date = new Date(`${startDate}T00:00:00.000Z`);
  for (let offset = 1; offset <= 14; offset += 1) {
    const candidate = new Date(date);
    candidate.setUTCDate(candidate.getUTCDate() + offset);
    if (candidate.getUTCDay() === targetWeekday) {
      return candidate.toISOString().slice(0, 10);
    }
  }
  throw new Error(`Unable to find a future weekday ${targetWeekday}.`);
}

function yesterdayInJordan() {
  const date = new Date(`${jordanToday()}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

const validAppointment = {
  name: "Test Patient",
  phone: "+962 7 9000 0000",
  email: "test@example.com",
  service: "general",
  date: dateForWeekday(1),
  time: "09:00",
  message: "Isolated API test",
};

test("Amman date rules cover fixed today, yesterday, invalid, and closed dates", async (t) => {
  const fixedToday = "2026-10-19";
  const openingDays = [0, 1, 2, 3, 4, 6];

  await t.test("clinic date changes at the Amman midnight boundary", () => {
    assert.equal(bookingRules.getClinicDate(new Date("2026-10-18T20:59:59.000Z")), "2026-10-18");
    assert.equal(bookingRules.getClinicDate(new Date("2026-10-18T21:00:00.000Z")), "2026-10-19");
  });

  await t.test("today is allowed", () => {
    assert.equal(bookingRules.getDateError(fixedToday, fixedToday, openingDays), null);
  });

  await t.test("yesterday is rejected", () => {
    assert.equal(bookingRules.getDateError("2026-10-18", fixedToday, openingDays), "pastDate");
  });

  await t.test("impossible dates are rejected", () => {
    assert.equal(bookingRules.getDateError("2026-02-30", fixedToday, openingDays), "invalidDate");
  });

  await t.test("closed weekdays are rejected", () => {
    assert.equal(bookingRules.getDateError("2026-10-23", fixedToday, openingDays), "closedWeekday");
  });
});

test("frontend booking options match shared API rules and translations", async () => {
  globalThis.DentalBookingRules = bookingRules;
  const configSource = fs.readFileSync(path.resolve(__dirname, "../js/config.js"), "utf8");
  const translationsSource = fs.readFileSync(path.resolve(__dirname, "../js/translations.js"), "utf8");
  const configModule = await import(`data:text/javascript;base64,${Buffer.from(configSource).toString("base64")}`);
  const translationsModule = await import(`data:text/javascript;base64,${Buffer.from(translationsSource).toString("base64")}`);
  const clinicConfig = configModule.default;
  const translations = translationsModule.default;

  assert.deepEqual(clinicConfig.booking.services, bookingRules.services);
  assert.deepEqual(clinicConfig.booking.openingDays, bookingRules.openingDays);
  assert.deepEqual(clinicConfig.booking.availableTimes, bookingRules.availableTimes);
  assert.deepEqual(Object.keys(clinicConfig.services).sort(), [...bookingRules.services].sort());
  for (const language of ["ar", "en"]) {
    assert.deepEqual(Object.keys(translations[language].serviceNames).sort(), [...bookingRules.services].sort());
    assert.deepEqual(Object.keys(translations[language].timeLabels).sort(), [...bookingRules.availableTimes].sort());
  }
});

test("frontend and API share phone and email validation rules", () => {
  assert.equal(bookingRules.isValidPhone("+٩٦٢ ٧ ٩٠٠٠ ٠٠٠٠"), true);
  assert.equal(bookingRules.isValidPhone("123"), false);
  assert.equal(bookingRules.isValidEmail("patient@example.com"), true);
  assert.equal(bookingRules.isValidEmail("not-an-email"), false);
});

test("Arabic and English translation keys are complete and aligned", async () => {
  const source = fs.readFileSync(path.resolve(__dirname, "../js/translations.js"), "utf8");
  const { default: translations } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
  assert.deepEqual(Object.keys(translations.ar).sort(), Object.keys(translations.en).sort());
  assert.deepEqual(Object.keys(translations.ar.serviceNames).sort(), Object.keys(translations.en.serviceNames).sort());
  assert.deepEqual(Object.keys(translations.ar.timeLabels).sort(), Object.keys(translations.en.timeLabels).sort());
  assert.doesNotMatch(translations.ar.bookingSuccess, /ستتواصل معك|تأكيد الموعد بنجاح/);
  assert.doesNotMatch(translations.en.bookingSuccess, /will contact you|confirm the appointment/i);
  assert.doesNotMatch(translations.ar.bookingText, /تتواصل معك/);
  assert.doesNotMatch(translations.en.bookingText, /will contact you/i);
  assert.doesNotMatch(translations.ar.heroNote, /يؤكدها فريق/);
  assert.doesNotMatch(translations.en.heroNote, /confirmed by the clinic/i);
  assert.doesNotMatch(translations.ar.principleThreeText, /متابعة مباشرة/);
  assert.doesNotMatch(translations.en.principleThreeText, /followed up directly/i);
});

test("frontend response parser accepts JSON and safely rejects empty or non-JSON bodies", async () => {
  const formsSource = fs.readFileSync(path.resolve(__dirname, "../js/forms.js"), "utf8");
  const formsModule = await import(`data:text/javascript;base64,${Buffer.from(formsSource).toString("base64")}`);
  const { readJsonResponse } = formsModule;

  assert.deepEqual(
    await readJsonResponse(new Response('{"status":"pending"}', {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    })),
    { status: "pending" }
  );
  assert.equal(await readJsonResponse(new Response("", {
    headers: { "Content-Type": "application/json" },
  })), null);
  assert.equal(await readJsonResponse(new Response("not json", {
    headers: { "Content-Type": "application/json" },
  })), null);
  assert.equal(await readJsonResponse(new Response("<html>error</html>", {
    headers: { "Content-Type": "text/html" },
  })), null);
  assert.equal(await readJsonResponse(new Response(null, { status: 204 })), null);
});

async function postAppointment(payload) {
  return fetch(`${origin}/api/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

test("health endpoint reports the isolated database", async () => {
  const response = await fetch(`${origin}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok", database: "connected" });
});

test("valid requests are stored and duplicate active slots are rejected", async () => {
  const response = await postAppointment(validAppointment);
  assert.equal(response.status, 201);
  const result = await response.json();
  assert.equal(result.status, "pending");

  const row = db.prepare("SELECT * FROM appointments WHERE id = ?").get(result.appointmentId);
  assert.equal(row.patient_name, validAppointment.name);
  assert.equal(row.phone, "962790000000");
  assert.equal(row.status, "pending");

  const duplicate = await postAppointment(validAppointment);
  assert.equal(duplicate.status, 409);
});

test("invalid appointment fields return 400", async (t) => {
  const invalidCases = [
    ["name", { name: " " }, "NAME_REQUIRED", "name"],
    ["long name", { name: "n".repeat(101) }, "NAME_TOO_LONG", "name"],
    ["phone", { phone: "123" }, "PHONE_INVALID", "phone"],
    ["email", { email: "not-an-email" }, "EMAIL_INVALID", "email"],
    ["non-string email", { email: 42 }, "EMAIL_INVALID", "email"],
    ["service", { service: "not-a-service" }, "SERVICE_INVALID", "service"],
    ["date", { date: "2026-02-30" }, "DATE_INVALID", "date"],
    ["past date", { date: yesterdayInJordan() }, "DATE_PAST", "date"],
    ["weekday", { date: dateForWeekday(5) }, "CLOSED_WEEKDAY", "date"],
    ["time", { time: "13:00" }, "TIME_INVALID", "time"],
    ["long message", { message: "x".repeat(501) }, "MESSAGE_TOO_LONG", "message"],
    ["non-string message", { message: { text: "not a string" } }, "MESSAGE_INVALID", "message"],
  ];

  for (const [field, override, code, fieldName] of invalidCases) {
    await t.test(field, async () => {
      const response = await postAppointment({ ...validAppointment, ...override });
      assert.equal(response.status, 400);
      assert.match(response.headers.get("content-type"), /application\/json/);
      assert.deepEqual(await response.json(), { error: { code, field: fieldName } });
    });
  }
});

test("malformed JSON and unknown API paths return structured JSON errors", async () => {
  const malformedResponse = await fetch(`${origin}/api/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{broken",
  });
  assert.equal(malformedResponse.status, 400);
  assert.match(malformedResponse.headers.get("content-type"), /application\/json/);
  assert.deepEqual(await malformedResponse.json(), {
    error: { code: "MALFORMED_JSON", field: null },
  });

  const missingResponse = await fetch(`${origin}/api/not-a-route`);
  assert.equal(missingResponse.status, 404);
  assert.match(missingResponse.headers.get("content-type"), /application\/json/);
  assert.deepEqual(await missingResponse.json(), {
    error: { code: "NOT_FOUND", field: null },
  });
});

test("API rejects invalid body shapes, unsupported content types, and oversized JSON", async (t) => {
  await t.test("null JSON body", async () => {
    const response = await fetch(`${origin}/api/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "null",
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: { code: "INVALID_BODY", field: null } });
  });

  await t.test("array JSON body", async () => {
    const response = await postAppointment([]);
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: { code: "INVALID_BODY", field: null } });
  });

  await t.test("unsupported content type", async () => {
    const response = await fetch(`${origin}/api/appointments`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "appointment",
    });
    assert.equal(response.status, 415);
    assert.deepEqual(await response.json(), { error: { code: "UNSUPPORTED_MEDIA_TYPE", field: null } });
  });

  await t.test("oversized JSON", async () => {
    const response = await postAppointment({ notes: "x".repeat(11_000) });
    assert.equal(response.status, 413);
    assert.deepEqual(await response.json(), { error: { code: "PAYLOAD_TOO_LARGE", field: null } });
  });
});

test("simultaneous requests cannot reserve the same active slot twice", async () => {
  const payload = { ...validAppointment, date: dateForWeekday(2), time: "11:00" };
  const responses = await Promise.all([postAppointment(payload), postAppointment(payload)]);
  assert.deepEqual(responses.map(({ status }) => status).sort(), [201, 409]);
});

test("database, WAL, and SHM artifacts are inaccessible over HTTP", async () => {
  const artifactPaths = [testDatabasePath, `${testDatabasePath}-wal`, `${testDatabasePath}-shm`];
  for (const artifactPath of artifactPaths) {
    assert.ok(fs.existsSync(artifactPath), `Expected isolated artifact ${path.basename(artifactPath)}`);
  }

  const requestPaths = [
    `/data/${path.basename(testDirectory)}/appointments.db`,
    `/data/${path.basename(testDirectory)}/appointments.db-wal`,
    `/data/${path.basename(testDirectory)}/appointments.db-shm`,
  ];

  for (const requestPath of requestPaths) {
    const response = await fetch(`${origin}${requestPath}`);
    assert.equal(response.status, 404, `${requestPath} should not be public`);
  }
});

test("server does not expose private project files and sends baseline security headers", async () => {
  const privatePaths = [
    "/server/app.js",
    "/test/appointments.test.cjs",
    "/node_modules/express/package.json",
    "/package.json",
    "/package-lock.json",
    "/README.md",
    "/.env",
  ];
  for (const requestPath of privatePaths) {
    const response = await fetch(`${origin}${requestPath}`);
    assert.equal(response.status, 404, `${requestPath} must not be served`);
  }

  const response = await fetch(origin);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.match(response.headers.get("content-security-policy"), /default-src 'self'/);
});

test("database cannot be configured in public assets or other project files", () => {
  const publicDatabasePath = path.resolve(__dirname, "../js", `.database-guard-${process.pid}.sqlite`);
  assert.equal(fs.existsSync(publicDatabasePath), false);

  const result = spawnSync(process.execPath, ["-e", "require('./server/db/database')"], {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, APPOINTMENTS_DB_PATH: publicDatabasePath },
    encoding: "utf8",
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must be inside data\/ or outside the project directory/);
  assert.equal(fs.existsSync(publicDatabasePath), false);

  const projectRootDatabaseDirectory = path.resolve(__dirname, "..", `.database-guard-${process.pid}`);
  assert.equal(fs.existsSync(projectRootDatabaseDirectory), false);
  const projectRootResult = spawnSync(process.execPath, ["-e", "require('./server/db/database')"], {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, APPOINTMENTS_DB_PATH: path.join(projectRootDatabaseDirectory, "appointments.sqlite") },
    encoding: "utf8",
  });
  assert.notEqual(projectRootResult.status, 0);
  assert.match(projectRootResult.stderr, /must be inside data\/ or outside the project directory/);
  assert.equal(fs.existsSync(projectRootDatabaseDirectory), false);

  const symlinkPath = path.join(testDirectory, `public-assets-link-${process.pid}`);
  const symlinkDatabasePath = path.join(symlinkPath, `.database-guard-${process.pid}.sqlite`);
  assert.equal(fs.existsSync(symlinkDatabasePath), false);
  fs.symlinkSync(path.resolve(__dirname, "../js"), symlinkPath, "dir");
  try {
    const symlinkResult = spawnSync(process.execPath, ["-e", "require('./server/db/database')"], {
      cwd: path.resolve(__dirname, ".."),
      env: { ...process.env, APPOINTMENTS_DB_PATH: symlinkDatabasePath },
      encoding: "utf8",
    });
    assert.notEqual(symlinkResult.status, 0);
    assert.match(symlinkResult.stderr, /must be inside data\/ or outside the project directory/);
    assert.equal(fs.existsSync(symlinkDatabasePath), false);
  } finally {
    fs.unlinkSync(symlinkPath);
  }
});

test("booking copy describes submission; contact form remains demo-only", async () => {
  const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
  const translations = fs.readFileSync(path.resolve(__dirname, "../js/translations.js"), "utf8");

  assert.match(html, /data-i18n="bookingText">\s*يمكنك إرسال طلب بموعد مفضل/);
  assert.match(html, /data-i18n="contactPrivacy">/);
  assert.match(translations, /Your information will be sent to the server/);
  assert.match(translations, /this message will not be sent or received by the clinic/);
  assert.doesNotMatch(translations, /will contact you to check availability|followed up directly by the clinic team/i);
  assert.doesNotMatch(translations, /ستتواصل معك العيادة|متابعة مباشرة من فريق العيادة/);
  assert.doesNotMatch(html, /هذا نموذج تجريبي فقط؛ لا يتم حفظ الطلب/);
});