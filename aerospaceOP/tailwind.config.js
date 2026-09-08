/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0a0a12",
        panel: "#12121e",
        edge: "rgba(255,255,255,0.08)",
        aurora1: "#3300ffff",
        aurora2: "#124e76ff",
        aurora3: "#ff5c9e",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      keyframes: {
        blobFloat: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(4%, -6%) scale(1.08)" },
          "66%": { transform: "translate(-3%, 4%) scale(0.95)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: 0.55 },
          "50%": { opacity: 1 },
        },
        riseIn: {
          "0%": { transform: "translateY(100%)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
        fadeUp: {
          "0%": { transform: "translateY(16px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
      },
      animation: {
        blob: "blobFloat 18s ease-in-out infinite",
        glow: "glowPulse 4s ease-in-out infinite",
        rise: "riseIn 0.7s cubic-bezier(.2,.8,.2,1) both",
        "fade-up": "fadeUp 0.6s ease both",
      },
    },
  },
  plugins: [],
};
