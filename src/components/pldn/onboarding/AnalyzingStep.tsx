import { Check, Loader2 } from "lucide-react";

interface AnalyzingStepProps {
  done: number;
  total: number;
  current: string | null;
  error: string | null;
  onRetry: () => void;
}

export function AnalyzingStep({ done, total, current, error, onRetry }: AnalyzingStepProps) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="animate-rise space-y-6">
      <header>
        <p className="label-mono">Analysing</p>
        <h1 className="mt-2 font-serif text-[28px] leading-tight tracking-tight">
          Finding the sections that matter to you
        </h1>
      </header>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-[13.5px]">
          {error ? (
            <span className="text-destructive">Analysis stopped</span>
          ) : done === total && total > 0 ? (
            <>
              <Check className="size-4 text-sev-low" aria-hidden="true" />
              <span>Analysis complete</span>
            </>
          ) : (
            <>
              <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
              <span aria-live="polite">{current ?? "Preparing…"}</span>
            </>
          )}
          <span className="ml-auto font-mono text-[11px] text-muted-foreground">
            {done} / {total}
          </span>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-evidence transition-[width]" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-3 text-[12px] text-muted-foreground">
          Only the sections relevant to each area are sent for analysis — never the whole
          document.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-[13px]"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 rounded-md border border-border px-2.5 py-1 font-mono text-[11px] hover:bg-secondary"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
