# TVBS Task Manager

A small internal tool for tracking client work: what needs to be done, for
which client, assigned to which team member, and by when. When a task is
created or reassigned, the assignee gets an email with the details
automatically. Team members log in to see their tasks and mark them
complete; a daily reminder email goes out for anything due today, due
tomorrow, or overdue.

## How it's built

- **Next.js 16** (App Router, Server Actions) — one app, no separate backend.
- **SQLite** (via Drizzle ORM) — a single file database. Perfectly fine for a
  small team; no separate database service to pay for or manage.
- **Gmail SMTP** (via Nodemailer) — sends the assignment and reminder emails
  from a Gmail / Google Workspace address you control.
- **Custom login** — email + password, sessions stored in a signed cookie
  (no third-party auth service).

There's no drag-and-drop board or fancy real-time sync here — it's a
straightforward, reliable task list built specifically around "client, task,
due date, assignee, done or not."

## 1. Run it locally

```bash
npm install
cp .env.example .env
```

Open `.env` and fill in:

- `SESSION_SECRET` — any long random string. Generate one with
  `openssl rand -base64 32`.
- `CRON_SECRET` — another random string, generate the same way. This
  protects the reminder-email endpoint from being triggered by strangers.
- `GMAIL_USER` / `GMAIL_APP_PASSWORD` — see [Setting up Gmail](#2-set-up-gmail-sending)
  below. You can leave these blank while developing — emails will just be
  printed to the terminal instead of sent.

Then create the database and an initial admin login:

```bash
npm run db:migrate
npm run db:seed
```

This prints an admin email/password (defaults to `admin@tvbs.tech` /
`ChangeMe123!` unless you set `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in
`.env` first). **Log in and change this password immediately** — see
Account page after logging in.

Start the app:

```bash
npm run dev
```

Visit http://localhost:3000, log in with the seeded admin account, and:

1. Add your clients under **Clients**.
2. Add your team under **Team** — each person gets an email with a
   temporary password they use to log in.
3. Create tasks under **Tasks → New task** — pick a client, an assignee, a
   due date and priority. The assignee is emailed immediately.

Team members only see **Tasks** and **Account** (no Clients/Team
management) unless you make them an Admin.

## 2. Set up Gmail sending

Use an **App Password**, not your normal Gmail password (Google blocks
plain-password SMTP logins).

1. Go to your Google Account → **Security**.
2. Turn on **2-Step Verification** if it isn't already on (required for App
   Passwords).
3. Search for **App passwords** (or go directly to
   https://myaccount.google.com/apppasswords).
4. Create one named something like "TVBS Task Manager", copy the 16-character
   password it gives you.
5. Set in `.env` (or your host's environment variables):
   ```
   GMAIL_USER=tvbs.communication@gmail.com
   GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx
   ```

A regular Gmail address is fine for a small team's volume of task emails. If
you outgrow it later, swapping in a transactional email service (SendGrid,
Mailgun, etc.) only means changing `src/lib/mail.ts`.

## 3. Deploy it

The app needs a host that keeps a persistent disk around, because the
SQLite database is a file. **Render** works well and has a free/low-cost
tier:

1. Push this project to a GitHub repository.
2. In Render, create a **Web Service** from that repo.
   - Build command: `npm install && npm run build`
   - Start command: `npm run db:migrate && npm run db:seed && npm start`
     (migrate/seed are safe to re-run — seed skips if the admin already
     exists)
   - Add a **Disk** (e.g. 1GB, mounted at `/data`).
3. Set environment variables in Render's dashboard (same names as
   `.env.example`):
   - `SESSION_SECRET`, `CRON_SECRET`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`,
     `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`
   - `DATABASE_PATH=/data/app.db` (pointing at the mounted disk, so the
     database survives deploys/restarts)
   - `APP_URL=https://your-app-name.onrender.com` (used in email links —
     update after Render gives you the URL)
   - `APP_TIMEZONE=Asia/Kolkata` (used for "due today" / reminder timing)
4. Deploy. Log in at your Render URL with the seeded admin account and
   change the password.

Any other Node host with a persistent disk (Railway, Fly.io, a small VPS)
works the same way — the important bits are the disk for `DATABASE_PATH` and
the environment variables above.

## 4. Turn on the daily reminder email

The app exposes one endpoint that, when called, checks every open task and
emails the assignee if it's overdue, due today, or due tomorrow:

```
GET https://your-app-url/api/cron/reminders?secret=YOUR_CRON_SECRET
```

It's safe to call more than once a day — it won't send the same task's
reminder twice in one day. Point any scheduler at it once a day, e.g.:

- **Render**: add a Cron Job (separate from the web service) that runs
  `curl "https://your-app-url/api/cron/reminders?secret=$CRON_SECRET"` on a
  daily schedule (e.g. `0 3 * * *` for 8:30am IST).
- **cron-job.org** (free, no server needed): create a job hitting that same
  URL once a day.
- If you're driving this from Claude's scheduled tasks instead, ask to set
  up a daily scheduled task that fetches that URL.

## Project structure

```
src/
  app/                 Pages and routes (App Router)
    login/              Sign in
    dashboard/          Task list (the home screen)
    tasks/new, tasks/[id]  Create/edit a task
    clients/            Manage clients (admin)
    team/               Manage team members (admin)
    account/            Change your own password
    api/cron/reminders/ The daily reminder endpoint
  components/          Shared UI (forms, nav, badges)
  lib/
    db/                 Database schema, queries, migrations (Drizzle)
    auth/               Login/session handling
    tasks/, clients/, team/  Server Actions (the actual mutations)
    mail.ts             Email sending + templates
    date.ts             Timezone-aware "today" helper
```

## Notes and limits

- Built for a small team (roughly under 10 people). If you outgrow SQLite,
  swapping in Postgres later is a schema-and-connection-string change in
  `src/lib/db/`, not a rewrite.
- Deleting a client or team member is blocked while they still have tasks
  attached, to avoid silently orphaning data — reassign or delete the tasks
  first.
- There's no file attachments, comments, or notifications beyond email in
  this first version. If those turn out to matter, they're natural next
  additions.
