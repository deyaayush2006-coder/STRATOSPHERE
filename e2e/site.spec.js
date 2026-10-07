// Runs against a deployed site (E2E_BASE_URL). Read-only apart from the
// contact form, which only ever takes the honeypot path or an invalid email,
// so nothing is stored. Tests tagged @smoke also run against production.

import { expect, test } from "@playwright/test";

const CLUB_EMAILS = (process.env.E2E_ALLOWED_EMAILS || "juaerospace.club@jadavpuruniversity.in")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// you@example.com is the contact form placeholder.
const ALLOWED = new Set([...CLUB_EMAILS, "you@example.com"]);

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const ASSET = /\.(png|jpe?g|webp|avif|gif|svg|glb|mp4|js|css)$/i;

const ADMIN_PATH = (process.env.E2E_ADMIN_PATH || "").replace(/^\/+|\/+$/g, "");

const IPHONE_12 = {
  viewport: { width: 390, height: 664 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
};

function strayEmails(text) {
  const found = new Set();
  for (const match of text.matchAll(EMAIL)) {
    const email = match[0].toLowerCase();
    if (!ALLOWED.has(email) && !ASSET.test(email)) found.add(email);
  }
  return [...found];
}

test("homepage returns 200 and every section renders @smoke", async ({ page }) => {
  const response = await page.goto("/");
  expect(response.status()).toBe(200);

  for (const id of ["overview", "announcements", "members", "events", "projects", "sponsors", "contact"]) {
    await expect(page.locator(`#${id}`), `#${id}`).toBeAttached();
  }
  await expect(page.locator("footer")).toBeAttached();
});

test("no member emails in the homepage HTML or RSC payload @smoke", async ({ request }) => {
  const html = await (await request.get("/")).text();
  expect(strayEmails(html), "emails in HTML").toEqual([]);

  const rsc = await (await request.get("/", { headers: { RSC: "1" } })).text();
  expect(strayEmails(rsc), "emails in RSC payload").toEqual([]);
});

test("no console errors on page load @smoke", async ({ page }) => {
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/", { waitUntil: "networkidle" });
  expect(errors).toEqual([]);
});

test("every event and project page linked from the homepage returns 200", async ({ page, request }) => {
  await page.goto("/");
  const hrefs = await page
    .locator('a[href^="/events/"], a[href^="/projects/"]')
    .evaluateAll((links) => [...new Set(links.map((a) => a.getAttribute("href").split("#")[0]))]);

  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) {
    const response = await request.get(href);
    expect(response.status(), href).toBe(200);
  }
});

test("SEO tags are present and the share image loads", async ({ page, request }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Stratosphere/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", /summary/);

  const ogImage = await page.locator('meta[property="og:image"]').first().getAttribute("content");
  expect(ogImage).toBeTruthy();
  expect((await request.get(ogImage)).status()).toBe(200);
});

test.describe("admin", () => {
  test("/admin is a 404 when the dashboard has moved", async ({ request }) => {
    test.skip(!ADMIN_PATH || ADMIN_PATH === "admin", "E2E_ADMIN_PATH not set");
    expect((await request.get("/admin")).status()).toBe(404);
  });

  test("the dashboard shows a login screen, not data, when signed out", async ({ page }) => {
    await page.goto(`/${ADMIN_PATH || "admin"}`);
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByText("Sign out")).toHaveCount(0);
    expect(strayEmails(await page.content())).toEqual([]);
  });
});

test.describe("contact form", () => {
  test("a filled honeypot shows success and stores nothing", async ({ page }) => {
    await page.goto("/#contact");
    const form = page.locator("form").filter({ has: page.locator('input[name="website"]') });

    await form.locator("#cf-name").fill("E2E honeypot");
    await form.locator("#cf-email").fill("e2e-honeypot@example.com");
    await form.locator("#cf-message").fill("Automated test. The honeypot is filled, so this is dropped.");
    await form.locator('input[name="website"]').evaluate((el) => {
      el.value = "https://bot.example";
    });
    await form.locator('button[type="submit"]').click();

    await expect(page.getByText("Message sent")).toBeVisible();
  });

  test("an invalid email shows an error", async ({ page }) => {
    await page.goto("/#contact");
    const form = page.locator("form").filter({ has: page.locator('input[name="website"]') });

    await form.locator("#cf-email").fill("not-an-email");
    await form.locator("#cf-message").fill("Automated test. Rejected before anything is stored.");
    await form.locator('button[type="submit"]').click();

    await expect(form.getByRole("alert")).toContainText(/valid email/i);
    await expect(page.getByText("Message sent")).toHaveCount(0);
  });
});

test.describe("mobile", () => {
  test.use(IPHONE_12);

  test("no horizontal scroll on the homepage", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
