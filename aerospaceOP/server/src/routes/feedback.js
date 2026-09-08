import { Router } from "express";
import rateLimit from "express-rate-limit";
import Feedback from "../models/Feedback.js";

const router = Router();

/* Three defences on a public write endpoint: rate limit per IP, a honeypot
   field, and length/shape validation before anything is written. */
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Too many submissions. Try again in a few minutes." },
});

/* Loose on purpose — this only catches obvious typos, and the field is optional. */
const looksLikeEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

router.post("/", limiter, async (req, res) => {
  try {
    const body = req.body ?? {};

    /* The form renders this hidden and empty. Answer 200 so a bot that
       trips it cannot tell it was caught. */
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return res.status(200).json({ ok: true });
    }

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const message = String(body.message ?? "").trim();
    const page = String(body.page ?? "").trim();

    if (message.length < 2) {
      return res.status(400).json({ ok: false, error: "Please write a message." });
    }
    if (message.length > 4000) {
      return res.status(400).json({ ok: false, error: "Message is too long (4000 characters max)." });
    }
    if (subject.length > 200) {
      return res.status(400).json({ ok: false, error: "Subject is too long." });
    }
    if (phone.length > 40) {
      return res.status(400).json({ ok: false, error: "That phone number is too long." });
    }
    if (name.length > 120) {
      return res.status(400).json({ ok: false, error: "Name is too long." });
    }
    if (email && !looksLikeEmail(email)) {
      return res.status(400).json({ ok: false, error: "That email address does not look right." });
    }

    await Feedback.create({
      name: name.slice(0, 120),
      email: email.slice(0, 254),
      subject: subject.slice(0, 200),
      phone: phone.slice(0, 40),
      message,
      page: page.slice(0, 200),
    });

    /* Return nothing from the document; the id is an enumeration hint. */
    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error("[feedback] write failed:", err.message);
    return res.status(500).json({ ok: false, error: "Could not save that. Please try again." });
  }
});

export default router;
