export interface SavedPlanState {
  majorId: string;
  completedCodes: string[];
  plannedCodes: string[];
  pinnedSections: Record<string, string>;
  registeredCrns: string[];
  customCodes: string[];
}

const STORAGE_KEY = "planabull_state_v1";

export function loadPlanState(): SavedPlanState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedPlanState>;
    if (!parsed || typeof parsed !== "object" || typeof parsed.majorId !== "string") {
      return null;
    }
    return {
      majorId: parsed.majorId,
      completedCodes: Array.isArray(parsed.completedCodes) ? parsed.completedCodes : [],
      plannedCodes: Array.isArray(parsed.plannedCodes) ? parsed.plannedCodes : [],
      pinnedSections:
        parsed.pinnedSections && typeof parsed.pinnedSections === "object"
          ? parsed.pinnedSections
          : {},
      registeredCrns: Array.isArray(parsed.registeredCrns) ? parsed.registeredCrns : [],
      customCodes: Array.isArray(parsed.customCodes) ? parsed.customCodes : [],
    };
  } catch {
    return null;
  }
}

export function savePlanState(state: SavedPlanState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota or private-mode errors
  }
}