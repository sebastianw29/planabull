import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CalendarCheck2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DegreePlanPanel } from "@/components/DegreePlanPanel";
import { WeeklySchedule } from "@/components/WeeklySchedule";
import { RegistrationCart } from "@/components/RegistrationCart";
import { optimizeSchedule, type OptimizationPreset } from "@/lib/optimizer";
import { loadPlanState, savePlanState } from "@/lib/storage";
import {
  buildCustomCatalogCourse,
  CURRENT_TERM,
  USF_DEGREE_PLANS,
  type DegreeCourse,
} from "@/lib/usf-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PlanABull — USF Class Registration Optimizer" },
      {
        name: "description",
        content:
          "Import your USF catalog degree plan, compare Rate My Professors and Coursicle ratings, build a conflict-free schedule, and copy CRNs for OASIS.",
      },
      { property: "og:title", content: "PlanABull — USF Class Registration Optimizer" },
      {
        property: "og:description",
        content:
          "Import your USF catalog degree plan, compare Rate My Professors and Coursicle ratings, build a conflict-free schedule, and copy CRNs for OASIS.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlanABullPage,
});

const DEFAULT_PLAN = USF_DEGREE_PLANS[0]!;
const DEFAULT_PLANNED = DEFAULT_PLAN.courses.slice(0, 4).map((c) => c.code);

