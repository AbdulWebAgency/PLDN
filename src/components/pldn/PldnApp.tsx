import { useEffect, useRef } from "react";
import { GoalStep } from "./onboarding/GoalStep";
import { UploadStep } from "./onboarding/UploadStep";
import { ConcernsStep } from "./onboarding/ConcernsStep";
import { AnalyzingStep } from "./onboarding/AnalyzingStep";
import { Workspace } from "./Workspace";
import { SessionProvider, useSession } from "@/state/session";
import { cn } from "@/lib/utils";

function OnboardingShell({
  children,
  mainRef,
  isGoalStep,
}: {
  children: React.ReactNode;
  mainRef: React.RefObject<HTMLElement | null>;
  isGoalStep: boolean;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className={cn("mx-auto flex h-14 min-w-0 items-center gap-2 px-4 sm:px-5", isGoalStep ? "max-w-5xl" : "max-w-3xl")}>
          <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-sm bg-primary">
            <span className="size-1.5 rounded-full bg-primary-foreground" />
          </span>
          <span className="text-[15px] font-bold">PLDN</span>
          <span className="label-mono ml-1 min-w-0 truncate sm:ml-2">Personalised Legal Document Navigator</span>
          {isGoalStep && (
            <span className="label-mono ml-auto hidden border-l border-border pl-4 lg:block">
              Document-grounded · Evidence-first
            </span>
          )}
        </div>
      </header>
      <main
        ref={mainRef}
        tabIndex={-1}
        className={cn(
          "mx-auto px-4 py-7 outline-none sm:px-5 sm:py-10",
          isGoalStep ? "max-w-5xl" : "max-w-3xl",
        )}
      >
        {children}
      </main>
      <footer className={cn("mx-auto px-4 pb-8 sm:px-5 sm:pb-12", isGoalStep ? "max-w-5xl" : "max-w-3xl")}>
        <p className="border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
          PLDN provides informational document assistance based only on the document you upload. It is not a lawyer,
          does not provide legal advice, and does not create an attorney-client relationship.
        </p>
      </footer>
    </div>
  );
}

function PldnRouter() {
  const {
    phase,
    context,
    doc,
    progress,
    analysisError,
    setGoal,
    setDocument,
    clearDocument,
    startAnalysis,
    retryAnalysis,
    setPhase,
  } = useSession();
  const mainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (phase !== "workspace") {
      mainRef.current?.focus();
    }
  }, [phase]);

  if (phase === "workspace") return <Workspace />;

  return (
    <OnboardingShell mainRef={mainRef} isGoalStep={phase === "goal"}>
      {phase === "goal" && <GoalStep onContinue={setGoal} />}

      {phase === "upload" && context && (
        <UploadStep situation={context.situation} onParsed={setDocument} onBack={() => setPhase("goal")} />
      )}

      {phase === "concerns" && context && doc && (
        <ConcernsStep
          goalId={context.goalId}
          fileName={doc.fileName}
          pageCount={doc.pageCount}
          sectionCount={doc.sections.length}
          lowTextConfidence={doc.lowTextConfidence}
          onStart={startAnalysis}
          onChangeDocument={clearDocument}
        />
      )}

      {phase === "analyzing" && (
        <AnalyzingStep
          done={progress.done}
          total={progress.total}
          current={progress.current}
          error={analysisError}
          onRetry={retryAnalysis}
        />
      )}
    </OnboardingShell>
  );
}

export default function PldnApp() {
  return (
    <SessionProvider>
      <PldnRouter />
    </SessionProvider>
  );
}
