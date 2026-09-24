import { useState } from "react";
import { X } from "lucide-react";
import { CONCERNS, GOALS } from "@/lib/concerns";
import { cn } from "@/lib/utils";

interface ConcernsStepProps {
  goalId: string;
  fileName: string;
  pageCount: number;
  sectionCount: number;
  lowTextConfidence: boolean;
  onStart: (concernIds: string[], customConcerns: string[]) => void;
  onChangeDocument: () => void;
}

export function ConcernsStep({
  goalId,
  fileName,
  pageCount,
  sectionCount,
  lowTextConfidence,
  onStart,
  onChangeDocument,
}: ConcernsStepProps) {
  const suggested = GOALS.find((g) => g.id === goalId)?.suggestedConcerns ?? [];
  const [selected, setSelected] = useState<string[]>(suggested);
  const [customDraft, setCustomDraft] = useState("");
  const [custom, setCustom] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  const addCustom = () => {
    const value = customDraft.trim();
    if (!value || custom.includes(value) || custom.length >= 3) return;
    setCustom((prev) => [...prev, value]);
    setCustomDraft("");
  };

  const total = selected.length + custom.length;

  return (
    <div className="animate-rise space-y-6 sm:space-y-8">
      <header>
        <p className="label-mono">Step 3 of 3</p>
        <h1 className="mt-2 font-serif text-[26px] leading-tight tracking-tight sm:text-[30px]">
          What matters most to you?
        </h1>
        <p className="mt-2 font-mono text-[11px] text-muted-foreground">
          {fileName} · {pageCount} pages · {sectionCount} sections detected
        </p>
        {lowTextConfidence && (
          <p className="mt-2 max-w-xl rounded-lg border border-sev-med/30 bg-sev-med/5 p-2.5 text-[12.5px]">
            Only a small amount of text could be read from this PDF, so some sections may be
            missing from the analysis.
          </p>
        )}
      </header>

      <fieldset>
        <legend className="label-mono mb-2">Select the areas to analyse</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {CONCERNS.map((concern) => {
            const checked = selected.includes(concern.id);
            return (
              <label
                key={concern.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-[13.5px] transition-colors",
                  checked
                    ? "border-evidence/50 bg-evidence-soft"
                    : "border-border bg-card hover:border-evidence/25",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(concern.id)}
                  className="size-3.5 accent-[var(--evidence)]"
                />
                <span className="font-medium">{concern.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="custom-concern" className="label-mono">
          Something else you care about
        </label>
        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <input
            id="custom-concern"
            value={customDraft}
            onChange={(event) => setCustomDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustom();
              }
            }}
            placeholder="e.g. garden leave, relocation, training costs"
             className="min-w-0 rounded-lg border border-border bg-card px-3 py-2 text-[13px] outline-none focus:border-evidence/40"
          />
          <button
            type="button"
            onClick={addCustom}
            className="rounded-lg border border-border px-3 py-2 text-[13px] hover:bg-secondary"
          >
            Add
          </button>
        </div>
        {custom.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2">
            {custom.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => setCustom((prev) => prev.filter((c) => c !== item))}
                  aria-label={`Remove ${item}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[12px]"
                >
                  {item}
                  <X className="size-3" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <button
          type="button"
          disabled={total === 0}
          onClick={() => onStart(selected, custom)}
          className="min-h-11 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground disabled:opacity-40 sm:min-h-0"
        >
          Analyse {total > 0 ? `${total} ${total === 1 ? "area" : "areas"}` : ""}
        </button>
        <button
          type="button"
          onClick={onChangeDocument}
          className="py-1 text-center text-[12.5px] text-muted-foreground underline underline-offset-4 hover:text-foreground sm:text-left"
        >
          Use a different document
        </button>
      </div>
    </div>
  );
}
