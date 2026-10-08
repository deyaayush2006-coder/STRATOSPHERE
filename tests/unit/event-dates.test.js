import { describe, expect, it } from "vitest";
import { eventIcs, eventSchedule } from "@/lib/event-dates";

describe("event dates", () => {
  it("reads a single day with a time range in IST", () => {
    const s = eventSchedule({ date: "2 April 2026", time: "10:00 AM - 5:00 PM" });
    expect(s.start.toISOString()).toBe("2026-04-02T04:30:00.000Z");
    expect(s.end.toISOString()).toBe("2026-04-02T11:30:00.000Z");
  });

  it("reads a multi-day range with an en dash", () => {
    const s = eventSchedule({ date: "10–11 April 2026", time: "10:00 AM - 5:00 PM" });
    expect(s.end.toISOString()).toBe("2026-04-11T11:30:00.000Z");
  });

  it("falls back to an all-day event when the time is TBD", () => {
    const s = eventSchedule({ date: "14 Nov 2026", time: "TBD" });
    expect(s.allDay).toBe(true);
  });

  it("returns null for labels it cannot read", () => {
    for (const date of ["TBD", "", "Spring 2026", "31-30 April 2026"]) {
      expect(eventSchedule({ date, time: "10:00 AM - 5:00 PM" })).toBeNull();
    }
  });

  it("builds a valid, escaped calendar file", () => {
    const ics = eventIcs(
      { slug: "srijan", title: "Glide, Fly; Land", body: "Bring a pen", date: "10–11 April 2026", time: "10:00 AM - 5:00 PM", location: "JU, Kolkata" },
      "https://example.com",
      new Date("2026-01-01T00:00:00Z")
    );
    expect(ics).toContain("BEGIN:VCALENDAR\r\n");
    expect(ics).toContain("DTSTART:20260410T043000Z");
    expect(ics).toContain("SUMMARY:Glide\\, Fly\\; Land");
    expect(ics).toContain("LOCATION:JU\\, Kolkata");
    expect(eventIcs({ slug: "x", title: "x", date: "TBD" }, "https://example.com")).toBeNull();
  });
});
