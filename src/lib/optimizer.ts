import type { CourseSection, DayCode, DegreeCourse } from "./usf-data";

export type OptimizationPreset =
  | "highest-rated"
  | "balanced"
  | "no-early-mornings"
  | "compact-days";

export interface OptimizerOptions {
  preset: OptimizationPreset;
  openSeatsOnly: boolean;
  pinnedSections?: Record<string, string>;
}

export interface OptimizationResult {
  selected: CourseSection[];
  unscheduled: string[];
  avgRmp: number;
  avgCoursicle: number;
  totalDaysOnCampus: number;
  hasConflicts: boolean;
}

export function sectionsConflict(a: CourseSection, b: CourseSection): boolean {
  if (a.days.length === 0 || b.days.length === 0) return false;
  const sharedDay = a.days.some((d) => b.days.includes(d));
  if (!sharedDay) return false;
  return a.startMin < b.endMin && b.startMin < a.endMin;
}

export function formatMinutes(mins: number): string {
  const hour24 = Math.floor(mins / 60);
  const minute = mins % 60;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minute.toString().padStart(2, "0")} ${suffix}`;
}

export function formatMeetingTime(section: CourseSection): string {
  if (section.days.length === 0) return "Online · Async";
  return `${section.days.join("")} ${formatMinutes(section.startMin)}–${formatMinutes(section.endMin)}`;
}

function scoreCombination(sections: CourseSection[], preset: OptimizationPreset): number {
  if (sections.length === 0) return 0;
  const avgRmp =
    sections.reduce((sum, s) => sum + s.professor.rmpScore, 0) / sections.length;
  const avgCoursicle =
    sections.reduce((sum, s) => sum + s.professor.coursicleScore, 0) / sections.length;
  const avgWouldTake =
    sections.reduce((sum, s) => sum + s.professor.wouldTakeAgain, 0) / sections.length;

  const campusDays = new Set<DayCode>();
  let earlyPenalty = 0;
  let openBonus = 0;

  for (const s of sections) {
    for (const d of s.days) campusDays.add(d);
    if (s.days.length > 0 && s.startMin < 600) {
      earlyPenalty += 1.5;
    }
    if (s.seatsOpen > 0) openBonus += 0.25;
  }

  const ratingScore = avgRmp * 1.4 + avgCoursicle * 1.0 + (avgWouldTake / 100) * 1.2;
  const dayPenalty = campusDays.size * 0.45;

  switch (preset) {
    case "highest-rated":
      return ratingScore * 2.2 + openBonus;
    case "no-early-mornings":
      return ratingScore * 1.4 - earlyPenalty * 3.5 + openBonus;
    case "compact-days":
      return ratingScore * 1.2 - dayPenalty * 3.0 + openBonus;
    case "balanced":
    default:
      return ratingScore * 1.5 - earlyPenalty * 0.8 - dayPenalty * 0.9 + openBonus;
  }
}

export function optimizeSchedule(
  courses: DegreeCourse[],
  options: OptimizerOptions,
): OptimizationResult {
  const pinned = options.pinnedSections ?? {};
  const candidates: { courseCode: string; sections: CourseSection[] }[] = [];
  const unscheduled: string[] = [];

  for (const course of courses) {
    const pinnedCrn = pinned[course.code];
    let eligible = course.sections;

    if (pinnedCrn) {
      const found = course.sections.find((s) => s.crn === pinnedCrn);
      if (found) {
        eligible = [found];
      }
    } else if (options.openSeatsOnly) {
      eligible = course.sections.filter((s) => s.seatsOpen > 0);
    }

    if (eligible.length === 0) {
      unscheduled.push(course.code);
    } else {
      candidates.push({ courseCode: course.code, sections: eligible });
    }
  }

  let bestCombo: CourseSection[] = [];
  let bestScore = -Infinity;

  const current: CourseSection[] = [];

  function backtrack(index: number): void {
    if (index === candidates.length) {
      if (
        current.length > bestCombo.length ||
        (current.length === bestCombo.length &&
          scoreCombination(current, options.preset) > bestScore)
      ) {
        bestCombo = [...current];
        bestScore = scoreCombination(current, options.preset);
      }
      return;
    }

    const item = candidates[index];
    if (!item) return;

    let placedAny = false;
    for (const sec of item.sections) {
      const conflicts = current.some((chosen) => sectionsConflict(chosen, sec));
      if (!conflicts) {
        placedAny = true;
        current.push(sec);
        backtrack(index + 1);
        current.pop();
      }
    }

    // Allow skipping this course if every section conflicts so the rest can still schedule
    if (!placedAny) {
      backtrack(index + 1);
    }
  }

  backtrack(0);

  const scheduledCodes = new Set(bestCombo.map((s) => s.courseCode));
  for (const c of candidates) {
    if (!scheduledCodes.has(c.courseCode)) {
      unscheduled.push(c.courseCode);
    }
  }

  const avgRmp =
    bestCombo.length > 0
      ? Number(
          (
            bestCombo.reduce((sum, s) => sum + s.professor.rmpScore, 0) / bestCombo.length
          ).toFixed(2),
        )
      : 0;
  const avgCoursicle =
    bestCombo.length > 0
      ? Number(
          (
            bestCombo.reduce((sum, s) => sum + s.professor.coursicleScore, 0) /
            bestCombo.length
          ).toFixed(2),
        )
      : 0;

  const daysSet = new Set<DayCode>();
  for (const s of bestCombo) {
    for (const d of s.days) daysSet.add(d);
  }

  return {
    selected: bestCombo,
    unscheduled,
    avgRmp,
    avgCoursicle,
    totalDaysOnCampus: daysSet.size,
    hasConflicts: false,
  };
}

/**
 * Extracts USF course codes (e.g. "COP 4530", "MAC2311", "CHM 2045L") from pasted
 * USF catalog text or degree audit snippets.
 */
export function parseCatalogText(raw: string): string[] {
  const regex = /\b([A-Z]{3})\s?(\d{4}[A-Z]?)\b/g;
  const seen = new Set<string>();
  const matches: string[] = [];
  const upper = raw.toUpperCase();
  let match = regex.exec(upper);
  while (match !== null) {
    const prefix = match[1];
    const num = match[2];
    if (prefix && num) {
      const normalized = `${prefix} ${num}`;
      if (!seen.has(normalized)) {
        seen.add(normalized);
        matches.push(normalized);
      }
    }
    match = regex.exec(upper);
  }
  return matches;
}