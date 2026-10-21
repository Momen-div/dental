
const express = require("express");
const path = require("node:path");
const crypto = require("node:crypto");
const session = require("express-session");
const db = require("./db/database");
const appointmentsRouter = require("./routes/appointments");
const authRouter = require("./routes/auth");
const adminAppointmentsRouter = require("./routes/admin-appointments");
const SQLiteSessionStore = require("./auth/sqlite-session-store");
const { isAdministrator } = require("./auth/security");

const app = express();
app.disable("x-powered-by");
if (process.env.TRUST_PROXY) app.set("trust proxy", process.env.TRUST_PROXY);
const PORT = process.env.PORT || 3000;
const projectRoot = path.join(__dirname, "..");

if (process.env.NODE_ENV === "production") {
  if (!process.env.SESSION_SECRET || Buffer.byteLength(process.env.SESSION_SECRET) < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 bytes in production.");
  }
} else if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = crypto.randomBytes(48).toString("base64url");
}

app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production" && req.secure) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000");
  }
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' https://images.unsplash.com data:; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; frame-src https://www.google.com https://maps.google.com; form-action 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'"
  );
  next();
});

app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production" && !req.secure && req.path !== "/api/health") {
    return res.status(426).json({ error: { code: "HTTPS_REQUIRED", field: null } });
  }
  return next();
});

const sessionCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 8 * 60 * 60 * 1000,
  path: "/",
};
app.locals.sessionCookie = sessionCookie;

app.use(session({
  name: "clinic.sid",
  secret: process.env.SESSION_SECRET,
  store: new SQLiteSessionStore(),
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: sessionCookie,
}));

app.use("/api", express.json({ limit: "10kb", strict: false }));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: db.open ? "connected" : "disconnected",
  });
});

app.post("/api/appointments", (req, res, next) => {
  if (!req.is("application/json")) {
    return res.status(415).json({ error: { code: "UNSUPPORTED_MEDIA_TYPE", field: null } });
  }
  return next();
});

app.use("/api/appointments", appointmentsRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin/appointments", adminAppointmentsRouter);

app.use("/api", (req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", field: null } });
});

// Serve only site assets; never expose source, dependencies, tests, or private data.
for (const directory of ["assets", "css", "js"]) {
  app.use(`/${directory}`, express.static(path.join(projectRoot, directory), { dotfiles: "deny" }));
}

app.get(["/", "/index.html"], (req, res, next) => {
  res.sendFile(path.join(projectRoot, "index.html"), (error) => {
    if (error) next(error);
  });
});

app.get("/admin/login", (req, res) => {
  if (isAdministrator(req)) return res.redirect(303, "/admin");
  return res.sendFile(path.join(projectRoot, "admin", "login.html"));
});

app.get("/admin", (req, res) => {
  if (!isAdministrator(req)) return res.redirect(303, "/admin/login");
  res.set("Cache-Control", "no-store");
  return res.sendFile(path.join(projectRoot, "admin", "dashboard.html"));
});

app.use("/data", (req, res) => res.sendStatus(404));

app.use((error, req, res, next) => {
  if (!req.path.startsWith("/api/")) return next(error);

  const isMalformedJson = error.type === "entity.parse.failed";
  const isPayloadTooLarge = error.type === "entity.too.large";
  const status = isMalformedJson ? 400 : isPayloadTooLarge ? 413 : 500;
  const code = isMalformedJson
    ? "MALFORMED_JSON"
    : isPayloadTooLarge
      ? "PAYLOAD_TOO_LARGE"
      : "INTERNAL_SERVER_ERROR";

  res.status(status).json({ error: { code, field: null } });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