function PlanABullPage() {
  const [hydrated, setHydrated] = useState(false);
  const [majorId, setMajorId] = useState(DEFAULT_PLAN.id);
  const [completedCodes, setCompletedCodes] = useState<string[]>([]);
  const [plannedCodes, setPlannedCodes] = useState<string[]>(DEFAULT_PLANNED);
  const [pinnedSections, setPinnedSections] = useState<Record<string, string>>({});
  const [registeredCrns, setRegisteredCrns] = useState<string[]>([]);
  const [customCodes, setCustomCodes] = useState<string[]>([]);
  const [preset, setPreset] = useState<OptimizationPreset>("highest-rated");
  const [openSeatsOnly, setOpenSeatsOnly] = useState(true);

  useEffect(() => {
    const saved = loadPlanState();
    if (saved) {
      setMajorId(saved.majorId);
      setCompletedCodes(saved.completedCodes);
      setPlannedCodes(saved.plannedCodes);
      setPinnedSections(saved.pinnedSections);
      setRegisteredCrns(saved.registeredCrns);
      setCustomCodes(saved.customCodes);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    savePlanState({
      majorId,
      completedCodes,
      plannedCodes,
      pinnedSections,
      registeredCrns,
      customCodes,
    });
  }, [hydrated, majorId, completedCodes, plannedCodes, pinnedSections, registeredCrns, customCodes]);

  const selectedPlan = useMemo(
    () => USF_DEGREE_PLANS.find((p) => p.id === majorId) ?? DEFAULT_PLAN,
    [majorId],
  );

  const allCourses = useMemo(() => {
    const baseCodes = new Set(selectedPlan.courses.map((c) => c.code));
    const extras = customCodes
      .filter((code) => !baseCodes.has(code))
      .map((code) => buildCustomCatalogCourse(code));
    return [...selectedPlan.courses, ...extras];
  }, [selectedPlan, customCodes]);

  const coursesByCode = useMemo(() => {
    const map: Record<string, DegreeCourse> = {};
    for (const c of allCourses) map[c.code] = c;
    return map;
  }, [allCourses]);

  const plannedCourseObjs = useMemo(
    () => allCourses.filter((c) => plannedCodes.includes(c.code)),
    [allCourses, plannedCodes],
  );

  const optimization = useMemo(
    () =>
      optimizeSchedule(plannedCourseObjs, {
        preset,
        openSeatsOnly,
        pinnedSections,
      }),
    [plannedCourseObjs, preset, openSeatsOnly, pinnedSections],
  );

  const totalCredits = optimization.selected.reduce(
    (sum, s) => sum + (coursesByCode[s.courseCode]?.credits ?? 3),
    0,
  );
  const pinnedCount = Object.keys(pinnedSections).length;

  function handleSelectMajor(newMajorId: string) {
    const nextPlan = USF_DEGREE_PLANS.find((p) => p.id === newMajorId);
    if (!nextPlan) return;
    setMajorId(newMajorId);
    setCompletedCodes([]);
    setPlannedCodes(nextPlan.courses.slice(0, 4).map((c) => c.code));
    setPinnedSections({});
    setCustomCodes([]);
    toast.success(`Loaded ${nextPlan.name} degree plan`);
  }

  function handleToggleCompleted(code: string) {
    setCompletedCodes((prev) => {
      const nextDone = !prev.includes(code);
      if (nextDone) {
        setPlannedCodes((p) => p.filter((c) => c !== code));
        return [...prev, code];
      }
      return prev.filter((c) => c !== code);
    });
  }

  function handleTogglePlanned(code: string) {
    setPlannedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  function handlePinSection(courseCode: string, crn: string | null) {
    setPinnedSections((prev) => {
      const copy = { ...prev };
      if (crn === null) {
        delete copy[courseCode];
      } else {
        copy[courseCode] = crn;
      }
      return copy;
    });
  }

  function handleImportCatalogCodes(codes: string[]) {
    const existingSet = new Set(allCourses.map((c) => c.code));
    const brandNew = codes.filter((c) => !existingSet.has(c));
    if (brandNew.length > 0) {
      setCustomCodes((prev) => Array.from(new Set([...prev, ...brandNew])));
    }
    setPlannedCodes((prev) => Array.from(new Set([...prev, ...codes])));
    toast.success(`Added ${codes.length} course${codes.length === 1 ? "" : "s"} from USF catalog text`);
  }

  function handleToggleRegistered(crn: string) {
    setRegisteredCrns((prev) =>
      prev.includes(crn) ? prev.filter((c) => c !== crn) : [...prev, crn],
    );
  }

  function handleMarkAllRegistered(crns: string[]) {
    setRegisteredCrns((prev) => Array.from(new Set([...prev, ...crns])));
    toast.success("Marked all scheduled courses as registered");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-baseline gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-primary">
              PlanABull
            </h1>
            <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
              USF Degree & Registration Optimizer
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <Badge variant="secondary" className="font-mono text-xs">{CURRENT_TERM}</Badge>
            <Button size="sm" variant="outline" asChild>
              <a href="#registration-cart">
                <CalendarCheck2 className="mr-1.5 h-3.5 w-3.5" />
                Cart ({optimization.selected.length} CRNs)
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
          <div className="min-w-0">
            <DegreePlanPanel
            plans={USF_DEGREE_PLANS}
            selectedPlan={selectedPlan}
            courses={allCourses}
            completedCodes={completedCodes}
            plannedCodes={plannedCodes}
            selectedSections={optimization.selected}
            pinnedSections={pinnedSections}
            onSelectMajor={handleSelectMajor}
            onToggleCompleted={handleToggleCompleted}
            onTogglePlanned={handleTogglePlanned}
            onPinSection={handlePinSection}
            onImportCatalogCodes={handleImportCatalogCodes}
            />
          </div>

          <div className="min-w-0 space-y-6">
            <section className="rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <Label htmlFor="preset-select" className="text-xs font-semibold">
                      Optimize for
                    </Label>
                  </div>
                  <Select value={preset} onValueChange={(v) => setPreset(v as OptimizationPreset)}>
                    <SelectTrigger id="preset-select" className="h-8 w-44 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="highest-rated">Highest Rated Profs</SelectItem>
                      <SelectItem value="balanced">Balanced Schedule</SelectItem>
                      <SelectItem value="no-early-mornings">No Early Mornings</SelectItem>
                      <SelectItem value="compact-days">Fewest Campus Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="open-seats-toggle"
                      checked={openSeatsOnly}
                      onCheckedChange={setOpenSeatsOnly}
                    />
                    <Label htmlFor="open-seats-toggle" className="text-xs">
                      Open seats only
                    </Label>
                  </div>
                  {pinnedCount > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setPinnedSections({})}
                    >
                      Clear {pinnedCount} pin{pinnedCount === 1 ? "" : "s"}
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5 border-t pt-3 sm:grid-cols-4">
                <div className="rounded-md bg-muted/50 px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">Planned Credits</p>
                  <p className="font-mono text-lg font-semibold">{totalCredits}</p>
                </div>
                <div className="rounded-md bg-muted/50 px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">Avg RMP Rating</p>
                  <p className="font-mono text-lg font-semibold text-primary">
                    {optimization.avgRmp > 0 ? `${optimization.avgRmp.toFixed(2)}/5` : "—"}
                  </p>
                </div>
                <div className="rounded-md bg-muted/50 px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">Avg Coursicle</p>
                  <p className="font-mono text-lg font-semibold">
                    {optimization.avgCoursicle > 0 ? `${optimization.avgCoursicle.toFixed(2)}/5` : "—"}
                  </p>
                </div>
                <div className="rounded-md bg-muted/50 px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">Campus Days</p>
                  <p className="font-mono text-lg font-semibold">{optimization.totalDaysOnCampus} / wk</p>
                </div>
              </div>

              {optimization.unscheduled.length > 0 && (
                <div className="mt-3 flex items-start gap-2 rounded-md border border-warning/50 bg-accent/60 px-3 py-2 text-xs text-accent-foreground">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <p>
                    Could not schedule{" "}
                    <span className="font-mono font-semibold">
                      {optimization.unscheduled.join(", ")}
                    </span>{" "}
                    without a conflict or waitlist. Try unpinning a section or turning off &ldquo;Open seats only&rdquo;.
                  </p>
                </div>
              )}
            </section>

            <WeeklySchedule
              sections={optimization.selected}
              coursesByCode={coursesByCode}
              pinnedSections={pinnedSections}
              onPinSection={handlePinSection}
            />

            <RegistrationCart
              sections={optimization.selected}
              coursesByCode={coursesByCode}
              registeredCrns={registeredCrns}
              onToggleRegistered={handleToggleRegistered}
              onMarkAllRegistered={handleMarkAllRegistered}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
