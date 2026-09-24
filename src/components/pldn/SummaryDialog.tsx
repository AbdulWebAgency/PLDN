import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { evidenceLabel } from "@/lib/analysis/evidence";
import type { Finding, UserContext } from "@/types/pldn";

interface SummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: UserContext;
  findings: Finding[];
}

/** "What matters for you" preparation output for a conversation with a lawyer. */
export function SummaryDialog({
  open,
  onOpenChange,
  context,
  findings,
}: SummaryDialogProps) {
  const grounded = findings.filter((f) => f.status !== "not_found");
  const gaps = findings.filter((f) => f.status === "not_found");
  const questions = [...new Set(findings.flatMap((f) => f.questions))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-2xl overflow-y-auto p-4 sm:max-h-[85vh] sm:w-full sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-[17px]">What matters for you</DialogTitle>
          <DialogDescription>
            A preparation summary based only on the document you uploaded.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          <section>
            <p className="label-mono">Your situation</p>
            <p className="mt-1 font-serif text-[14px]">
              {context.situation || context.goalLabel}
            </p>
          </section>

          <section>
            <p className="label-mono">Key findings</p>
            <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
              {grounded.length === 0 && (
                <li className="px-3 py-3 text-[13px] text-muted-foreground">
                  No grounded findings were produced for this document.
                </li>
              )}
              {grounded.map((finding) => (
                <li key={finding.id} className="px-3 py-2.5">
                   <div className="grid grid-cols-1 gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-3">
                    <span className="text-[13px] font-medium">{finding.concernLabel}</span>
                     <span className="break-words font-mono text-[11px] text-muted-foreground sm:text-right">
                      {finding.evidence.map((e) => evidenceLabel(e)).join(" · ") || "—"}
                    </span>
                  </div>
                  <p className="mt-1 font-serif text-[13px] text-foreground/80">
                    {finding.headline}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <p className="label-mono">Information not found or unclear</p>
            {gaps.length === 0 ? (
              <p className="mt-1.5 font-serif text-[13px] text-foreground/80">
                Every area you selected was addressed somewhere in the document.
              </p>
            ) : (
              <ul className="mt-1.5 space-y-1 font-serif text-[13px] text-foreground/80">
                {gaps.map((gap) => (
                  <li key={gap.id} className="flex gap-2">
                    <span aria-hidden="true" className="text-muted-foreground">
                      ·
                    </span>
                    <span>{gap.explanation}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <p className="label-mono">Questions to clarify</p>
            <ol className="mt-1.5 space-y-1.5 font-serif text-[13px] text-foreground/80">
              {questions.map((question, index) => (
                <li key={question} className="flex gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {index + 1}.
                  </span>
                  <span>{question}</span>
                </li>
              ))}
            </ol>
          </section>

          <p className="border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
            Based on the document you provided. PLDN offers informational document
            assistance only, does not provide legal advice, and does not create an
            attorney-client relationship.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
