# Stratosphere content API

Express + MongoDB + JWT. Backs the site dashboard: content sections, uploaded
images, and the accounts that can sign in.

## What it does

- Serves the site's editable content at `GET /api/content` (public)
- Accepts edits from the dashboard on `PUT /api/content/:key` (signed in)
- Stores uploaded images in MongoDB and serves them from `/api/media/:id`
- Two roles: **editor** (content + images) and **admin** (that, plus accounts)
- **No public sign-up.** Accounts come from `npm run seed` or from an admin
  using the Accounts tab. Anyone who finds the API cannot create themselves one.

## Layout

```
backend/
├── config/
│   ├── db.js               MongoDB connection (+ public DNS for Atlas SRV)
│   └── sections.js         the only content keys the API will accept
├── controllers/            auth · content · media · users
├── middleware/
│   ├── auth.js             requireAuth (re-reads the account) + requireAdmin
│   └── validate.js         formats express-validator errors
├── models/                 User · Content · Media
├── routes/                 /api/auth · /api/content · /api/media · /api/users
├── scripts/seed.mjs        first admin + content from the site's defaults
└── server.js               CORS, rate limits, error handling
```

## Setup

```bash
npm install
cp .env.example .env      # then fill it in
npm run seed              # creates the first admin, fills the content sections
npm run dev               # http://localhost:5000
```

`.env` needs at minimum `MONGO_URI`, `JWT_SECRET`, and — for the first run only —
`ADMIN_EMAIL` and `ADMIN_PASSWORD`. The server refuses to start without
`JWT_SECRET` rather than signing tokens with `undefined`.

`npm run seed` is safe to re-run: an existing admin is left alone and its
password is never reset from here, and content sections that have been edited
are skipped. Pass `-- --force` to overwrite edited sections with the bundled
defaults.

## API

| Method | Path                | Access | Purpose |
| ------ | ------------------- | ------ | ------- |
| GET    | `/api/health`       | public | liveness |
| POST   | `/api/auth/login`   | public | returns a JWT (10 attempts / 15 min / IP) |
| GET    | `/api/auth/me`      | signed in | the current account |
| POST   | `/api/auth/password`| signed in | change your own password |
| GET    | `/api/content`      | public | every stored section, keyed by name |
| GET    | `/api/content/:key` | public | one section |
| PUT    | `/api/content/:key` | signed in | replace a section |
| DELETE | `/api/content/:key` | signed in | drop it, so the site falls back to defaults |
| GET    | `/api/media/:id`    | public | the image bytes |
| GET    | `/api/media`        | signed in | the library listing |
| POST   | `/api/media`        | signed in | upload one image (multipart `file`) |
| DELETE | `/api/media/:id`    | signed in | delete an image |
| GET/POST | `/api/users`      | **admin** | list / create accounts |
| PATCH/DELETE | `/api/users/:id` | **admin** | rename, change role, suspend, delete |

Send the token as `Authorization: Bearer <token>`.

## How the content model works

Content is one document per section (`key` + a `Mixed` `value`), not a schema
per content type. Page content grows fields constantly — a card gains a tag, an
event gains a time — and a strict schema would mean a migration each time.
Validation is at the route instead: the key must be one of
`config/sections.js`, the shape must match (list vs object), and the payload
must be under 512KB.

**Sections the API has never been given are simply absent from `GET /api/content`.**
The site ships with a full copy of its own content and falls back to it per
section, so an empty database, a sleeping API, or a "Reset section" in the
dashboard all render the site correctly rather than blanking it.

## Images in MongoDB

Uploads are stored as bytes on a `Media` document, not on disk — Render and
Railway wipe the filesystem on every deploy. The browser resizes to 1600px and
re-encodes to WebP before uploading, so a 200KB photo lands as roughly 50KB and
a phone photo shrinks far more. The server caps uploads at 4MB and rejects
anything that is not an image.

`/api/media/:id` is served with `immutable` caching: a re-upload gets a new id,
so the bytes behind a URL never change.

## Deploying

Needs a host that runs a persistent process — Render, Railway and Fly all do.
Set in the host's environment:

- `MONGO_URI`, `JWT_SECRET`
- `CLIENT_ORIGIN` — the deployed site origin, comma-separated if more than one.
  **Not** a wildcard.
- `NODE_ENV=production` — this switches off the loopback CORS exemption that
  makes `npm run dev` work on whatever port Vite picks.

Leave `ADMIN_PASSWORD` out of the production environment once the first admin
exists.

## Losing access

If every admin password is lost, there is no email reset. Set a new password
hash directly on the `users` collection, or delete the admin row and re-run
`npm run seed` with fresh `ADMIN_*` values.
