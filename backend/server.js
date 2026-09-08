require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const contentRoutes = require("./routes/content");
const mediaRoutes = require("./routes/media");
const userRoutes = require("./routes/users");

const app = express();

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not set. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

// --- Connect to database ---
connectDB();

/* Render and Railway sit behind a proxy; without this the rate limiter reads
   the proxy's IP and treats every visitor as the same client. */
app.set("trust proxy", 1);

// --- Core middleware ---
/* 1MB: content sections are capped at 512KB in the controller, and images
   arrive as multipart rather than JSON. */
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

/* Nothing under /api should ever turn up in a search result — the admin panel
   is unlisted and this is the API behind it. */
app.use((_req, res, next) => {
  res.set("X-Robots-Tag", "noindex, nofollow");
  res.set("X-Content-Type-Options", "nosniff");
  next();
});

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const isProduction = process.env.NODE_ENV === "production";

/* Vite picks the next free port when 5173 is taken, and its dev proxy forwards
   the browser's real Origin, so a strict allowlist rejects a perfectly normal
   `npm run dev` with a confusing 403. Off the production build, any loopback
   origin is fine — it can only come from someone's own machine. */
const isLoopback = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

app.use(
  cors({
    origin(origin, callback) {
      // no Origin header: curl, health checks, and <img src> requests
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (!isProduction && isLoopback(origin)) return callback(null, true);
      return callback(new Error(`Origin not allowed: ${origin}`));
    },
    credentials: true,
  })
);

/* Login is the one door into the panel, so it gets the tight limit.
   Everything else under /api/auth is already behind a valid token. */
app.use(
  "/api/auth/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many login attempts. Try again in 15 minutes." },
  })
);

app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
    /* GET /api/media/:id is every image on the public site; rate limiting
       those would blank the page for anyone who scrolls fast. */
    skip: (req) => req.method === "GET" && req.path.startsWith("/media/"),
    message: { message: "Too many requests from this IP, please try again later" },
  })
);

// --- Routes ---
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/users", userRoutes);

// --- 404 handler ---
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// --- Global error handler (catches anything thrown/passed to next()) ---
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "That image is larger than 4MB. Try a smaller one."
        : err.message;
    return res.status(400).json({ message });
  }

  if (err.message?.startsWith("Origin not allowed")) {
    /* Logged rather than returned: the client learns nothing useful, but
       whoever runs the server can see what to add to CLIENT_ORIGIN. */
    console.warn(`[cors] ${err.message} — add it to CLIENT_ORIGIN if this is expected`);
    return res.status(403).json({ message: "Request rejected" });
  }

  if (err.message?.startsWith("Unsupported image type")) {
    return res.status(400).json({ message: err.message });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: Object.values(err.errors)[0]?.message || "Validation failed",
    });
  }

  console.error(err.stack);
  return res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
