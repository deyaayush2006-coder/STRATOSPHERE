"use client";

import { useState } from "react";

// Shares the current page with the phone's share sheet, or copies its address
// where there is none (most desktops). Says what happened either way.
export default function ShareLink({ title, className = "" }) {
  const [note, setNote] = useState("");

  async function share() {
    const url = window.location.href.split("#")[0];
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setNote("Link copied");
    } catch (error) {
      // Closing the share sheet is not an error worth showing.
      if (error?.name !== "AbortError") setNote("Copy the address from the address bar");
    }
    setTimeout(() => setNote(""), 2500);
  }

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <button
        type="button"
        onClick={share}
        className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 font-sans text-sm font-semibold text-ink/75 transition hover:border-aurora2/40 hover:text-aurora2"
      >
        Share
      </button>
      <span role="status" aria-live="polite" className="font-sans text-xs text-ink/50">
        {note}
      </span>
    </span>
  );
}
