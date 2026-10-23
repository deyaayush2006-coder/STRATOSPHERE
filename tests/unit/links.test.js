import { describe, expect, it } from "vitest";
import { isLinkedInAddress, isWebAddress } from "@/lib/links";
import { findProblem, SECTIONS } from "@/components/control-tower/schema";
import { DEFAULT_CONTENT } from "@/lib/defaults";

describe("LinkedIn links", () => {
  it("accept profiles and company pages, country sites included", () => {
    for (const url of [
      "https://www.linkedin.com/in/namanray",
      "https://www.linkedin.com/in/divyansh-dutta-b93857297/",
      "https://linkedin.com/in/someone",
      "https://in.linkedin.com/in/someone",
      "https://www.linkedin.com/company/aerospace-club-ju/",
    ]) {
      expect(isLinkedInAddress(url), url).toBe(true);
    }
  });

  it("reject addresses that would not open the profile", () => {
    for (const url of [
      "linkedin.com/in/namanray",
      "www.linkedin.com/in/namanray",
      "http://www.linkedin.com/in/namanray",
      "https://www.linkedin.com/",
      "https://linkedin.com.example.org/in/someone",
      "https://notlinkedin.com/in/someone",
      "javascript:alert(1)",
    ]) {
      expect(isLinkedInAddress(url), url).toBe(false);
    }
  });
});

describe("web addresses", () => {
  it("need a scheme and a host", () => {
    expect(isWebAddress("https://www.ansys.com")).toBe(true);
    expect(isWebAddress("http://example.org/form")).toBe(true);
    expect(isWebAddress("www.ansys.com")).toBe(false);
    expect(isWebAddress("forms.gle/abc")).toBe(false);
    expect(isWebAddress("javascript:alert(1)")).toBe(false);
  });
});

describe("saving a section checks its links", () => {
  const committees = SECTIONS.find((s) => s.key === "memberCohorts");
  const contact = SECTIONS.find((s) => s.key === "contact");

  it("names the member and the field that is wrong", () => {
    const value = [{ year: "2026–27", members: [{ name: "Naman Ray", linkedin: "linkedin.com/in/namanray" }] }];
    expect(findProblem(committees, value)).toBe(
      "Committees → 2026–27 → Members → Naman Ray → LinkedIn URL: " +
        "Use the full profile address, starting https://www.linkedin.com/in/"
    );
  });

  it("lets an empty optional link through", () => {
    const value = [{ year: "2026–27", members: [{ name: "Avipso Sinha", linkedin: "" }] }];
    expect(findProblem(committees, value)).toBe("");
  });

  it("checks lists inside page-copy sections", () => {
    const value = { socials: [{ platform: "instagram", url: "instagram.com/aerospace_club_ju" }] };
    expect(findProblem(contact, value)).toMatch(/^Contact & hours → Follow us → instagram → Profile URL: /);
  });

  it("passes every section of the content the site ships with", () => {
    for (const section of SECTIONS) {
      expect(findProblem(section, DEFAULT_CONTENT[section.key]), section.key).toBe("");
    }
  });
});
