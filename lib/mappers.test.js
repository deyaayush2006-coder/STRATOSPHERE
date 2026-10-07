import { describe, expect, it } from "vitest";
import {
  achievementFromRow,
  achievementsToRows,
  announcementFromRow,
  announcementsToRows,
  cohortAdminFromRow,
  cohortFromRow,
  cohortMemberAdminFromRow,
  cohortMemberFromRow,
  cohortMembersToRows,
  cohortsToRows,
  eventFromRow,
  eventsToRows,
  projectFromRow,
  projectPartsToRows,
  projectsToRows,
  PUBLIC_MEMBER_COLUMNS,
} from "./mappers";

const POSTED = "2026-03-01T10:00:00.000Z";

const memberRow = {
  id: "m1",
  cohort_id: "c1",
  name: "Asha Rao",
  role: "Lead",
  dept: "Mechanical",
  image: "members/asha.webp",
  linkedin: "https://www.linkedin.com/in/asha",
  email: "asha@example.com",
  sort_order: 0,
};

describe("announcements", () => {
  const row = {
    id: "a1",
    slug: "launch-day",
    title: "Launch day",
    body: "We fly at noon.",
    tag: "Event",
    date_label: "1 Mar",
    posted_at: POSTED,
    pinned: true,
    published: false,
    sort_order: 0,
  };

  it("survives a row -> shape -> row round trip", () => {
    const [back] = announcementsToRows([announcementFromRow(row)]);
    expect(back).toEqual(row);
  });

  it("falls back to created_at when posted_at is missing", () => {
    const shape = announcementFromRow({ ...row, posted_at: null, created_at: POSTED });
    expect(shape.postedAt).toBe(POSTED);
  });

  it("fills a slug and defaults published to true", () => {
    const [back] = announcementsToRows([{ title: "Untitled" }]);
    expect(back.slug).toBe("announcement-1");
    expect(back.published).toBe(true);
    expect(back.id).toBeUndefined();
  });
});

describe("events", () => {
  const row = {
    id: "e1",
    slug: "skysprint-2026",
    title: "SkySprint 2026",
    when_status: "past",
    date_label: "12 Feb",
    time_label: "10:00",
    location: "Main ground",
    body: "Glider race.",
    image: "events/sky.webp",
    register_url: "https://example.com/register",
    detail: [{ heading: "Rules", body: "Be safe." }],
    gallery: ["events/1.webp"],
    published: true,
    sort_order: 0,
  };

  it("survives a row -> shape -> row round trip", () => {
    const [back] = eventsToRows([eventFromRow(row)]);
    expect(back).toEqual(row);
  });

  it("slugifies the title when the slug is empty", () => {
    const [back] = eventsToRows([{ title: "Wind Craft: A Workshop" }]);
    expect(back.slug).toBe("wind-craft-a-workshop");
    expect(back.when_status).toBe("upcoming");
  });
});

describe("achievements", () => {
  const row = {
    id: "ach1",
    title: "First place",
    year_label: "2025",
    tag: "Award",
    body: "Won the regional.",
    posted_at: POSTED,
    published: true,
    sort_order: 0,
  };

  it("survives a row -> shape -> row round trip", () => {
    const [back] = achievementsToRows([achievementFromRow(row)]);
    expect(back).toEqual(row);
  });
});

describe("projects", () => {
  const partRow = {
    id: "p1-a",
    project_id: "p1",
    slug: "wing",
    name: "Wing",
    blurb: "The wing.",
    image: "",
    detail: [],
    specs: [{ label: "Span", value: "1.2 m" }],
    model: "models/wing.glb",
    model_caption: "Wing CAD",
    cad: [],
    sort_order: 0,
  };

  const row = {
    id: "p1",
    slug: "glider",
    n: "01",
    title: "Glider",
    status: "Ongoing",
    timeline: "2025-26",
    summary: "A glider.",
    body: "Long text.",
    image: "projects/glider.webp",
    published: true,
    model: "",
    model_caption: "",
    cad: [],
    thesis: [],
    telemetry_csv: "t,alt\n0,0",
    telemetry_x: "t",
    telemetry_title: "Flight",
    telemetry_blurb: "",
    telemetry_charts: [],
    sort_order: 0,
  };

  it("survives a row -> shape -> row round trip, parts included", () => {
    const shape = projectFromRow({ ...row, project_parts: [partRow] });
    const [back] = projectsToRows([shape]);
    expect(back).toEqual(row);
    expect(projectPartsToRows(shape.parts, "p1")).toEqual([partRow]);
  });

  it("orders parts by sort_order", () => {
    const shape = projectFromRow({
      ...row,
      project_parts: [
        { ...partRow, slug: "tail", sort_order: 2 },
        { ...partRow, slug: "nose", sort_order: 1 },
      ],
    });
    expect(shape.parts.map((p) => p.slug)).toEqual(["nose", "tail"]);
  });
});

describe("cohort members", () => {
  it("public member shape has no email key", () => {
    const member = cohortMemberFromRow(memberRow);
    expect(member).not.toHaveProperty("email");
    expect(JSON.stringify(member)).not.toContain("asha@example.com");
  });

  it("public cohort shape has no email anywhere", () => {
    const cohort = cohortFromRow({ id: "c1", year: "2025", cohort_members: [memberRow] });
    for (const member of cohort.members) expect(member).not.toHaveProperty("email");
    expect(JSON.stringify(cohort)).not.toContain("@example.com");
  });

  it("public column list never asks for email", () => {
    const columns = PUBLIC_MEMBER_COLUMNS.split(",").map((c) => c.trim());
    expect(columns).not.toContain("email");
    expect(columns).not.toContain("*");
  });

  it("admin shape keeps the email so the dashboard can save it", () => {
    expect(cohortMemberAdminFromRow(memberRow).email).toBe("asha@example.com");
  });

  it("admin cohort survives a row -> shape -> row round trip", () => {
    const cohortRow = { id: "c1", year: "2025", tag: "Current", blurb: "", is_current: true, sort_order: 0 };
    const shape = cohortAdminFromRow({ ...cohortRow, cohort_members: [memberRow] });
    expect(cohortsToRows([shape])).toEqual([cohortRow]);
    expect(cohortMembersToRows(shape.members, "c1")).toEqual([memberRow]);
  });
});
