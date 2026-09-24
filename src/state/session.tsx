import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { PDFDocumentProxy } from "@/lib/document/pdf";
import type {
  ActiveEvidence,
  ChatMessage,
  Evidence,
  Finding,
  ParsedDocument,
  UserContext,
} from "@/types/pldn";
import {
  analyzeSingleConcern,
  askAboutDocument,
  resolveConcerns,
} from "@/lib/analysis/analyze";

export type Phase = "goal" | "upload" | "concerns" | "analyzing" | "workspace";

interface AnalysisProgress {
  done: number;
  total: number;
  current: string | null;
}

interface SessionValue {
  phase: Phase;
  context: UserContext | null;
  doc: ParsedDocument | null;
  pdfDoc: PDFDocumentProxy | null;
  findings: Finding[];
  progress: AnalysisProgress;
  analysisError: string | null;
  chat: ChatMessage[];
  activeEvidence: ActiveEvidence | null;
  focusedConcernId: string | null;
  setPhase: (phase: Phase) => void;
  setGoal: (goal: { goalId: string; goalLabel: string; situation: string }) => void;
  setDocument: (doc: ParsedDocument, pdf: PDFDocumentProxy) => void;
  clearDocument: () => void;
  startAnalysis: (concernIds: string[], customConcerns: string[]) => Promise<void>;
  retryAnalysis: () => Promise<void>;
  focusEvidence: (evidence: Evidence) => void;
  setFocusedConcern: (concernId: string | null) => void;
  ask: (question: string) => Promise<void>;
  reset: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("goal");
  const [context, setContext] = useState<UserContext | null>(null);
  const [doc, setDoc] = useState<ParsedDocument | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [progress, setProgress] = useState<AnalysisProgress>({
    done: 0,
    total: 0,
    current: null,
  });
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [activeEvidence, setActiveEvidence] = useState<ActiveEvidence | null>(null);
  const [focusedConcernId, setFocusedConcernId] = useState<string | null>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const nonce = useRef(0);

  const setGoal = useCallback(
    (goal: { goalId: string; goalLabel: string; situation: string }) => {
      setContext((prev) => ({
        goalId: goal.goalId,
        goalLabel: goal.goalLabel,
        situation: goal.situation,
        concernIds: prev?.concernIds ?? [],
        customConcerns: prev?.customConcerns ?? [],
      }));
      setPhase("upload");
    },
    [],
  );

  const setDocument = useCallback((parsed: ParsedDocument, pdf: PDFDocumentProxy) => {
    pdfRef.current = pdf;
    setDoc(parsed);
    setPhase("concerns");
  }, []);

  const clearDocument = useCallback(() => {
    pdfRef.current = null;
    setDoc(null);
    setFindings([]);
    setChat([]);
    setActiveEvidence(null);
    setPhase("upload");
  }, []);

  const runAnalysis = useCallback(
    async (userContext: UserContext, parsed: ParsedDocument) => {
      const concerns = resolveConcerns(userContext);
      setAnalysisError(null);
      setFindings([]);
      setProgress({ done: 0, total: concerns.length, current: concerns[0]?.label ?? null });
      setPhase("analyzing");

      const collected: Finding[] = [];
      try {
        for (const [index, concern] of concerns.entries()) {
          setProgress({ done: index, total: concerns.length, current: concern.label });
          const finding = await analyzeSingleConcern(parsed, userContext, concern);
          collected.push(finding);
          setFindings([...collected]);
        }
        setProgress({ done: concerns.length, total: concerns.length, current: null });
        setPhase("workspace");
      } catch (error) {
        setAnalysisError(
          error instanceof Error ? error.message : "The analysis could not be completed.",
        );
        if (collected.length > 0) setPhase("workspace");
      }
    },
    [],
  );

  const startAnalysis = useCallback(
    async (concernIds: string[], customConcerns: string[]) => {
      if (!context || !doc) return;
      const next: UserContext = { ...context, concernIds, customConcerns };
      setContext(next);
      await runAnalysis(next, doc);
    },
    [context, doc, runAnalysis],
  );

  const retryAnalysis = useCallback(async () => {
    if (!context || !doc) return;
    await runAnalysis(context, doc);
  }, [context, doc, runAnalysis]);

  const focusEvidence = useCallback((evidence: Evidence) => {
    nonce.current += 1;
    setActiveEvidence({ ...evidence, nonce: nonce.current });
  }, []);

  const ask = useCallback(
    async (question: string) => {
      if (!context || !doc) return;
      const userMessage: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: question,
      };
      const pendingId = `a-${Date.now()}`;
      const history = chat
        .filter((m) => !m.pending && !m.error)
        .map((m) => ({ role: m.role, content: m.content }));

      setChat((prev) => [
        ...prev,
        userMessage,
        { id: pendingId, role: "assistant", content: "", pending: true },
      ]);

      try {
        const result = await askAboutDocument(doc, context, question, history);
        setChat((prev) =>
          prev.map((m) =>
            m.id === pendingId
              ? {
                  id: pendingId,
                  role: "assistant",
                  content: result.answer,
                  evidence: result.evidence,
                  unanswerable: result.unanswerable,
                  questions: result.questions,
                }
              : m,
          ),
        );
      } catch (error) {
        setChat((prev) =>
          prev.map((m) =>
            m.id === pendingId
              ? {
                  id: pendingId,
                  role: "assistant",
                  content:
                    error instanceof Error
                      ? error.message
                      : "Something went wrong answering that question.",
                  error: true,
                }
              : m,
          ),
        );
      }
    },
    [chat, context, doc],
  );

  const reset = useCallback(() => {
    pdfRef.current = null;
    setPhase("goal");
    setContext(null);
    setDoc(null);
    setFindings([]);
    setChat([]);
    setActiveEvidence(null);
    setFocusedConcernId(null);
    setAnalysisError(null);
    setProgress({ done: 0, total: 0, current: null });
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      phase,
      context,
      doc,
      pdfDoc: pdfRef.current,
      findings,
      progress,
      analysisError,
      chat,
      activeEvidence,
      focusedConcernId,
      setPhase,
      setGoal,
      setDocument,
      clearDocument,
      startAnalysis,
      retryAnalysis,
      focusEvidence,
      setFocusedConcern: setFocusedConcernId,
      ask,
      reset,
    }),
    [
      phase,
      context,
      doc,
      findings,
      progress,
      analysisError,
      chat,
      activeEvidence,
      focusedConcernId,
      setGoal,
      setDocument,
      clearDocument,
      startAnalysis,
      retryAnalysis,
      focusEvidence,
      ask,
      reset,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}
