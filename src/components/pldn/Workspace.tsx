import { useState } from "react";
import { FileSearch, FileText, PanelRightClose, PanelRightOpen, RotateCcw } from "lucide-react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { AssistantPanel } from "./AssistantPanel";
import { DocumentViewer } from "./DocumentViewer";
import { SummaryDialog } from "./SummaryDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSession } from "@/state/session";

export function Workspace() {
  const {
    context,
    doc,
    pdfDoc,
    findings,
    chat,
    analysisError,
    activeEvidence,
    focusedConcernId,
    focusEvidence,
    setFocusedConcern,
    retryAnalysis,
    ask,
    reset,
  } = useSession();
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [docCollapsed, setDocCollapsed] = useState(false);
  const [mobileView, setMobileView] = useState<"analysis" | "document">("analysis");
  const isMobile = useIsMobile();

  if (!context || !doc || !pdfDoc) return null;

  const selectConcern = (concernId: string) => {
    setMobileView("analysis");
    setFocusedConcern(concernId);
    document
      .getElementById(`finding-${concernId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const selectEvidence = (evidence: Parameters<typeof focusEvidence>[0]) => {
    focusEvidence(evidence);
    if (isMobile) setMobileView("document");
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      <header className="shrink-0 border-b border-border bg-background">
        <div className="grid h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 md:flex md:px-5">
        <div className="flex min-w-0 items-center gap-2 md:gap-4">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="grid size-5 place-items-center rounded-sm bg-primary"
            >
              <span className="size-1.5 rounded-full bg-primary-foreground" />
            </span>
            <span className="text-[14px] font-bold tracking-tight">PLDN</span>
          </div>
          <span aria-hidden="true" className="hidden h-4 w-px bg-border sm:block" />
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            <FileText className="hidden size-3.5 shrink-0 sm:block" aria-hidden="true" />
            <span className="min-w-0 max-w-[145px] truncate sm:max-w-[240px]">{doc.fileName}</span>
            <span className="hidden shrink-0 sm:inline">· {doc.pageCount} pp</span>
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 md:ml-auto md:gap-2">
          <button
            type="button"
            onClick={() => setDocCollapsed((v) => !v)}
            className="hidden items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[12px] hover:bg-secondary md:inline-flex"
          >
            {docCollapsed ? (
              <PanelRightOpen className="size-3.5" aria-hidden="true" />
            ) : (
              <PanelRightClose className="size-3.5" aria-hidden="true" />
            )}
            {docCollapsed ? "Show document" : "Hide document"}
          </button>
          <button
            type="button"
            onClick={() => setSummaryOpen(true)}
            aria-label="Open preparation summary"
            className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground hover:opacity-90 md:h-auto md:w-auto md:px-3 md:py-1.5 md:text-[12px] md:font-medium"
          >
            <FileSearch className="size-4 md:hidden" aria-hidden="true" />
            <span className="hidden md:inline">Preparation summary</span>
          </button>
          <button
            type="button"
            onClick={reset}
            aria-label="Start over with a new document"
            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>
        </div>

        <nav className="grid grid-cols-2 border-t border-border md:hidden" aria-label="Workspace views">
          <button
            type="button"
            onClick={() => setMobileView("analysis")}
            aria-current={mobileView === "analysis" ? "page" : undefined}
            className={`h-10 border-b-2 text-[12px] font-medium ${mobileView === "analysis" ? "border-evidence text-foreground" : "border-transparent text-muted-foreground"}`}
          >
            Analysis
          </button>
          <button
            type="button"
            onClick={() => setMobileView("document")}
            aria-current={mobileView === "document" ? "page" : undefined}
            className={`h-10 border-b-2 text-[12px] font-medium ${mobileView === "document" ? "border-evidence text-foreground" : "border-transparent text-muted-foreground"}`}
          >
            Document · {doc.pageCount} pp
          </button>
        </nav>
      </header>

      <main className="min-h-0 flex-1">
        {isMobile ? (
          mobileView === "analysis" ? (
            <AssistantPanel
              context={context}
              findings={findings}
              chat={chat}
              analysisError={analysisError}
              focusedConcernId={focusedConcernId}
              onSelectEvidence={selectEvidence}
              onSelectConcern={selectConcern}
              onRetryAnalysis={retryAnalysis}
              onAsk={ask}
            />
          ) : (
            <DocumentViewer
              pdf={pdfDoc}
              fileName={doc.fileName}
              pageCount={doc.pageCount}
              activeEvidence={activeEvidence}
            />
          )
        ) : docCollapsed ? (
          <AssistantPanel
            context={context}
            findings={findings}
            chat={chat}
            analysisError={analysisError}
            focusedConcernId={focusedConcernId}
            onSelectEvidence={(evidence) => {
              setDocCollapsed(false);
              focusEvidence(evidence);
            }}
            onSelectConcern={selectConcern}
            onRetryAnalysis={retryAnalysis}
            onAsk={ask}
          />
        ) : (
          <ResizablePanelGroup className="h-full">
            <ResizablePanel defaultSize="42" minSize="26" className="min-w-0">
              <AssistantPanel
                context={context}
                findings={findings}
                chat={chat}
                analysisError={analysisError}
                focusedConcernId={focusedConcernId}
                onSelectEvidence={selectEvidence}
                onSelectConcern={selectConcern}
                onRetryAnalysis={retryAnalysis}
                onAsk={ask}
              />
            </ResizablePanel>
            <ResizableHandle withHandle aria-label="Resize assistant and document panes" />
            <ResizablePanel defaultSize="58" minSize="25" className="min-w-0">
              <DocumentViewer
                pdf={pdfDoc}
                fileName={doc.fileName}
                pageCount={doc.pageCount}
                activeEvidence={activeEvidence}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </main>

      <SummaryDialog
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        context={context}
        findings={findings}
      />
    </div>
  );
}
