import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, securityHeaders } from "@/lib/security-headers.mjs";
import nextConfig from "@/next.config.mjs";

const byKey = (list) => Object.fromEntries(list.map((h) => [h.key, h.value]));

describe("security headers", () => {
  it("apply to every route", async () => {
    const [rule] = await nextConfig.headers();
    expect(rule.source).toBe("/(.*)");
    expect(byKey(rule.headers)["X-Content-Type-Options"]).toBe("nosniff");
  });

  it("block framing, sniffing and plugin content", () => {
    const h = byKey(securityHeaders());
    expect(h["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(h["Content-Security-Policy"]).toContain("object-src 'none'");
    expect(h["X-Frame-Options"]).toBe("DENY");
    expect(h["Strict-Transport-Security"]).toMatch(/max-age=\d{8}/);
  });

  it("never allow eval in production", () => {
    expect(contentSecurityPolicy({ dev: false })).not.toContain("unsafe-eval");
  });

  it("report-only policy has no directive browsers ignore there", () => {
    // Chrome logs a console error on every page load for each of these.
    expect(contentSecurityPolicy({ dev: false })).not.toMatch(
      /upgrade-insecure-requests|block-all-mixed-content|sandbox/
    );
  });

  it("lint runs during builds", () => {
    expect(nextConfig.eslint?.ignoreDuringBuilds).not.toBe(true);
  });
});
