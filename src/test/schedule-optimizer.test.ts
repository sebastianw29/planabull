import { describe, expect, it } from "vitest";
import { optimizeSchedule, parseCatalogText, sectionsConflict } from "@/lib/optimizer";
import { USF_DEGREE_PLANS } from "@/lib/usf-data";

const csPlan = USF_DEGREE_PLANS.find((p) => p.id === "cs")!;

describe("PlanABull schedule optimizer", () => {
  it("detects overlapping meeting times on shared days and allows online async", () => {
    const cop = csPlan.courses.find((c) => c.code === "COP 4530")!;
    const cda = csPlan.courses.find((c) => c.code === "CDA 3103")!;
    const cis = csPlan.courses.find((c) => c.code === "CIS 4250")!;

    const mwMorning = cop.sections[0]!; // M/W 9:30–10:45
    const mwEarly = cda.sections[1]!; // M/W 8:30–9:45 (overlaps 9:30–9:45)
    const trLate = cda.sections[0]!; // T/R 11:00–12:15 (no overlap)
    const asyncOnline = cis.sections[0]!; // Online async

    expect(sectionsConflict(mwMorning, mwEarly)).toBe(true);
    expect(sectionsConflict(mwMorning, trLate)).toBe(false);
    expect(sectionsConflict(mwMorning, asyncOnline)).toBe(false);
  });

  it("skips waitlisted sections when openSeatsOnly is true and picks highest rated open section", () => {
    const cop = csPlan.courses.find((c) => c.code === "COP 4530")!;
    // Sec 002 (CRN 14822) has 4.8 RMP but 0 seats open; Sec 001 (CRN 14821) has 4.6 RMP and 9 seats open
    const openOnly = optimizeSchedule([cop], { preset: "highest-rated", openSeatsOnly: true });
    expect(openOnly.selected[0]?.crn).toBe("14821");

    const includeWaitlist = optimizeSchedule([cop], { preset: "highest-rated", openSeatsOnly: false });
    expect(includeWaitlist.selected[0]?.crn).toBe("14822");
  });

  it("avoids early mornings before 10 AM when no-early-mornings is selected", () => {
    const cop = csPlan.courses.find((c) => c.code === "COP 4530")!;
    const result = optimizeSchedule([cop], { preset: "no-early-mornings", openSeatsOnly: true });
    // Sec 001 starts at 9:30 AM (570); Sec 003 starts at 2:00 PM (840)
    expect(result.selected[0]?.crn).toBe("14823");
  });

  it("extracts unique normalized USF course codes from pasted catalog text", () => {
    const sample =
      "Required: COP 4530 Data Structures, cda3103 Computer Organization, CHM 2045L Lab, and COP 4530 again.";
    expect(parseCatalogText(sample)).toEqual(["COP 4530", "CDA 3103", "CHM 2045L"]);
  });
});