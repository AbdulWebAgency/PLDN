import { cn } from "@/lib/utils";
import type { Finding } from "@/types/pldn";

const SEVERITY_DOT: Record<Finding["severity"], string> = {
  high: "bg-sev-crit",
  medium: "bg-sev-med",
  low: "bg-sev-low",
};

interface ConcernsOverviewProps {
  situation: string;
  goalLabel: string;
  findings: Finding[];
  onSelectConcern: (concernId: string) => void;
}

/** "What matters to me" — the personalized overview of the analysis. */
export function ConcernsOverview({
  situation,
  goalLabel,
  findings,
  onSelectConcern,
}: ConcernsOverviewProps) {
  return (
    <section
      aria-label="What matters to you"
      className="rounded-xl border border-border bg-card"
    >
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2 border-b border-border px-3 py-3 sm:px-4">
        <div className="min-w-0">
          <p className="label-mono">Your situation</p>
          <p className="mt-1 font-serif text-[14px] leading-snug">{situation || goalLabel}</p>
        </div>
        <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
          {findings.length} {findings.length === 1 ? "area" : "areas"}
        </span>
      </header>
      <ul className="divide-y divide-border">
        {findings.map((finding) => {
          const notFound = finding.status === "not_found";
          return (
            <li key={finding.concernId}>
              <button
                type="button"
                onClick={() => onSelectConcern(finding.concernId)}
                className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 px-3 py-3 text-left text-[13px] transition-colors hover:bg-secondary sm:px-4 sm:py-2.5"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    notFound
                      ? "border border-muted-foreground/60"
                      : SEVERITY_DOT[finding.severity],
                  )}
                />
                <span className="min-w-0 font-medium">{finding.concernLabel}</span>
                <span
                  className={cn(
                    "ml-auto font-mono text-[11px]",
                    notFound ? "text-muted-foreground" : "text-muted-foreground",
                  )}
                >
                  {notFound
                    ? "not found"
                    : `${finding.evidence.length} ${finding.evidence.length === 1 ? "section" : "sections"}`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
