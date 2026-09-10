# Stratosphere — Aerospace Club, Jadavpur University

The club site and its dashboard, as one Next.js app on Vercel, with Supabase
behind it.

Committee members sign in at a private URL and post announcements, events,
projects, achievements and committee lists through forms. Images upload from a
phone. The public site is server-rendered from the same database.

```
app/
  (site)/            the public pages — home, project write-ups
  control-tower/     the dashboard, and every server action that writes
components/
  admin/             the editor: schema-driven forms, media library, accounts
lib/
  content.js         reads the whole site out of Supabase in one pass
  defaults.js        the bundled copy of every section
  mappers.js         database rows <-> the shapes the components render
  supabase/          one client per context: public, signed-in, service role
supabase/
  migrations/        the schema. Run 0001_init.sql once, whole
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
want, and `NEXT_PUBLIC_WEB3FORMS_KEY` to a free key from
[web3forms.com](https://web3forms.com) so the contact form can deliver.

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
<http://localhost:3000/control-tower>. Sign in with the admin address and
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

**Page copy** — the backdrop and logo, the About block, contact details, the nav
and footer links, the showcase clips — lives in `sections` as one `jsonb`
document per key. A column per field would mean a database migration every time
a paragraph moves.

`lib/mappers.js` is the only file that knows the difference between the two
worlds. The components and the editor both speak the original flat shapes —
`{ when, date, time }` for an event — while Postgres stores `when_status`,
`date_label`, `starts_at`. Everything else is spared the translation.

## Adding a field to the dashboard

`components/admin/schema.js` generates every form in the panel — there is no
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
- **`NEXT_PUBLIC_ADMIN_PATH`** moves the dashboard to a URL only the committee
  knows. It is not the security boundary — a wrong guess still meets a login
  form — but it keeps the panel out of crawlers and scanner wordlists. Nothing
  links to it, the page serves `noindex`, and every unrecognised URL renders the
  ordinary home page. Change it whenever the committee hands over, alongside the
  passwords.

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
