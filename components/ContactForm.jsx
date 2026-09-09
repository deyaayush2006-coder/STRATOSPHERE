"use client";

import { useState } from "react";

// Web3Forms delivers submissions to the club inbox. Set
// NEXT_PUBLIC_WEB3FORMS_KEY in .env.local and in the Vercel project settings —
// without it the form has no key to send and every submission fails.
const ENDPOINT = "https://api.web3forms.com/submit";
const ACCESS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;

// Fixed colours, not theme tokens: a light control on a dark panel, which must not invert.
const FIELD =
  "w-full px-4 py-3.5 rounded-xl border-2 border-[#0c1a2a] bg-white/60 text-[#14202e] " +
  "placeholder:text-[#14202e]/65 outline-none focus:border-aurora2 transition-colors";

export default function ContactForm() {
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (status === "sending") return;

    const form = e.currentTarget;
    const data = new FormData(form);

    setStatus("sending");
    setError("");

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          subject: data.get("subject") || "New message from the Stratosphere site",
          name: data.get("name") || "",
          email: data.get("email") || "",
          message: data.get("message") || "",
          botcheck: data.get("website") ? true : "", // honeypot
          page: typeof window !== "undefined" ? window.location.pathname : "",
        }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok || !payload.success) {
        setError(payload.message || "Could not send that. Please try again.");
        setStatus("error");
        return;
      }

      form.reset();
      setStatus("sent");
    } catch {
      /* network-level failure: the API is down or unreachable */
      setError("Could not reach the server. Please try again later.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="p-8 rounded-xl border-2 border-[#0c1a2a] bg-[#e0d8d8] text-center">
        <p className="text-[#14202e] font-bold text-lg">Thanks — we have got it.</p>
        <p className="text-sm text-[#14202e]/70 mt-2">
          The committee reads everything that comes through here.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="text-sm font-semibold text-[#183445] underline underline-offset-4 mt-5"
        >
          Send another →
        </button>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col sm:flex-row gap-5">
        <input
          name="name"
          type="text"
          placeholder="Your Name"
          aria-label="Your name"
          maxLength={120}
          className={`${FIELD} sm:w-1/2`}
        />
        <input
          name="email"
          type="email"
          placeholder="Your Email"
          aria-label="Your email"
          maxLength={254}
          className={`${FIELD} sm:w-1/2`}
        />
      </div>

      <input
        name="subject"
        type="text"
        placeholder="Subject"
        aria-label="Subject"
        maxLength={200}
        className={FIELD}
      />

      <textarea
        name="message"
        required
        rows={9}
        maxLength={4000}
        placeholder="Message"
        aria-label="Your message"
        className={`${FIELD} resize-y`}
      />

      {/* honeypot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <div className="flex flex-col items-center gap-4">
        <button
          type="submit"
          disabled={status === "sending"}
          className="w-44 px-6 py-3 rounded-lg font-bold bg-[#e0d8d8] text-[#183445] hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed transition drop-shadow-md"
        >
          {status === "sending" ? "Sending…" : "Submit"}
        </button>

        {status === "error" && (
          <p role="alert" className="text-sm text-aurora3">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
