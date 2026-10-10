# Stratosphere — Aerospace Club, Jadavpur University

The club site and its dashboard, as one Next.js app on Vercel, with Supabase
behind it.

Committee members sign in at a private URL and post announcements, events,
projects, achievements and committee lists through forms. Images upload from a
phone. The public site is server-rendered from the same database.

```
app/
  (site)/            the public pages — home, project write-ups
  admin/             the dashboard, and every server action that writes
components/
  control-tower/     the editor: schema-driven forms, media library, accounts
lib/
  content.js         reads the whole site out of Supabase in one pass
  defaults.js        the bundled copy of every section
  mappers.js         database rows <-> the shapes the components render
  supabase/          one client per context: public, signed-in, service role
supabase/
  migrations/        the schema. Run 0001_init.sql, then each numbered file
  seed.mjs           fills a fresh project and makes the first admin
data.js              the content the site ships with
```

## Setting it up

### 1. Make the Supabase project

Create one at [supabase.com](https://supabase.com) — the free tier is more than
this site needs. Then open **SQL Editor**, paste the whole of
`supabase/migrations/0001_init.sql`, and run it.

That creates every table, the row level security policies, and the `media`
storage bucket. It is safe to run again if something goes wrong halfway.

Then run the numbered files after it, in order, the same way — `0002`, `0003`,
`0004`. Each one adds columns to what `0001` created and each is safe to re-run.
**`0004` is not optional on an existing project**: it adds the columns behind
the 3D models, the CAD galleries, the write-ups and the flight data, and until
it has been run, saving a project in the dashboard fails on the missing columns.

### 2. Fill in the environment

```bash
cp .env.example .env.local
```

From **Supabase → Project Settings → API**, copy in:

| Variable | Where it comes from |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` `secret` key |

Then set `ADMIN_EMAIL` and `ADMIN_PASSWORD` to the first committee account you
want. The contact form saves messages to the `contact_messages` table through
the `service_role` key, so it needs no key of its own.

The `anon` key is meant to be public — it ends up in the browser bundle, and row
level security is what decides what it can read. The `service_role` key is not:
it bypasses row level security entirely. It has no `NEXT_PUBLIC_` prefix, so a
stray import into a client component fails the build instead of leaking it.

### 3. Seed and run

```bash
npm install
npm run seed     # fills the tables and creates the first admin
npm run dev
```

The site is at <http://localhost:3000>, the dashboard at
<http://localhost:3000/admin>. Sign in with the admin address and
password you just set, then change that password from **Your account** and clear
`ADMIN_PASSWORD` out of `.env.local`.

`npm run seed` never overwrites a table that already has rows in it. Use
`npm run seed -- --force` when you really do want to start over.

## Deploying to Vercel

Import the repository at [vercel.com/new](https://vercel.com/new). Vercel
detects Next.js on its own — there is nothing to configure.

Add all six environment variables from `.env.local` under **Settings →
Environment Variables** before the first deploy, then deploy.

You do not need a domain. Leave `NEXT_PUBLIC_SITE_URL` empty and the deploy
picks up its own `*.vercel.app` address for the social card images; set it
only if the club ever gets a domain of its own.

`NEXT_PUBLIC_ADMIN_PATH` is read at build time rather than per request, so
**changing it needs a redeploy** before it takes effect.

## How content reaches the page

The site is static, rebuilt at most once a minute (`revalidate = 60` in
`app/(site)/layout.jsx`). A save in the dashboard does not wait for that timer —
the server action calls `revalidatePath`, so the change is live on the next
request.

**Nothing here can make the site go blank.** `lib/defaults.js` holds a complete
copy of every section, imported straight from `data.js`. An empty table, a
paused Supabase project, a missing key — all of them fall through to that, and
the club site renders anyway. The dashboard only ever *overrides* what is
bundled. The same file feeds `npm run seed`, so the two can never drift apart.

## Where the content lives

The split is between **records** and **page copy**, because they want different
things from a database.

**Records** — announcements, events, achievements, projects (with their parts),
committees (with their members) — get real tables. Each row has its own
`published` flag and `sort_order`, so a half-written event can sit as a draft
and the running order can change without rewriting anything.

**Page copy** — the hero photos and logo, the About block, contact details, the nav
and footer links, the showcase clips — lives in `sections` as one `jsonb`
document per key. A column per field would mean a database migration every time
a paragraph moves.

`lib/mappers.js` is the only file that knows the difference between the two
worlds. The components and the editor both speak the original flat shapes —
`{ when, date, time }` for an event — while Postgres stores `when_status`,
`date_label`, `starts_at`. Everything else is spared the translation.

## Adding a field to the dashboard

`components/control-tower/schema.js` generates every form in the panel — there is no
hand-written editor per section. A new field on a card is one line there:

```js
{ name: "venue", label: "Venue", type: "text", hint: "Building and room" },
```

Types are `text`, `textarea`, `select`, `checkbox`, `image`, `stringList`,
`pairList` and `list` (which nests). For a **page copy** section that is the
whole job. For a **record** section, add the column to a migration and the two
lines that map it in `lib/mappers.js`.

## Security

Authorisation is row level security in Postgres, not checks in application code.
The policies are all in the migration, and they are the same shape everywhere:
anyone may read the published rows, an active staff account may do anything.

- **No public sign-up.** An account exists only because an admin created one in
  the Accounts tab. Two levels: an editor changes content, an admin also manages
  accounts.
- **Suspend rather than delete** when a committee hands over, so the trail on
  old content still resolves to a name.
- **Server actions run as the signed-in member**, so a stolen anon key gets a
  visitor's view of the database and nothing more. The one place that uses the
  service role — creating and deleting accounts — checks the caller is an admin
  itself, because that key bypasses the policies.
- **`NEXT_PUBLIC_ADMIN_PATH`** sets the dashboard's URL. The footer's "Admin"
  link points at it, so members never have to type it, which also means
  it is public. It was never the security boundary: every visitor meets a login
  form, and only active staff accounts get past it. The link is `nofollow`, the
  page serves `noindex`, and `/admin` itself returns 404 when a custom path is
  set.

## Images

Uploads are resized to 1600px and re-encoded as WebP **in the browser**, before
they go anywhere — a 4MB phone photo lands as roughly 150KB. They go straight
from the browser to Supabase Storage rather than through a server action, which
would have to buffer the bytes twice and fit them inside the request body limit.

The `media` table is the index the library lists; the bucket holds the files. An
image that shipped with the repo (`/images/events/…`) and one that was uploaded
are both just strings in the content, and `lib/media-url.js` works out which is
which.

Deleting an image does not clear it from the sections that use it — those will
show a gap until the reference is fixed. Check where it is used first.

Everything on the site is rendered through `next/image`, so a photo is served
resized and as AVIF or WebP at whatever width the layout actually paints it —
committee portraits are fetched at 48px rather than at full resolution. Remote
files are only optimised if their host is allowed in `next.config.mjs`, which
reads the Supabase hostname out of the environment; anything under `public/`
needs no entry.

## What a project page can carry

Beyond the write-up and its parts, each project in the dashboard takes four
extras. All four are optional and each hides its own section when empty, so a
project that uses none of them renders exactly as it did before they existed.

- **A 3D model** — a `.glb` path that visitors drag to rotate. Put the file in
  `public/models/` (see the note in that folder) and write the path. Not an
  upload: the media library is built around images. Parts can carry one each as
  well as the project itself.
- **CAD drawings** — ordinary images through the picker, shown as a grid that
  opens full size.
- **A technical write-up** — headed sections of prose, with an optional row of
  key figures under each. A blank line in the body starts a new paragraph, and
  that is the only formatting there is.
- **Flight data** — a pasted CSV with a header row. The page works out the
  charts, the peak/min/final figures and a data table from it. Long logs are
  thinned for drawing, but the quoted figures are always taken from every row,
  so an apogee cannot be lost to the decimation.

The parsing all happens on the server, in `lib/telemetry.js` — a visitor gets a
few hundred points and a set of finished numbers, not the raw log and a parser
to run over it. `three` and `recharts` are loaded only by the pages that
actually draw something, so a project with none of these extras pays nothing
for them.


## Security model

- **Public site** reads Supabase with the anon key. RLS lets `anon` read published content only. Member emails, contact messages, profiles, drafts and the media table are never readable by `anon`.
- **Staff** are accounts whose `profiles.is_active` is true. Only the server (service role) can create staff: the admin panel sets `app_metadata.staff` / `app_metadata.role`, which users cannot edit. Public sign-ups get an inactive profile and see nothing.
- **Keep public sign-ups off** in Supabase → Authentication → Sign In / Providers. Migration 0007 makes a sign-up harmless, but there is no reason to allow it.
- Role checks (`private.is_staff()`, `private.is_admin()`) live in a schema the REST API does not expose.
- Security headers come from `lib/security-headers.mjs`. The full CSP runs in Report-Only mode; move it to the enforced header once a preview deploy shows no violations in the browser console.

## Migrations

Migrations are append-only: never edit a file that has been applied; add a new numbered one. CI fails a PR that changes an existing migration.

| File | When to apply |
| --- | --- |
| `0007_auth_and_rls_hardening.sql` | Any time (no app change needed). Until this app version is live, accounts created in Control Tower start suspended; activate them under Users. |
| `0008_member_email_privacy.sql` | **Only after** this app version is deployed. The old code selects `cohort_members(*)`, which fails once anon loses the email column. |

## Testing

| Command | What it checks | Needs |
| --- | --- | --- |
| `npm run lint` | ESLint (Next.js rules) | — |
| `npm run test:unit` | Content privacy, admin save rollback, contact form, security headers, event dates | — |
| `npm run test:db` | Every RLS policy, as anon, outsider, suspended editor, editor and admin, on plain Postgres with all migrations | `TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres` |
| `npm run test:smoke` | Black-box HTTP checks of a running site (status codes, headers, metadata, no leaked emails) | `SMOKE_URL=https://…` |

## CI/CD

1. **Pull request → GitHub Actions (`ci.yml`)**: lint, unit tests, build, RLS tests on Postgres 17, append-only migration check, gitleaks secret scan, `npm audit`. CodeQL runs separately.
2. **Vercel build**: `vercel-build` runs lint and unit tests before `next build`, so a failing test fails the deploy and production keeps the last good version.
3. **Every Vercel deployment → `deploy-smoke.yml`**: smoke tests against the preview or production URL. A failing production smoke test opens a `P0` issue.
4. **Every 30 minutes → `uptime.yml`**: site up, and the anon key cannot read private data. Opens one `P0` issue on failure.
5. **Dependabot** opens weekly update PRs, which go through the same checks.

One-time setup:
- GitHub → Settings → Branches: protect `main`; require a PR and the `Lint, unit tests, build`, `Database security (RLS)`, `Migrations are append-only` and `Secret scan` checks.
- GitHub → Settings → Secrets and variables → Actions: secrets `VERCEL_AUTOMATION_BYPASS_SECRET` (if Deployment Protection is on), `ADMIN_PATH`, `PROD_SUPABASE_ANON_KEY`; variables `PROD_URL`, `PROD_SUPABASE_URL`.
- Vercel: delete `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` (only `npm run seed` uses them, locally).

## Running it in Docker

Vercel is still the main deploy. Docker runs the same site on any computer
without installing Node or anything else, which is the easiest way for a new
maintainer to get it running.

**Before you start:** install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
(Windows, macOS or Linux) and open it once so it is running.

1. **Get the code.**
   ```bash
   git clone https://github.com/deyaayush2006-coder/STRATOSPHERE.git
   cd STRATOSPHERE
   ```
2. **Make your settings file.** Copy `.env.example` to `.env` (on Windows:
   `copy .env.example .env`; elsewhere: `cp .env.example .env`) and fill in:

   | Variable | Where to find it | Needed? |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL | Yes |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page → `anon` `public` key | Yes |
   | `SUPABASE_SERVICE_ROLE_KEY` | Same page → `service_role` key. **Secret** | For the contact form and Control Tower → Users |
   | `NEXT_PUBLIC_ADMIN_PATH` | Vercel → Settings → Environment Variables (same name) | Optional, defaults to `admin` |

   If you have access to the Vercel project, `npx vercel link` and then
   `npx vercel env pull .env --environment=production` fill them in one go.
3. **Start it.**
   ```bash
   docker compose up --build
   ```
   The first build takes a few minutes. Then open <http://localhost:3000>, and
   the admin panel at `http://localhost:3000/<NEXT_PUBLIC_ADMIN_PATH>`. Stop it
   with `Ctrl+C`. After changing the code or `.env`, run the same command again.

**Things to know:**
- **It uses the live database.** With the production Supabase keys, anything
  you change in Control Tower on your computer changes the real site too.
- **Never commit `.env`** or send it in a chat. It is already in `.gitignore`
  and `.dockerignore`, so it can't reach GitHub or the image by accident. The
  service role key bypasses every database rule.
- **"missing - copy .env.example to .env"** means `.env` is missing or a
  required value in it is empty.
- **"port is already allocated"** means something else is using 3000. Run
  `APP_PORT=3001 docker compose up --build` (PowerShell:
  `$env:APP_PORT=3001; docker compose up --build`) and open port 3001.
- **The site shows sample content** when the Supabase values are wrong or the
  project is paused. It falls back to the bundled defaults instead of
  crashing. Check the values, and that the project is not paused in Supabase.

How the variables split inside the image:
- **`NEXT_PUBLIC_*` are build args.** Next.js inlines them into the browser
  bundle when it builds, so changing one means rebuilding (`--build`).
- **`SUPABASE_SERVICE_ROLE_KEY` is a runtime env var only.** It never enters
  an image layer.

The image uses Next's standalone output on `node:22-alpine`, runs as a
non-root user and has a healthcheck on `/`. Standalone output is switched on
only inside the image (`NEXT_OUTPUT=standalone`), so Vercel builds the same
way as before. The `Docker` workflow builds the image and starts it on every
PR.

## Handing the site over

Every person gets their own account; nobody shares a password. Outgoing admins keep their accounts, so handing over never locks anyone out.

**Admin portal access** (no code or dashboard access needed):
1. An existing admin opens Control Tower → Users → **+ Add an account**, enters the successor's name and email, a starting password and Level **Admin**.
2. The successor signs in and changes the password from their own account. From then on only they know it.
3. Always keep **at least two active admins**. Control Tower stops an admin from suspending, demoting or deleting their own account, but if the only admin forgets their password, the portal can't fix it.

**The services behind the site.** Admin access in the portal does not let anyone deploy, fix the database or renew anything. These are tied to whoever owns them, so give the successor access before you leave:

| Service | What to do |
| --- | --- |
| GitHub | Move the repo to a club organization (Settings → Transfer), or add the successor as an admin collaborator. Branch protection, secrets and variables move with it. |
| Vercel | Invite the successor to the team that owns the `stratosphere` project, or transfer the project (Settings → Transfer). Environment variables move with it. |
| Supabase | Invite the successor to the organization that owns the project with the Owner role, or transfer the project to a club organization. |
| Domain | If you add a custom domain, register it to a club account or email, not a personal one. |

**Running it on the successor's computer:** once they have Supabase (or Vercel) access, they follow [Running it in Docker](#running-it-in-docker). Give them access to the services, not a copy of your `.env` file.

**Break-glass: nobody can sign in to Control Tower.** Anyone with access to the Supabase project can restore access without a password reset:
1. Supabase → Authentication → Users → **Add user**, with their own email and password, and tick **Auto Confirm User**. (Skip this if they already have an account.)
2. Supabase → SQL Editor:
   ```sql
   update public.profiles set role = 'admin', is_active = true where email = 'their@email';
   ```
3. They sign in at the admin path and take it from there.

`npm run seed` with `ADMIN_EMAIL` / `ADMIN_PASSWORD` does the same for a brand-new project.

## Contributing

Branch from `main` (`fix/…`, `feat/…`, `ci/…`), keep commits atomic with Conventional Commit messages, open a PR, merge when CI is green.
