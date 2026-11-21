import { CheckCircle2, ClipboardCopy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMeetingTime } from "@/lib/optimizer";
import { CURRENT_TERM, type CourseSection, type DegreeCourse } from "@/lib/usf-data";

interface RegistrationCartProps {
  sections: CourseSection[];
  coursesByCode: Record<string, DegreeCourse>;
  registeredCrns: string[];
  onToggleRegistered: (crn: string) => void;
  onMarkAllRegistered: (crns: string[]) => void;
}

export function RegistrationCart({
  sections,
  coursesByCode,
  registeredCrns,
  onToggleRegistered,
  onMarkAllRegistered,
}: RegistrationCartProps) {
  const totalCredits = sections.reduce(
    (sum, s) => sum + (coursesByCode[s.courseCode]?.credits ?? 3),
    0,
  );
  const registeredCount = sections.filter((s) => registeredCrns.includes(s.crn)).length;

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label);
    } catch {
      toast.error("Could not copy automatically — select and copy the CRN manually.");
    }
  }

  return (
    <section id="registration-cart" className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            USF OASIS Registration Cart · {CURRENT_TERM}
          </h2>
          <p className="text-xs text-muted-foreground">
            {sections.length} courses · {totalCredits} credits · {registeredCount}/{sections.length} marked registered
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={sections.length === 0}
            onClick={() =>
              copyText(
                sections.map((s) => s.crn).join(", "),
                `Copied ${sections.length} CRNs to clipboard`,
              )
            }
          >
            <ClipboardCopy className="mr-1.5 h-3.5 w-3.5" />
            Copy All CRNs
          </Button>
          <Button size="sm" asChild>
            <a href="https://oasis.usf.edu/" target="_blank" rel="noreferrer">
              Open USF OASIS <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </div>

      {sections.length === 0 ? (
        <p className="mt-4 rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
          Select courses in your degree plan to generate your OASIS CRN packet.
        </p>
      ) : (
        <>
          <div className="mt-3 overflow-x-auto rounded-md border">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">CRN</th>
                  <th className="px-3 py-2 font-medium">Course</th>
                  <th className="px-3 py-2 font-medium">Professor</th>
                  <th className="px-3 py-2 font-medium">Schedule</th>
                  <th className="px-3 py-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sections.map((sec) => {
                  const isRegistered = registeredCrns.includes(sec.crn);
                  const course = coursesByCode[sec.courseCode];
                  return (
                    <tr key={sec.crn} className={isRegistered ? "bg-secondary/35" : ""}>
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => copyText(sec.crn, `Copied CRN ${sec.crn}`)}
                          className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 font-mono font-semibold text-foreground hover:bg-secondary"
                          title="Copy CRN"
                        >
                          {sec.crn}
                          <ClipboardCopy className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-mono font-semibold text-primary">{sec.courseCode}</div>
                        <div className="text-muted-foreground">{course?.title ?? "Course"}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-medium">{sec.professor.name}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">
                          RMP {sec.professor.rmpScore.toFixed(1)} · Coursicle {sec.professor.coursicleScore.toFixed(1)}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        <div>{formatMeetingTime(sec)}</div>
                        <div>{sec.campus} · {sec.seatsOpen > 0 ? `${sec.seatsOpen} open` : "Waitlist"}</div>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant={isRegistered ? "default" : "outline"}
                          className="h-7 px-2.5 text-xs"
                          onClick={() => onToggleRegistered(sec.crn)}
                        >
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                          {isRegistered ? "Registered" : "Mark Done"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
            <p>
              <span className="font-semibold text-foreground">How to register in OASIS:</span>{" "}
              Sign in via MyUSF → Student → Registration → Register, Add or Drop Classes → paste these CRNs into the worksheet boxes and submit.
            </p>
            {registeredCount < sections.length ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onMarkAllRegistered(sections.map((s) => s.crn))}
              >
                Mark all registered
              </Button>
            ) : (
              <Badge variant="default">All courses registered</Badge>
            )}
          </div>
        </>
      )}
    </section>
  );
}