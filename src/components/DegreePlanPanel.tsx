import { useState } from "react";
import { Check, ExternalLink, FileText, Pin, PinOff, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  coursicleUrl,
  rmpSearchUrl,
  type CourseSection,
  type DegreeCourse,
  type DegreePlan,
} from "@/lib/usf-data";
import { formatMeetingTime, parseCatalogText } from "@/lib/optimizer";

interface DegreePlanPanelProps {
  plans: DegreePlan[];
  selectedPlan: DegreePlan;
  courses: DegreeCourse[];
  completedCodes: string[];
  plannedCodes: string[];
  selectedSections: CourseSection[];
  pinnedSections: Record<string, string>;
  onSelectMajor: (majorId: string) => void;
  onToggleCompleted: (code: string) => void;
  onTogglePlanned: (code: string) => void;
  onPinSection: (courseCode: string, crn: string | null) => void;
  onImportCatalogCodes: (codes: string[]) => void;
}

export function DegreePlanPanel({
  plans,
  selectedPlan,
  courses,
  completedCodes,
  plannedCodes,
  selectedSections,
  pinnedSections,
  onSelectMajor,
  onToggleCompleted,
  onTogglePlanned,
  onPinSection,
  onImportCatalogCodes,
}: DegreePlanPanelProps) {
  const [importOpen, setImportOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [importError, setImportError] = useState("");

  const selectedCrnSet = new Set(selectedSections.map((s) => s.crn));
  const plannedCourses = courses.filter((c) => plannedCodes.includes(c.code));

  function handleImportSubmit() {
    const codes = parseCatalogText(pasteText);
    if (codes.length === 0) {
      setImportError("No USF course codes found. Try pasting codes like COP 4530 or MAC 2311.");
      return;
    }
    onImportCatalogCodes(codes);
    setPasteText("");
    setImportError("");
    setImportOpen(false);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold tracking-tight">USF Degree Plan</h2>
            <p className="text-xs text-muted-foreground">{selectedPlan.college} · {selectedPlan.catalogYear}</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileText className="mr-1.5 h-3.5 w-3.5" />
                  Paste Catalog
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import from USF Catalog or DegreeWorks</DialogTitle>
                  <DialogDescription>
                    Paste course requirements from catalog.usf.edu and PlanABull will extract every USF course code.
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  rows={5}
                  value={pasteText}
                  onChange={(e) => {
                    setPasteText(e.target.value);
                    setImportError("");
                  }}
                  placeholder="Example: COP 4530 Data Structures, CDA 3103 Computer Organization, CAP 4630 Intro to AI"
                />
                {importError && <p className="text-xs text-destructive">{importError}</p>}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
                  <Button onClick={handleImportSubmit}>Import Courses</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="sm" asChild>
              <a href={selectedPlan.catalogUrl} target="_blank" rel="noreferrer">
                Catalog <ExternalLink className="ml-1 h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-3">
          <Select value={selectedPlan.id} onValueChange={onSelectMajor}>
            <SelectTrigger aria-label="Select USF major">
              <SelectValue placeholder="Choose a USF major" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 divide-y rounded-md border">
          {courses.map((course) => {
            const isDone = completedCodes.includes(course.code);
            const isPlanned = plannedCodes.includes(course.code);
            return (
              <div key={course.code} className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 whitespace-nowrap font-mono text-xs font-semibold text-primary">
                      {course.code}
                    </span>
                    <span className={isDone ? "truncate text-muted-foreground line-through" : "truncate font-medium"}>
                      {course.title}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {course.credits} cr · {course.termRecommended} · {course.sections.length} sections
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant={isDone ? "secondary" : "ghost"}
                    className="h-7 px-2 text-xs"
                    onClick={() => onToggleCompleted(course.code)}
                    aria-label={`Mark ${course.code} completed`}
                  >
                    <Check className="mr-1 h-3 w-3" />
                    {isDone ? "Done" : "Taken"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={isPlanned ? "default" : "outline"}
                    className="h-7 px-2.5 text-xs"
                    disabled={isDone}
                    onClick={() => onTogglePlanned(course.code)}
                  >
                    {isPlanned ? "Planned" : <><Plus className="mr-1 h-3 w-3" />Plan</>}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Professor Ratings & Sections</h2>
            <p className="text-xs text-muted-foreground">
              Rate My Professors & Coursicle scores · pin a section to lock it in
            </p>
          </div>
          <Badge variant="secondary">{plannedCourses.length} planned</Badge>
        </div>

        {plannedCourses.length === 0 ? (
          <p className="mt-4 rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            Pick courses above to compare professors and sections.
          </p>
        ) : (
          <div className="mt-3 space-y-4">
            {plannedCourses.map((course) => {
              const pinnedCrn = pinnedSections[course.code];
              return (
                <div key={course.code} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <span className="font-mono text-primary">{course.code}</span> · {course.title}
                    </h3>
                    <a
                      href={coursicleUrl(course.code)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Coursicle
                    </a>
                  </div>
                  <div className="space-y-1.5">
                    {course.sections.map((section) => {
                      const isSelected = selectedCrnSet.has(section.crn);
                      const isPinned = pinnedCrn === section.crn;
                      return (
                        <div
                          key={section.crn}
                          className={
                            isSelected
                              ? "rounded-md border border-primary bg-secondary/50 p-2.5 text-xs"
                              : "rounded-md border bg-background p-2.5 text-xs"
                          }
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <a
                                href={rmpSearchUrl(section.professor.name)}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-foreground hover:text-primary hover:underline"
                              >
                                {section.professor.name}
                              </a>
                              <span className="font-mono text-muted-foreground">CRN {section.crn}</span>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant={isPinned ? "default" : "ghost"}
                              className="h-6 px-2 text-xs"
                              onClick={() => onPinSection(course.code, isPinned ? null : section.crn)}
                            >
                              {isPinned ? (
                                <><PinOff className="mr-1 h-3 w-3" />Pinned</>
                              ) : (
                                <><Pin className="mr-1 h-3 w-3" />Pin</>
                              )}
                            </Button>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
                            <span>{formatMeetingTime(section)}</span>
                            <span>{section.campus} · {section.location}</span>
                            <span className={section.seatsOpen === 0 ? "font-medium text-destructive" : "text-success"}>
                              {section.seatsOpen > 0 ? `${section.seatsOpen}/${section.seatsTotal} seats` : "Waitlist (0 open)"}
                            </span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="gap-1 font-mono text-[11px]">
                              <Star className="h-3 w-3 fill-gold text-gold" />
                              RMP {section.professor.rmpScore.toFixed(1)}/5
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">
                              {section.professor.wouldTakeAgain}% take again · Diff {section.professor.rmpDifficulty.toFixed(1)}
                            </span>
                            <Badge variant="secondary" className="font-mono text-[11px]">
                              Coursicle {section.professor.coursicleScore.toFixed(1)}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}