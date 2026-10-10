// Black-box checks against a running deployment.
//   SMOKE_URL=https://preview-url npm run test:smoke
// Optional: VERCEL_AUTOMATION_BYPASS_SECRET (protected previews),
//           ADMIN_PATH (custom admin path; /admin must then be a 404).
import { describe, expect, it } from "vitest";

const BASE = (process.env.SMOKE_URL || "").replace(/\/+$/, "");
const suite = BASE ? describe : describe.skip;
const headers = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  ? { "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET }
  : {};
const get = (path) => fetch(`${BASE}${path}`, { headers, redirect: "manual" });

suite(`smoke: ${BASE}`, () => {
  let home;
  let html = "";

  it("home page loads", async () => {
    home = await get("/");
    html = await home.text();
    expect(home.status).toBe(200);
    expect(html).toContain("Stratosphere");
  });

  it("sends security headers", () => {
    expect(home.headers.get("x-content-type-options")).toBe("nosniff");
    expect(home.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(home.headers.get("x-powered-by")).toBeNull();
  });

  it("has share and search metadata", () => {
    expect(html).toMatch(/<meta property="og:image"/);
    expect(html).toMatch(/<meta name="twitter:card"/);
    expect(html).toContain('"@type":"Organization"');
  });

  it("leaks no email addresses beyond the ones shown as mailto links", () => {
    const shown = new Set([...html.matchAll(/mailto:([^"'?\s]+)/gi)].map((m) => decodeURIComponent(m[1]).toLowerCase()));
    const found = new Set([...html.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)].map((m) => m[0].toLowerCase()));
    const hidden = [...found].filter((e) => !shown.has(e) && !/@example\.(com|org|net)$/.test(e) && !/\.(png|jpe?g|webp|svg|gif)$/.test(e));
    expect(hidden).toEqual([]);
  });

  it("robots.txt and sitemap.xml are served", async () => {
    const robots = await get("/robots.txt");
    expect(robots.status).toBe(200);
    expect(await robots.text()).toMatch(/Sitemap:/i);
    expect((await get("/sitemap.xml")).status).toBe(200);
  });

  it("event pages from the sitemap load", async () => {
    const xml = await (await get("/sitemap.xml")).text();
    const event = [...xml.matchAll(/<loc>([^<]*\/events\/[^<]+)<\/loc>/g)][0]?.[1];
    if (!event) return;
    const res = await get(new URL(event).pathname);
    expect(res.status).toBe(200);
  });

  it("unknown pages return 404", async () => {
    expect((await get("/this-page-does-not-exist-404")).status).toBe(404);
  });

  it("the default admin path is hidden when a custom one is set", async () => {
    if (!process.env.ADMIN_PATH || process.env.ADMIN_PATH === "admin") return;
    expect((await get("/admin")).status).toBe(404);
  });
});
