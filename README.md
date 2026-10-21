# Dental Clinic Website

A responsive single-page website using semantic HTML, CSS, vanilla JavaScript modules, Arabic-first copy, and English language switching. Express serves the public site and appointment API together. No frontend build step is used.

## Requirements and local setup

- Node.js 22 or later and npm (required by the installed `better-sqlite3` package).
- From the project root, install locked packages with `npm ci` (use `npm install` when changing dependencies).
- Start the server with `npm start` and open `http://localhost:3000`.
- For development auto-restart on Node 22+, use `npm run dev` (built-in `node --watch`).
- Run tests with `npm test`. Tests use isolated temporary databases under `data/*-test-*` and remove only their own directories.

The server creates `data/appointments.db` on first startup and applies additive `CREATE TABLE/INDEX IF NOT EXISTS` schema initialization without deleting existing appointments. SQLite runs in WAL mode with foreign keys and a busy timeout. Database and session records are in the same SQLite database; the OS process umask and database file mode restrict new artifacts. The `data/` directory and all private server files are not served by Express.

## Configuration

Deployment-specific values can be provided through environment variables:

- `PORT` selects the HTTP listening port (default `3000`).
- `APPOINTMENTS_DB_PATH` selects an absolute or relative SQLite database path. It must be inside `data/` or outside the project directory; startup rejects paths elsewhere inside the project. The default is `data/appointments.db`.
- `SESSION_SECRET` is required in production and must contain at least 32 bytes of cryptographically random material. Generate one with `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`. Development uses a fresh ephemeral secret when unset, so development sessions do not survive restarts.
- `NODE_ENV=production` enables `Secure` cookies, requires HTTPS, and adds HSTS for requests the app knows are HTTPS.
- `TRUST_PROXY` is optional. Set only the exact proxy hop count/address required by the real host; the app does not trust proxies by default.
- `BACKUP_DIR` selects a private directory for local SQLite online backups (default `data/backups`). `BACKUP_RETENTION_DAYS` controls local backup retention (default 30; allowed 1–3650 days).

See [.env.example](.env.example) for variable names and placeholders only. Do not commit `.env` or real secrets.

Clinic-specific content is in [js/config.js](js/config.js): clinic name, contact details, map URL, illustrative images, dentist placeholder text, social links, and service-card images/icons. Booking service IDs, opening weekdays, available times, and timezone are defined in [js/booking-rules.js](js/booking-rules.js); corresponding Arabic/English labels and page copy are in [js/translations.js](js/translations.js). Verify actual services, working days, times, imagery rights, contact details, and any dentist credentials before publication. Current business identity/contact details are placeholders; no clinic credentials, prices, or testimonials are asserted.

## Implemented behavior

