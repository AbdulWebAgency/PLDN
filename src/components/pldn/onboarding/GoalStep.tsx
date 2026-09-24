import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GOALS } from "@/lib/concerns";
import { cn } from "@/lib/utils";

interface GoalStepProps {
  onContinue: (goal: { goalId: string; goalLabel: string; situation: string }) => void;
}

export function GoalStep({ onContinue }: GoalStepProps) {
  const [goalId, setGoalId] = useState<string | null>(null);
  const [situation, setSituation] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const goal = GOALS.find((g) => g.id === goalId);
    if (!goal) return;
    onContinue({ goalId: goal.id, goalLabel: goal.label, situation: situation.trim() });
  };

  return (
    <form onSubmit={submit} className="animate-rise overflow-hidden border border-border bg-card shadow-sm">
      <header className="grid border-b border-border lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="relative px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-9">
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-evidence" />
          <div className="flex items-center gap-3">
            <p className="label-mono text-evidence">Step 1 of 3</p>
            <span className="h-px w-10 bg-border" aria-hidden="true" />
            <p className="label-mono">Set your objective</p>
          </div>
          <h1 className="mt-4 max-w-2xl font-serif text-[30px] leading-[1.12] sm:text-[39px]">
            Understand what matters in your document.
          </h1>
          <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-muted-foreground sm:text-[14.5px]">
            Tell PLDN what you’re trying to figure out. It finds the relevant clauses, explains them in plain
            language, and shows you exactly where each answer came from.
          </p>
        </div>
        <div className="hidden border-l border-border bg-secondary/40 p-7 lg:flex lg:flex-col lg:justify-between">
          <p className="label-mono">Document intelligence file</p>
          <div>
            <p className="font-mono text-[10px] text-muted-foreground">WORKFLOW / 01</p>
            <div className="mt-3 flex gap-1.5" aria-label="Onboarding progress: step 1 of 3">
              <span className="h-1 flex-1 bg-evidence" />
              <span className="h-1 flex-1 bg-border" />
              <span className="h-1 flex-1 bg-border" />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">Objective recorded before document review.</p>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.82fr)]">
        <fieldset className="min-w-0 px-5 py-6 sm:px-8 sm:py-8 lg:col-start-1 lg:row-start-1 lg:px-10">
          <legend className="sr-only">What are you trying to figure out?</legend>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="label-mono text-evidence">Your intent</p>
              <h2 className="mt-1.5 font-serif text-[21px] leading-tight sm:text-[24px]">What are you trying to figure out?</h2>
            </div>
            <p className="label-mono hidden sm:block">Select one</p>
          </div>

          <div className="border-y border-border">
            {GOALS.map((goal, index) => {
              const selected = goalId === goal.id;
              return (
                <label
                  key={goal.id}
                  className={cn(
                    "group relative grid min-h-[62px] cursor-pointer grid-cols-[3px_2rem_minmax(0,1fr)_1.25rem] items-center gap-3 border-b border-border py-2.5 pr-3 transition-colors last:border-b-0 sm:min-h-[66px] sm:grid-cols-[3px_2.25rem_minmax(0,1fr)_1.25rem] sm:pr-4",
                    selected ? "bg-evidence-soft ring-1 ring-inset ring-evidence/35" : "hover:bg-secondary/70",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn("h-full w-[3px] bg-transparent transition-colors", selected && "bg-evidence")}
                  />
                  <span className={cn("font-mono text-[10px] text-muted-foreground", selected && "text-evidence")}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold leading-snug sm:text-[13.5px]">{goal.label}</span>
                    <span className="mt-0.5 block text-[11.5px] leading-relaxed text-muted-foreground sm:text-[12px]">
                      {goal.description}
                    </span>
                  </span>
                  <input
                    type="radio"
                    name="goal"
                    value={goal.id}
                    checked={selected}
                    onChange={() => setGoalId(goal.id)}
                    className="size-4 shrink-0 accent-[var(--evidence)]"
                  />
                </label>
              );
            })}
          </div>
        </fieldset>

        <aside
          aria-label="Illustrative evidence preview"
          className="mx-5 mb-6 border border-border bg-page shadow-sm sm:mx-8 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:m-0 lg:border-y-0 lg:border-r-0 lg:shadow-none"
        >
          <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-4 py-3.5 sm:px-5">
            <span className="label-mono text-evidence">How PLDN works</span>
            <span className="font-mono text-[9px] text-muted-foreground">Illustrative example</span>
          </div>

          <div className="relative px-5 py-5 sm:px-7 sm:py-7 lg:min-h-full">
            <span aria-hidden="true" className="absolute inset-y-0 left-3 w-px bg-evidence/25 sm:left-4" />
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <span className="size-1.5 rounded-full bg-evidence" aria-hidden="true" />
              <p className="font-mono text-[9px] text-muted-foreground">QUESTION / FINDING / SOURCE</p>
            </div>

            <section className="border-b border-border py-4">
              <p className="label-mono">Your question</p>
              <p className="mt-1.5 font-serif text-[14px] leading-snug">How much notice do I need to give?</p>
            </section>

            <section className="border-b border-border py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="label-mono">Relevant finding</p>
                <span className="font-mono text-[9px] text-evidence">FOUND</span>
              </div>
              <h2 className="mt-2 font-serif text-[25px] leading-none">45 days’ notice</h2>
            </section>

            <section className="py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[9px] font-medium text-evidence">Clause 13 · Page 3</p>
                <span className="font-mono text-[9px] text-muted-foreground">EVIDENCE 01</span>
              </div>
              <blockquote className="mt-3 border-l-2 border-evidence pl-3 font-serif text-[13px] leading-[1.75] text-muted-foreground">
                “…the Tenant shall provide <mark className="border-b border-evidence bg-evidence-soft px-0.5 text-foreground">45 days written notice</mark>…”
              </blockquote>
              <p className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-evidence">
                View source <ArrowUpRight className="size-3" aria-hidden="true" />
              </p>
            </section>

            <div className="mt-1 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 border-t border-border pt-4" aria-hidden="true">
              {[
                ["01", "Question"],
                ["02", "Finding"],
                ["03", "Evidence"],
              ].map(([number, label], index) => (
                <div key={number} className="contents">
                  <div>
                    <span className="block font-mono text-[9px] text-evidence">{number}</span>
                    <span className="mt-0.5 block text-[9px] text-muted-foreground">{label}</span>
                  </div>
                  {index < 2 && <span className="h-px w-3 bg-border" />}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="mx-5 border-t border-border py-5 sm:mx-8 sm:py-6 lg:col-start-1 lg:row-start-2 lg:mx-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <label htmlFor="situation" className="label-mono text-evidence">
              Describe your situation
            </label>
            <span className="font-mono text-[9px] text-muted-foreground">Optional · Helps prioritise findings</span>
          </div>
          <textarea
            id="situation"
            value={situation}
            onChange={(event) => setSituation(event.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="I'm considering resigning and want to know how much notice I need to give and whether I'm restricted from working for another company."
            className="mt-3 w-full resize-y border border-input bg-page p-3.5 font-serif text-[14px] leading-relaxed outline-none placeholder:text-muted-foreground focus:border-evidence/50"
          />
        </div>

        <div className="flex flex-col items-stretch gap-3 border-t border-border bg-secondary/30 px-5 py-4 sm:flex-row sm:items-center sm:px-8 lg:col-start-1 lg:row-start-3 lg:px-10">
          <Button type="submit" disabled={!goalId} className="min-h-11 px-5 sm:min-h-9">
            Continue to upload
            <ArrowUpRight aria-hidden="true" />
          </Button>
          <span className="text-[11px] leading-relaxed text-muted-foreground">
            Your document stays in your browser; only short relevant excerpts are analysed.
          </span>
        </div>
      </div>
    </form>
  );
}
