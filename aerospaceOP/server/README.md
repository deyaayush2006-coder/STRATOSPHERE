# Stratosphere API

Feedback endpoint for the club site. Express + Mongoose, talking to MongoDB.

## Run it locally

```bash
cd server
npm install
cp .env.example .env      # then fill in MONGODB_URI
npm run dev               # http://localhost:4000
```

`MONGODB_URI` is either an Atlas connection string or a local
`mongodb://127.0.0.1:27017/stratosphere`. The server refuses to start
without it rather than falling back to a default database.

The frontend reads `VITE_API_URL` (see `.env.example` in the project
root) and defaults to `http://localhost:4000`, so with both dev servers
running the form works with no further config.

## Endpoints

| Method | Path            | Purpose                        |
| ------ | --------------- | ------------------------------ |
| GET    | `/health`       | Liveness + DB connection state  |
| POST   | `/api/feedback` | Submit one piece of feedback    |

`POST /api/feedback` takes JSON:

```json
{ "name": "optional", "email": "optional", "message": "required", "page": "/" }
```

It answers `201 {"ok":true}` on success, `400` with a readable `error`
on bad input, and `429` when rate limited. Nothing from the stored
document is returned.

## Reading the feedback

There is no admin UI. Until there is, read it straight from the
database — Atlas has a table view, or:

```bash
mongosh "$MONGODB_URI" --eval 'db.feedbacks.find().sort({createdAt:-1}).limit(20)'
```

Each document carries a `status` field (`new` / `read` / `actioned` /
`spam`) so entries can be triaged in place.

## Spam handling

1. **Rate limit** — 5 submissions per IP per 10 minutes.
2. **Honeypot** — the form renders a hidden `website` field. Anything
   that fills it gets a `200` and is silently dropped.
3. **Validation** — length and shape checks in the route, with the
   schema as a backstop.

If spam still gets through, add a captcha rather than tightening the
rate limit, which starts blocking real people first.

## Deploying

Needs a host that runs a persistent process — Render, Railway and Fly
all do. Set `MONGODB_URI` and `CORS_ORIGINS` (the deployed origin, not
a wildcard) in the host's environment.

Vercel runs serverless functions instead, so deploying there means
moving the route to `/api/feedback.js` and caching the Mongoose
connection across invocations.
