"use client";

// Last-resort boundary for errors in the root layout itself. It replaces the
// whole document, so it can't rely on the site's fonts or CSS.
export default function GlobalError({ reset }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#06060c", color: "#e8e8f0", fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
        <div>
          <h1 style={{ fontSize: 22 }}>Stratosphere is having trouble loading.</h1>
          <p style={{ opacity: 0.7 }}>Please try again in a moment.</p>
          <button type="button" onClick={() => reset()} style={{ marginTop: 12, padding: "8px 18px", borderRadius: 999, border: "1px solid #444", background: "transparent", color: "inherit", cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
