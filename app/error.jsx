"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink/40">Something went wrong</p>
      <h1 className="text-2xl font-semibold text-ink">This page hit turbulence.</h1>
      <p className="text-ink/60 max-w-md">Try again, or head back to the home page.</p>
      <div className="flex gap-3">
        <button type="button" onClick={() => reset()} className="rounded-full border border-ink/20 px-5 py-2 text-sm text-ink hover:border-ink/50">
          Try again
        </button>
        <a href="/" className="rounded-full border border-ink/20 px-5 py-2 text-sm text-ink hover:border-ink/50">
          Home
        </a>
      </div>
    </main>
  );
}
