import { cn } from "@/lib/utils";
import { EvidenceChip } from "./EvidenceChip";
import type { Evidence, Finding } from "@/types/pldn";

const SEVERITY_DOT: Record<Finding["severity"], string> = {
  high: "bg-sev-crit",
  medium: "bg-sev-med",
  low: "bg-sev-low",
};

interface FindingCardProps {
  finding: Finding;
  onSelectEvidence: (evidence: Evidence) => void;
  highlighted?: boolean;
}

export function FindingCard({
  finding,
  onSelectEvidence,
  highlighted,
}: FindingCardProps) {
  const notFound = finding.status === "not_found";

  return (
    <article
      id={`finding-${finding.concernId}`}
      aria-labelledby={`finding-title-${finding.concernId}`}
      className={cn(
        "animate-rise scroll-mt-3 rounded-xl border p-3.5 transition-colors sm:p-4",
        notFound
          ? "border-dashed border-border bg-muted/40"
          : "border-border bg-card hover:border-evidence/30",
        highlighted && "border-evidence/60 ring-1 ring-evidence/20",
      )}
    >
      <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
        <span
          aria-hidden="true"
          className={cn(
            "size-2 shrink-0 rounded-full",
            notFound ? "border border-muted-foreground/60" : SEVERITY_DOT[finding.severity],
          )}
        />
        <span className="label-mono">
          {notFound ? "Not found in document" : finding.concernLabel}
        </span>
        {finding.status === "partial" && (
          <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            Partly addressed
          </span>
        )}
      </div>

      <h3
        id={`finding-title-${finding.concernId}`}
        className={cn(
          "text-[15px] leading-snug font-medium",
          notFound && "text-muted-foreground",
        )}
      >
        {notFound ? `${finding.concernLabel}: ${finding.headline}` : finding.headline}
      </h3>

      <p
        className={cn(
          "mt-2 font-serif text-[13.5px] leading-relaxed",
          notFound ? "text-muted-foreground" : "text-foreground/80",
        )}
      >
        {finding.explanation}
      </p>

      {finding.evidence.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {finding.evidence.map((evidence, index) => (
            <EvidenceChip
              key={evidence.sectionId}
              evidence={evidence}
              onSelect={onSelectEvidence}
              variant={index === 0 ? "solid" : "soft"}
            />
          ))}
        </div>
      )}

      {finding.whyItMatters && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="label-mono">Why this matters</p>
          <p className="mt-1.5 font-serif text-[13px] leading-relaxed text-foreground/80">
            {finding.whyItMatters}
          </p>
        </div>
      )}

      {finding.questions.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="label-mono">Questions to clarify</p>
          <ul className="mt-1.5 space-y-1 font-serif text-[13px] leading-relaxed text-foreground/80">
            {finding.questions.map((question) => (
              <li key={question} className="flex gap-2">
                <span aria-hidden="true" className="font-mono text-[11px] text-muted-foreground">
                  ·
                </span>
                <span>{question}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