- `POST /api/appointments` accepts a JSON appointment request, validates it server-side, and stores it with `pending` status. This is a request, not an automatically confirmed appointment.
- The database prevents two active (`pending` or `confirmed`) appointments from using the same date/time, including concurrent submissions.
- `GET /api/health` returns service/database status.
- `GET /api/auth/csrf` is public and issues an anonymous-session CSRF token; it does not expose appointment data. `POST /api/auth/login` is public, rate-limited, CSRF-protected, and always returns a generic authentication failure for invalid credentials. `GET /api/auth/session` and `POST /api/auth/logout` require a live administrator session (logout also requires CSRF).
- All `/api/admin/appointments` endpoints require an administrator session. `GET /api/admin/appointments` lists/filter/searches appointments and summary counts; `GET /api/admin/appointments/:id` returns private details; `PATCH /api/admin/appointments/:id` confirms or cancels a record; `DELETE /api/admin/appointments/:id` permanently deletes it. Cancellation is a status change and preserves the record. Every state-changing admin API call requires the session CSRF token in `X-CSRF-Token`.
- `/admin/login` serves the bilingual sign-in page. `/admin` returns the dashboard HTML only after server-side authorization; no private patient data is embedded in the page. API routes independently enforce access control.
- There is no public registration endpoint. Passwords are hashed with bcrypt cost 12; accepted passwords are 12–128 characters and at most 72 UTF-8 bytes (bcrypt's input limit). Sessions use `express-session` and the SQLite session table rather than MemoryStore. The cookie is `HttpOnly`, `SameSite=Lax`, eight-hour rolling idle expiry, and `Secure` in production. Login regenerates the session ID; password reset deletes all active sessions.
- The contact message form is a local demo: it validates locally and does not send or store the message.
- Public static content is limited to `index.html` and the `assets/`, `css/`, and `js/` directories, with explicit admin-page routes. API errors use safe JSON error codes; common statuses include 400 validation, 401 unauthenticated, 403 CSRF/permission, 409 slot/status conflict, 413 oversized body, and 415 unsupported content type. Same-origin deployment is assumed; CORS is not enabled.

### Administrator provisioning and reset

Run provisioning interactively on a trusted machine connected to the target database/volume. The password is read without terminal echo and is never placed in shell history or output:

```sh
npm run admin:create -- --username clinic-owner
```

Choose a non-identifying username or the actual clinic-owned email address; none is pre-created. The command only creates the first administrator and fails if any administrator already exists. Use a password manager to generate/store a unique passphrase. To reset the existing account password and revoke every active session:

```sh
npm run admin:set-password -- --username clinic-owner
```

For a remote persistent volume, execute the command through the host's secure one-off job/console with `APPOINTMENTS_DB_PATH` and `SESSION_SECRET` set to the production values. Protect console access; do not put passwords in command arguments or environment variables.

### SQLite backups and recovery

Create uses better-sqlite3's SQLite online backup API, so committed appointment, administrator, and session state is copied consistently while WAL is active. Local backups are private and pruned by `BACKUP_RETENTION_DAYS`; this does not configure an off-site destination or scheduler.

```sh
npm run backup
npm run backup:verify -- --file /private/clinic-backups/clinic-backup-YYYY-MM-DDTHH-MM-SS-SSSZ.sqlite
npm run backup:restore -- --file /private/clinic-backups/clinic-backup-YYYY-MM-DDTHH-MM-SS-SSSZ.sqlite --destination /private/clinic-restore/appointments-review.sqlite --confirm
```

Set `BACKUP_DIR` before `npm run backup` to choose the backup directory. A restore always requires `--confirm`, a separate new `--destination`, integrity verification, and will not overwrite the configured live DB or any existing file. Review the restored database, stop the service, take a fresh backup, and explicitly point `APPOINTMENTS_DB_PATH` at the reviewed file before bringing it online. Never copy only the main `.db` file while the app is live in WAL mode. Never commit backups. Suggested operational policy: run a nightly backup; retain at least 30 daily copies and monthly copies according to clinic/legal retention needs; use encrypted host snapshots or an independently administered off-site bucket with access controls, lifecycle/retention, and restore drills. Configure and verify that scheduler and off-site destination on the selected provider—this repository cannot claim they already exist.

The tests create, integrity-check, restore to a separate path, and inspect synthetic records in an isolated temporary database. They never use the default database.

## Project structure

```text
index.html                 Arabic-first page and forms
assets/icons/              Favicon
css/style.css              Theme and global styles
css/components.css         Page sections and components
css/responsive.css         Responsive and reduced-motion rules
js/main.js                 Page initialization and rendering
js/config.js               Clinic-specific presentation settings
js/booking-rules.js        Shared browser/CommonJS booking rules
js/translations.js         Arabic/English copy
js/language.js             Localization and language persistence
js/navigation.js           Mobile menu and keyboard handling
js/gallery.js              Lightbox and image fallbacks
js/forms.js                Form validation and appointment submission
server/app.js              Express app, API errors, security headers, static routes
server/routes/appointments.js Appointment validation and inserts
server/routes/auth.js      Login, logout, CSRF, and session identity routes
server/routes/admin-appointments.js Protected appointment management APIs
server/auth/                Password verification and SQLite session store
server/cli/admin.js         Interactive one-time account provisioning/reset
server/cli/backup.js        Online SQLite backup, verification, and guarded restore
admin/                      Login and authenticated dashboard HTML
js/admin.js                 Bilingual login/dashboard behavior
css/admin.css               Responsive admin styles
server/db/database.js      SQLite initialization and indexes
test/appointments.test.cjs Public API, rules, and static-file regression tests
test/admin.test.cjs         Isolated admin auth, access, session, and backup tests
data/                      Private runtime database files (not served or committed)
```

## Production deployment checklist

Use a Node.js 22+ host that supports a persistent disk/volume, environment variables, HTTPS termination, and one-off administrative commands. Configure a single app instance for SQLite writes unless the host provides reliable single-writer coordination: SQLite on local persistent disk is not a safe shared database across independently mounted instances/regions. If horizontal scaling, multi-region access, or host volume durability/locking is uncertain, use a managed PostgreSQL service with a planned migration and tested data copy rather than assuming SQLite persistence.

1. Provision the host app and attach a durable volume mounted outside the web root (for example `/mnt/clinic-data`). Set `APPOINTMENTS_DB_PATH=/mnt/clinic-data/appointments.db`. Confirm the service user can write there and the volume survives a redeploy/restart. Do not use an ephemeral filesystem.
2. Set `NODE_ENV=production`, `SESSION_SECRET` (random 48-byte generated value), `APPOINTMENTS_DB_PATH`, `BACKUP_DIR` (prefer a separate persistent volume), and `BACKUP_RETENTION_DAYS`. Set `PORT` only if required by the platform. Set `TRUST_PROXY` only to the platform-documented proxy boundary; never use a broad trust value without validating the topology.
3. Point the domain's DNS records to the host. Configure the platform's managed certificate/HTTPS and HTTP-to-HTTPS redirect. The app requires secure requests in production (except health check), sets Secure cookies and HSTS for trusted HTTPS requests. Without correct proxy configuration, forwarded HTTPS may not be recognized.
4. Build/install and start exactly with `npm ci` and `npm start` (there is no frontend build step). Configure the provider health check as `GET /api/health` and the start command as `npm start`.
5. Before switching traffic, create a backup of any existing SQLite database using the online backup command; mount/copy it safely and set `APPOINTMENTS_DB_PATH` to the existing database so additive initialization preserves records. Do not initialize against an empty path if preserving production appointments is required.
6. Run the one-time `admin:create` command from the trusted host console/one-off job against the production volume, then validate `/admin/login`, login, logout, admin API authorization, and a synthetic booking before collecting real patient data.
7. Configure a provider scheduler/cron job to run `npm run backup` regularly with the production environment and securely copy/encrypt backups to an independently administered off-host destination. Set alerting, retention, and restore drills; verify this independently because no provider or scheduler is configured here.
8. Review the clinic's lawful basis/privacy notice, patient-data retention and deletion process, access-control/incident procedures, business hours/services, verified identity/contact details, map and credentials before public launch.

No hosting provider, durable volume, DNS record, HTTPS certificate, secret, off-site backup destination, or scheduler has been configured or verified in this repository. A durable single-host SQLite volume is only as resilient as that host/provider's storage guarantees; backups are essential.

### Security limitations

Login attempts and anonymous CSRF session creation are rate-limited per process using the middleware's default in-memory limiter. Limits reset on restart and are not coordinated across multiple instances; a scaled deployment should configure a shared rate-limit store and ensure the proxy's client IP is trustworthy. The session store is SQLite-backed and persistent, but a single SQLite file needs a single-writer deployment. HTTPS/TLS termination, domain/DNS, backup scheduling, encrypted off-site storage, monitoring, secret rotation, privacy/legal review, and disaster recovery configuration are hosting/operator responsibilities. No absolute security guarantee is implied. Review the CSP if changing third-party assets and do not deploy until real clinic identity/contact information and privacy notices are verified.

Google Fonts, Unsplash images, and the demonstration Google Maps embed make external requests and may fail when offline or blocked. Replace demonstration map/contact details and stock imagery with approved clinic-specific information before launch.
