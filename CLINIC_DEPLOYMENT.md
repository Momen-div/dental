# Clinic setup and deployment

This repository remains a single-clinic template. It already keeps most site identity settings in `js/config.js`, Arabic/English copy in `js/translations.js`, booking IDs and hours in `js/booking-rules.js`, and shared brand tokens in `css/style.css`. There is no clinic profile selector or build system. The lowest-risk way to make three independent sites is to make three separate repository copies (or branches with separate checked-out deploy roots), customize each copy, and deploy each as a separate service. Do not point more than one clinic at the same writable database.

## The three prepared clinic copies

Create one independent copy/service for each clinic. No names below imply verified contact or medical information; replace every placeholder only after clinic approval.

| Copy / service label | Clinic name to configure | Verified information still required |
| --- | --- | --- |
| Wisdom | Wisdom Dental Center | Arabic/English display name, logo, licensed imagery, services, phone, WhatsApp, email, address/map, hours, domain, privacy notice, administrator |
| Moataz | Dr. Moataz Al-Sardi | Arabic/English display name, approved title/bio/qualifications, logo, licensed imagery, services, contact/location/hours, domain, privacy notice, administrator |
| Eslam | Dr. Eslam Naamneh | Arabic/English display name, approved title/bio/qualifications, logo, licensed imagery, services, contact/location/hours, domain, privacy notice, administrator |

No phone, address, hours, qualifications, pricing, or treatment claims have been invented. Current empty and illustrative values in the template must not be represented as verified clinic facts.

## Customize each copy

1. In that clinic's independent copy, edit `js/config.js`: bilingual clinic name, verified contact fields, address/hours, map embed URL, approved dentist name/title/bio, imagery, service IDs, and social URLs. The frontend already renders configured phone/email/WhatsApp links and map, services, dentist content, and images from this object.
2. Edit `js/translations.js` for the clinic-specific Arabic and English page text and service labels. Keep both languages complete. Only use the service IDs supported by the site and backend (`js/booking-rules.js`). Update `js/booking-rules.js` for that clinic's actual service IDs, opening weekdays, local timezone, and offered appointment times; verify the server-side booking tests afterward.
3. Change the existing CSS custom properties in the `:root` block of `css/style.css` for brand colors and typography. Replace the logo mark in `index.html` and favicon in `assets/icons/` if approved assets are available. Put clinic-owned or appropriately licensed optimized WebP images in `images/` and update `js/config.js`; the directory is currently empty and existing remote stock photos are illustrative only.
4. Update page title, description, Open Graph content, map and privacy copy in `index.html`/translations after details are verified. The contact inquiry form is currently frontend-only and does not deliver messages; the appointment form submits to this application's API. Do not advertise either as a different workflow unless it has been implemented and tested.
5. Deploy the copy as its own Render web service with its own persistent disk, unique `SESSION_SECRET`, `APPOINTMENTS_DB_PATH`, and administrator account. Never reuse the same database file, disk, credentials, or secrets between clinics. No production copies or deployments were created by this change.

There is no one-command profile switch: each deployment has its own source/configuration copy. This deliberately avoids a larger frontend refactor and accidental cross-clinic data/configuration sharing.

## Render and administrator access

The repository has no Render manifest and no evidence of which Render plan, environment variables, disk, or database is configured on the existing live service. The exact live login failure cannot be determined from source alone: it could be an absent administrator in Render's database, a username/password mismatch, the service opening a different/empty SQLite database, or a proxy/HTTPS/cookie configuration problem. A local `npm run admin:set-password` only targets the local process's `APPOINTMENTS_DB_PATH`; it cannot change Render's database.

Render documents that Free web services have no SSH/dashboard shell access, and persistent disks are for paid web services. Render's default filesystem is ephemeral. Therefore, the existing Free service does not provide a safe way to run this interactive CLI against a durable SQLite database, and its local database, administrator, sessions, and appointments can be lost on restart/redeploy. Do not collect real patient data on that setup. No environment-variable bootstrap was added: keeping an initial-password variable for a fresh ephemeral database would recreate credentials on restarts and would not provide durable patient or session records.

### Safe Render setup and provisioning

For the existing single-instance SQLite architecture, use a paid Render web service with a persistent disk mounted, for example, at `/var/data`. Set these independently for each service:

- `NODE_ENV=production`
- `APPOINTMENTS_DB_PATH=/var/data/appointments.db`
- `SESSION_SECRET` to a unique random secret of at least 32 bytes
- `TRUST_PROXY=1` only if the service is behind Render's documented one-hop proxy; retain the numeric value and validate the actual topology
- `BACKUP_DIR` to a private persistent path, plus an independently configured off-host backup destination/scheduler

Once the paid service is running with the disk attached, use its authorized Render Shell/SSH session (not a build/pre-deploy job, which cannot access a mounted disk) in the application directory. Confirm the environment points at the intended persistent database without printing secrets or hashes. Then run the existing interactive provision command; it prompts for the password without echo:

```sh
npm run admin:create -- --username clinic-owner
```

This creates an account only if no administrator exists and fails if one already exists. If an administrator exists but its password is unavailable, reset only after owner authorization:

```sh
npm run admin:set-password -- --username clinic-owner
```

The reset reuses bcrypt validation/hashing and invalidates all existing sessions. Never put the password in command arguments, shell history, logs, or environment variables. If the username is unknown, inspect only usernames/counts through an authorized shell; never print the `password_hash` column. After provisioning/reset, verify HTTPS `/admin/login`, a correct login, logout, and rejected invalid credentials. No live service was accessed or changed here.

If upgrading is not possible, the only safe recommendation is to keep the Render Free service as a synthetic-data demonstration and not claim durable admin access or patient-data storage. Do not weaken HTTPS, cookie, CSRF, or authentication protections to make that service appear functional.

## Storage choice and estimated Render costs

- **Small single-instance clinic, lowest migration risk:** paid web service plus its persistent disk, with SQLite in WAL mode. This matches the current application and preserves appointment/admin/session records without a code/database migration. A disk is attached to one service instance; keep one instance, accept deploy downtime associated with a persistent disk, and maintain tested off-host backups. Disk persistence does not replace backups or guarantee application-level availability.
- **Scaling, multiple instances, or stronger managed database operations:** plan a PostgreSQL migration first. It requires replacing `better-sqlite3` queries/schema initialization, SQLite-specific indexes/transactions/constraint handling and the custom SQLite session store, adding PostgreSQL schema/migrations and a PostgreSQL session store, then testing data export/import, rollback, concurrency, auth, and appointment behavior. This repository has not been migrated.

At the time this guide was written, Render's public pricing listed a low-end paid web service around **US$7/month** and SSD persistent disks at **US$0.25/GB/month**; a managed PostgreSQL plan was listed starting around **US$6/month**. These are estimates, not quotes, and can change; bandwidth, workspace, backups, disk size, tax, and higher resource plans can add costs. A Free web service has no persistent disk. Check current [Render pricing](https://render.com/pricing), [persistent disk documentation](https://render.com/docs/disks), and [SSH/shell compatibility](https://render.com/docs/ssh) before choosing a plan.

For any production service, configure HTTPS and verify forwarded-protocol handling, use a unique secret per clinic, restrict shell access, schedule encrypted off-host backups, periodically verify backups and perform restore drills, document patient-data retention/access procedures, and obtain appropriate privacy/legal review. Do not assume this template alone establishes regulatory compliance.
