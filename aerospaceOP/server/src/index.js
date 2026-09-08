import dns from "node:dns";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import feedbackRouter from "./routes/feedback.js";

/* The local/ISP resolver here refuses SRV lookups (querySrv ECONNREFUSED),
   which Atlas "mongodb+srv://" URIs depend on. Resolve through public DNS. */
dns.setServers((process.env.DNS_SERVERS || "8.8.8.8,1.1.1.1").split(",").map((s) => s.trim()));

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

/* Comma separated in the env. Set this to the real site origin in
   production: a wildcard would let any page on the internet post here. */
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

const app = express();

/* Behind a proxy the client IP is in X-Forwarded-For; without this the
   rate limiter sees one IP for everyone. */
app.set("trust proxy", 1);

app.use(
  cors({
    origin(origin, callback) {
      // no Origin header: curl, health checks, same-origin requests
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin not allowed: ${origin}`));
    },
  })
);

/* Feedback is text, so cap it small and reject at the parser. */
app.use(express.json({ limit: "16kb" }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.use("/api/feedback", feedbackRouter);

app.use((_req, res) => res.status(404).json({ ok: false, error: "Not found" }));

/* Without this the CORS rejection above surfaces as a 500 with a stack trace. */
app.use((err, _req, res, _next) => {
  console.error("[server]", err.message);
  res.status(err.message?.startsWith("Origin not allowed") ? 403 : 500).json({
    ok: false,
    error: "Request rejected.",
  });
});

async function start() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log("mongodb connected");

  app.listen(PORT, () => console.log(`api listening on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error("failed to start:", err.message);
  process.exit(1);
});
