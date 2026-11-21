import { Clock, Laptop, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { formatMeetingTime, formatMinutes } from "@/lib/optimizer";
import type { CourseSection, DayCode, DegreeCourse } from "@/lib/usf-data";

const DAYS: { code: DayCode; label: string }[] = [
  { code: "M", label: "Mon" },
  { code: "T", label: "Tue" },
  { code: "W", label: "Wed" },
  { code: "R", label: "Thu" },
  { code: "F", label: "Fri" },
];

const START_MIN = 8 * 60;
const END_MIN = 18 * 60 + 30;
const TOTAL_MINS = END_MIN - START_MIN;
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

const BLOCK_STYLES = [
  "border-primary/40 bg-secondary text-secondary-foreground",
  "border-gold/60 bg-accent text-accent-foreground",
  "border-chart-2/40 bg-chart-2/15 text-foreground",
  "border-chart-4/40 bg-chart-4/15 text-foreground",
  "border-chart-5/40 bg-chart-5/15 text-foreground",
];

interface WeeklyScheduleProps {
  sections: CourseSection[];
  coursesByCode: Record<string, DegreeCourse>;
  pinnedSections: Record<string, string>;
  onPinSection: (courseCode: string, crn: string | null) => void;
}

export function WeeklySchedule({
  sections,
  coursesByCode,
  pinnedSections,
  onPinSection,
}: WeeklyScheduleProps) {
  const inPerson = sections.filter((s) => s.days.length > 0);
  const asyncCourses = sections.filter((s) => s.days.length === 0);

  const colorIndexByCourse: Record<string, number> = {};
  sections.forEach((s, idx) => {
    if (colorIndexByCourse[s.courseCode] === undefined) {
      colorIndexByCourse[s.courseCode] = idx % BLOCK_STYLES.length;
    }
  });

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Optimized Weekly Schedule</h2>
          <p className="text-xs text-muted-foreground">
            Click any class block to swap sections or compare professors
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          8:00 AM – 6:30 PM
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[540px]">
          <div className="grid grid-cols-[54px_repeat(5,1fr)] border-b pb-2 text-xs font-medium text-muted-foreground">
            <div />
            {DAYS.map((day) => (
              <div key={day.code} className="text-center font-semibold text-foreground">
                {day.label}
              </div>
            ))}
          </div>

          <div className="relative grid grid-cols-[54px_repeat(5,1fr)]" style={{ height: 460 }}>
            <div className="relative border-r pr-2 text-right font-mono text-[10px] text-muted-foreground">
              {HOURS.map((hr) => {
                const top = ((hr * 60 - START_MIN) / TOTAL_MINS) * 100;
                return (
                  <div
                    key={hr}
                    className="absolute right-2 -translate-y-1/2"
                    style={{ top: `${top}%` }}
                  >
                    {hr === 12 ? "12 PM" : hr > 12 ? `${hr - 12} PM` : `${hr} AM`}
                  </div>
                );
              })}
            </div>

            {DAYS.map((day) => {
              const daySections = inPerson.filter((s) => s.days.includes(day.code));
              return (
                <div key={day.code} className="relative border-r last:border-r-0">
                  {HOURS.map((hr) => {
                    const top = ((hr * 60 - START_MIN) / TOTAL_MINS) * 100;
                    return (
                      <div
                        key={hr}
                        className="pointer-events-none absolute inset-x-0 border-t border-border/60"
                        style={{ top: `${top}%` }}
                      />
                    );
                  })}

                  {daySections.map((sec) => {
                    const topPct = Math.max(0, ((sec.startMin - START_MIN) / TOTAL_MINS) * 100);
                    const heightPct = Math.max(7, ((sec.endMin - sec.startMin) / TOTAL_MINS) * 100);
                    const styleIdx = colorIndexByCourse[sec.courseCode] ?? 0;
                    const blockStyle = BLOCK_STYLES[styleIdx] ?? BLOCK_STYLES[0];
                    const course = coursesByCode[sec.courseCode];
                    const isPinned = pinnedSections[sec.courseCode] === sec.crn;

                    return (
                      <Popover key={`${sec.crn}-${day.code}`}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={`absolute inset-x-1 overflow-hidden rounded-md border p-1.5 text-left transition-shadow hover:shadow-md ${blockStyle}`}
                            style={{ top: `${topPct}%`, height: `${heightPct}%` }}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate font-mono text-[11px] font-semibold">
                                {sec.courseCode}
                              </span>
                              <span className="inline-flex shrink-0 items-center gap-0.5 font-mono text-[10px]">
                                <Star className="h-2.5 w-2.5 fill-gold text-gold" />
                                {sec.professor.rmpScore.toFixed(1)}
                              </span>
                            </div>
                            <p className="truncate text-[11px] leading-tight">{sec.professor.name}</p>
                            <p className="truncate font-mono text-[10px] opacity-80">
                              {formatMinutes(sec.startMin)} · {sec.location}
                            </p>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-3 text-xs">
                          <p className="font-mono font-semibold text-primary">
                            {sec.courseCode} · {course?.title ?? "Course"}
                          </p>
                          <p className="mt-0.5 text-muted-foreground">
                            {sec.professor.name} · CRN {sec.crn} · {formatMeetingTime(sec)}
                          </p>
                          <div className="mt-2 space-y-1">
                            <p className="font-medium text-foreground">Switch section:</p>
                            {(course?.sections ?? [sec]).map((alt) => (
                              <button
                                key={alt.crn}
                                type="button"
                                onClick={() => onPinSection(sec.courseCode, alt.crn)}
                                className={
                                  alt.crn === sec.crn
                                    ? "flex w-full items-center justify-between rounded border border-primary bg-secondary/60 px-2 py-1.5 text-left"
                                    : "flex w-full items-center justify-between rounded border px-2 py-1.5 text-left hover:bg-muted"
                                }
                              >
                                <div>
                                  <div className="font-medium">{alt.professor.name}</div>
                                  <div className="text-[11px] text-muted-foreground">
                                    {formatMeetingTime(alt)} · {alt.seatsOpen} open
                                  </div>
                                </div>
                                <Badge variant="outline" className="font-mono text-[10px]">
                                  {alt.professor.rmpScore.toFixed(1)}
                                </Badge>
                              </button>
                            ))}
                          </div>
                          {isPinned && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="mt-2 h-7 w-full text-xs"
                              onClick={() => onPinSection(sec.courseCode, null)}
                            >
                              Unpin & let optimizer choose
                            </Button>
                          )}
                        </PopoverContent>
                      </Popover>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {asyncCourses.length > 0 && (
        <div className="mt-4 rounded-md border bg-muted/40 p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Laptop className="h-3.5 w-3.5 text-primary" />
            Online / Asynchronous Courses
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {asyncCourses.map((sec) => (
              <div
                key={sec.crn}
                className="flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-xs"
              >
                <span className="font-mono font-semibold text-primary">{sec.courseCode}</span>
                <span>{sec.professor.name}</span>
                <Badge variant="outline" className="font-mono text-[10px]">
                  RMP {sec.professor.rmpScore.toFixed(1)}
                </Badge>
                <span className="font-mono text-[11px] text-muted-foreground">CRN {sec.crn}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}