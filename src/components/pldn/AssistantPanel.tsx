import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowUp, Loader2, MessageSquare } from "lucide-react";
import { FindingCard } from "./FindingCard";
import { ConcernsOverview } from "./ConcernsOverview";
import { EvidenceChip } from "./EvidenceChip";
import { cn } from "@/lib/utils";
import type { ChatMessage, Evidence, Finding, UserContext } from "@/types/pldn";

interface AssistantPanelProps {
  context: UserContext;
  findings: Finding[];
  chat: ChatMessage[];
  analysisError: string | null;
  focusedConcernId: string | null;
  onSelectEvidence: (evidence: Evidence) => void;
  onSelectConcern: (concernId: string) => void;
  onRetryAnalysis: () => void;
  onAsk: (question: string) => void;
}

export function AssistantPanel({
  context,
  findings,
  chat,
  analysisError,
  focusedConcernId,
  onSelectEvidence,
  onSelectConcern,
  onRetryAnalysis,
  onAsk,
}: AssistantPanelProps) {
  const [question, setQuestion] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const busy = chat.some((m) => m.pending);

  useEffect(() => {
    if (chat.length > 0) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = question.trim();
    if (!value || busy) return;
    onAsk(value);
    setQuestion("");
  };

  return (
    <section
      aria-label="PLDN assistant"
      className="flex h-full min-h-0 flex-col bg-card"
    >
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3 sm:p-5">
        <ConcernsOverview
          situation={context.situation}
          goalLabel={context.goalLabel}
          findings={findings}
          onSelectConcern={onSelectConcern}
        />

        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2 pt-1">
          <h2 className="text-[15px] font-semibold tracking-tight">What matters to you</h2>
          <span className="shrink-0 text-right font-mono text-[10px] text-muted-foreground sm:text-[11px]">
            {findings.filter((f) => f.status !== "not_found").length} grounded ·{" "}
            {findings.filter((f) => f.status === "not_found").length} not found
          </span>
        </div>

        {analysisError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-[13px]"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div>
              <p>{analysisError}</p>
              <button
                type="button"
                onClick={onRetryAnalysis}
                className="mt-2 rounded-md border border-border px-2.5 py-1 font-mono text-[11px] hover:bg-secondary"
              >
                Retry analysis
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {findings.map((finding) => (
            <FindingCard
              key={finding.id}
              finding={finding}
              onSelectEvidence={onSelectEvidence}
              highlighted={focusedConcernId === finding.concernId}
            />
          ))}
        </div>

        {chat.length > 0 && (
          <div className="space-y-3 border-t border-border pt-4">
            <p className="label-mono">Your questions</p>
            {chat.map((message) => (
              <ChatBubble
                key={message.id}
                message={message}
                onSelectEvidence={onSelectEvidence}
              />
            ))}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={submit} className="shrink-0 border-t border-border bg-card p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
        <label htmlFor="pldn-question" className="sr-only">
          Ask a question about this document
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-evidence/40">
          <MessageSquare className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            id="pldn-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about this document…"
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={busy || question.trim().length === 0}
            aria-label="Send question"
            className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <ArrowUp className="size-3.5" />}
          </button>
        </div>
        <p className="mt-2 hidden text-[11px] leading-snug text-muted-foreground sm:block">
          Answers are based only on the document you uploaded. PLDN provides document
          assistance, not legal advice, and is not a substitute for a legal professional.
        </p>
      </form>
    </section>
  );
}

function ChatBubble({
  message,
  onSelectEvidence,
}: {
  message: ChatMessage;
  onSelectEvidence: (evidence: Evidence) => void;
}) {
  if (message.role === "user") {
    return (
      <div className="rounded-xl bg-secondary px-3 py-2 text-[13px]">{message.content}</div>
    );
  }

  if (message.pending) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-[13px] text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        Looking through the document…
      </div>
    );
  }

  return (
    <div
      className={cn(
        "animate-rise rounded-xl border p-3",
        message.error
          ? "border-destructive/30 bg-destructive/5"
          : message.unanswerable
            ? "border-dashed border-border bg-muted/40"
            : "border-border bg-background",
      )}
      role={message.error ? "alert" : undefined}
    >
      {message.unanswerable && !message.error && (
        <p className="label-mono mb-1.5">Not found in document</p>
      )}
      <p className="font-serif text-[13.5px] leading-relaxed text-foreground/85">
        {message.content}
      </p>
      {message.evidence && message.evidence.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {message.evidence.map((evidence, index) => (
            <EvidenceChip
              key={evidence.sectionId}
              evidence={evidence}
              onSelect={onSelectEvidence}
              variant={index === 0 ? "solid" : "soft"}
            />
          ))}
        </div>
      )}
      {message.questions && message.questions.length > 0 && (
        <div className="mt-3 border-t border-border pt-2.5">
          <p className="label-mono">Questions to clarify</p>
          <ul className="mt-1.5 space-y-1 font-serif text-[13px] text-foreground/80">
            {message.questions.map((q) => (
              <li key={q} className="flex gap-2">
                <span aria-hidden="true" className="font-mono text-[11px] text-muted-foreground">
                  ·
                </span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
