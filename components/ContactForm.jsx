"use client";

import { useState } from "react";
import { sendMessage } from "@/lib/send-message";

const LABEL = "block text-sm text-ink/70 mb-2";

const FIELD =
  "w-full px-3.5 py-2.5 rounded-lg border border-ink/10 bg-ink/[0.04] text-ink text-sm " +
  "placeholder:text-ink/35 outline-none transition " +
  "hover:border-ink/20 focus:border-aurora2/70 focus:ring-2 focus:ring-aurora2/20";

const BUTTON =
  "inline-flex shrink-0 whitespace-nowrap items-center justify-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm " +
  "bg-aurora2 text-[#04121a] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition";

export default function ContactForm({ email = "" }) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (status === "sending") return;

    const form = e.currentTarget;
    const data = new FormData(form);
    data.set("page", window.location.pathname);

    setStatus("sending");
    setError("");

    try {
      const result = await sendMessage(data);
      if (!result?.ok) {
        setError(result?.error || "Could not send that. Please try again.");
        setStatus("error");
        return;
      }
      form.reset();
      setStatus("sent");
    } catch {
      setError(`Could not reach the server. You can email us at ${email}.`);
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="py-12" role="status">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-aurora2/15 text-aurora2" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <p className="text-ink font-semibold text-xl mt-5">Message sent</p>
        <p className="text-sm text-ink/60 mt-2 max-w-sm leading-relaxed">
          Thanks for writing in. Someone from the committee will reply to the email you gave us.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="text-sm font-semibold text-aurora2 hover:brightness-110 mt-6 transition"
        >
          Send another message →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid sm:grid-cols-2 gap-x-4 gap-y-5">
        <div>
          <label htmlFor="cf-name" className={LABEL}>Full name</label>
          <input
            id="cf-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            maxLength={120}
            className={FIELD}
          />
        </div>

        <div>
          <label htmlFor="cf-email" className={LABEL}>Email</label>
          <input
            id="cf-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            maxLength={254}
            className={FIELD}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="cf-subject" className={LABEL}>Subject</label>
          <input
            id="cf-subject"
            name="subject"
            type="text"
            placeholder="What is this about?"
            maxLength={200}
            className={FIELD}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="cf-message" className={LABEL}>Message</label>
          <textarea
            id="cf-message"
            name="message"
            required
            rows={5}
            maxLength={4000}
            placeholder="Tell us a little about what you have in mind…"
            className={`${FIELD} resize-y`}
          />
        </div>
      </div>

      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      {status === "error" && (
        <p role="alert" className="mt-5 text-sm text-aurora3">
          {error}
        </p>
      )}

      <button type="submit" disabled={status === "sending"} className={`${BUTTON} mt-6 w-full sm:w-auto`}>
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
