# Stratosphere

Site for the Stratosphere Aerospace Club, Jadavpur University.
React + Vite + Tailwind v4.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

For the dashboard and live content, run the API too:

```bash
cd ../backend && npm install && npm run seed && npm run dev   # :5000
```

Vite proxies `/api` to `:5000`, so `VITE_API_BASE` stays empty in development.
The contact form goes to Web3Forms and needs `VITE_WEB3FORMS_KEY` in `.env`.

## Layout

```
data.js          the bundled copy of all page content — the fallback, and the seed
src/
  App.jsx        splits the public site from the admin route
  content/
    defaults.js    data.js reshaped into one object, keyed by section
    ContentProvider.jsx  fetches /api/content, falls back to the defaults
  admin/         the dashboard — lazy-loaded, never in the public bundle
    schema.js      which fields each section has; the forms are generated from it
    fields.jsx     one renderer per field type
  pages/         Home, ProjectDetail
  components/    one file per section
  index.css      theme tokens, glass surfaces, backdrop layers
public/images/   team, events, projects, hero
server/          feedback API (separate from backend/)
```

## Where the content lives

Both places, on purpose.

`data.js` is the bundled copy. It is what renders on first paint, what renders
if the API is down or not deployed, and what `backend/scripts/seed.mjs` loads
into a fresh database. Editing it still works and is the right move for a
change that should be in version control.

The database holds whatever the dashboard has saved. On load, the site fetches
`/api/content` and each stored section replaces its bundled counterpart. A
section nobody has edited keeps the bundled version. So the club can edit the
site without touching code, and the site never depends on the API being up.

Components read content through `useContent("events")` rather than importing
`data.js`, which is what makes both paths work.

## The dashboard

Lives at `/<VITE_ADMIN_PATH>` — `control-tower` unless you change it, so
`http://localhost:5173/control-tower` in development.

**Change `VITE_ADMIN_PATH` before deploying**, and again whenever the committee
hands over.

The password is the security boundary, not the path. The router has to match on
the path, so the string is in the public JavaScript bundle and anyone who reads
it can find the URL — what they reach is a rate-limited login form. What the
unlisted path actually buys is that the panel stays out of search results,
crawlers and scanner wordlists. Four things keep it there:

- nothing on the site links to it
- the page serves `noindex, nofollow, noarchive` at runtime
- every unrecognised URL renders the home page, so `/admin` and `/login` give a
  probe nothing to confirm
- `robots.txt` deliberately does **not** name it — listing a private path there
  publishes it

The dashboard bundle is loaded only when someone opens that URL. A visitor to
the public site never downloads it.

Sign-in sessions live in `sessionStorage`, so closing the tab signs you out.

### Editing

Each section is a list of cards or a single form. Expand a card to edit it, use
the arrows to reorder, and Save writes the whole section at once — a
half-finished event is never live while you are still typing. Changes appear on
the site on its next load.

"Reset this section" drops what is stored and puts the section back to the
`data.js` version. It is the way out of a bad edit.

Images upload from any image field or from the Image library tab. They are
resized to 1600px and converted to WebP in the browser before upload, so
photos straight off a phone are fine.

### Adding a field

Add a line to the section in `src/admin/schema.js`, add the matching key to
`backend/config/sections.js` if it is a whole new section, and read it in the
component. There is no per-section form to write — the schema generates them.

## Build

```bash
npm run build     # dist/
npm run preview
```

Set in the Vercel project settings: `VITE_WEB3FORMS_KEY`, `VITE_ADMIN_PATH`,
and `VITE_API_BASE` pointing at the deployed API.
