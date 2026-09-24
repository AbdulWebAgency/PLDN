import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus, Loader2 } from "lucide-react";
import type { PDFDocumentProxy } from "@/lib/document/pdf";
import { getPageItems } from "@/lib/document/pdf";
import { cn } from "@/lib/utils";
import type { ActiveEvidence } from "@/types/pldn";

interface HighlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface DocumentViewerProps {
  pdf: PDFDocumentProxy;
  fileName: string;
  pageCount: number;
  activeEvidence: ActiveEvidence | null;
}

const ZOOM_STEPS = [0.75, 0.9, 1, 1.15, 1.35, 1.6, 2];

function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

/** Renders one page to canvas and overlays deterministic evidence highlights. */
export function DocumentViewer({ pdf, fileName, pageCount, activeEvidence }: DocumentViewerProps) {
  const [pageNumber, setPageNumber] = useState(1);
  const [zoomIndex, setZoomIndex] = useState(2);
  const [rendering, setRendering] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<HighlightRect[]>([]);
  const [pulse, setPulse] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const highlightRef = useRef<HTMLDivElement | null>(null);
  const targetTextRef = useRef<string | null>(null);
  const renderTaskRef = useRef<{ cancel: () => void; promise: Promise<void> } | null>(null);

  const scale = ZOOM_STEPS[zoomIndex] ?? 1;

  // Jump to the cited page whenever an evidence citation is clicked.
  useEffect(() => {
    if (!activeEvidence) return;
    targetTextRef.current = activeEvidence.sourceText;
    setPageNumber(Math.min(Math.max(activeEvidence.pageNumber, 1), pageCount));
    setPulse((n) => n + 1);
  }, [activeEvidence, pageCount]);

  const renderPage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setRendering(true);
    setRenderError(null);
    try {
      const previous = renderTaskRef.current;
      if (previous) {
        previous.cancel();
        await previous.promise.catch(() => undefined);
      }
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * ratio);
      canvas.height = Math.floor(viewport.height * ratio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const task = page.render({
        canvas,
        viewport,
        ...(ratio === 1 ? {} : { transform: [ratio, 0, 0, ratio, 0, 0] }),
      });
      renderTaskRef.current = task;
      await task.promise;

      // Deterministic highlight: locate the stored source text on this page.
      const target = targetTextRef.current;
      if (!target) {
        setHighlights([]);
      } else {
        setHighlights(await computeHighlights(page, viewport, target));
      }
    } catch (error) {
      if (error instanceof Error && error.name === "RenderingCancelledException") return;
      setRenderError("This page couldn't be displayed.");
      setHighlights([]);
    } finally {
      setRendering(false);
    }
  }, [pdf, pageNumber, scale, pulse]);

  useEffect(() => {
    void renderPage();
  }, [renderPage]);

  // Scroll the highlight into view once it has been positioned.
  useEffect(() => {
    if (highlights.length === 0) return;
    highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlights, pulse]);

  const goTo = (next: number) => {
    targetTextRef.current = null;
    setHighlights([]);
    setPageNumber(Math.min(Math.max(next, 1), pageCount));
    scrollRef.current?.scrollTo({ top: 0 });
  };

  return (
    <section aria-label="Original document" className="flex h-full min-h-0 flex-col bg-workspace">
      <header className="grid min-h-11 shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border bg-card px-2 py-1.5 sm:flex sm:h-11 sm:gap-3 sm:px-3 sm:py-0">
        <span className="hidden label-mono sm:inline">Document</span>
        <span className="min-w-0 truncate font-mono text-[10px] sm:text-[11px]">{fileName}</span>
        <div className="flex shrink-0 items-center gap-0.5 sm:ml-auto sm:gap-1">
          <button
            type="button"
            onClick={() => goTo(pageNumber - 1)}
            disabled={pageNumber <= 1}
            aria-label="Previous page"
            className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span aria-live="polite" className="font-mono text-[10px] text-muted-foreground sm:text-[11px]">
            <span className="hidden sm:inline">Page </span>
            <span className="text-foreground">{pageNumber}</span> / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => goTo(pageNumber + 1)}
            disabled={pageNumber >= pageCount}
            aria-label="Next page"
            className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
          >
            <ChevronRight className="size-4" />
          </button>
          <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-border sm:mx-1" />
          <button
            type="button"
            onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
            disabled={zoomIndex === 0}
            aria-label="Zoom out"
            className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-9 text-center font-mono text-[10px] text-muted-foreground sm:w-10 sm:text-[11px]">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoomIndex((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
            disabled={zoomIndex === ZOOM_STEPS.length - 1}
            aria-label="Zoom in"
            className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto p-2 sm:p-6">
        <div className="mx-auto w-fit">
          <div
            className={cn(
              "relative rounded-sm bg-page shadow-[0_4px_24px_rgba(0,0,0,0.08)] ring-1 ring-border",
              highlights.length > 0 && "animate-doc-focus",
            )}
          >
            <canvas ref={canvasRef} className="block rounded-sm" aria-label={`Page ${pageNumber}`} />
            {highlights.map((rect, index) => (
              <div
                key={`${rect.top}-${rect.left}-${index}`}
                ref={index === 0 ? highlightRef : undefined}
                aria-hidden="true"
                className="pointer-events-none absolute rounded-[2px] bg-evidence/15 ring-1 ring-evidence/40"
                style={{
                  left: rect.left,
                  top: rect.top,
                  width: rect.width,
                  height: rect.height,
                }}
              />
            ))}
            {rendering && (
              <div className="absolute inset-0 grid place-items-center bg-page/70">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
                <span className="sr-only">Loading page</span>
              </div>
            )}
          </div>
          {renderError && (
            <p role="alert" className="mt-4 text-center text-[13px] text-destructive">
              {renderError}
            </p>
          )}
          {!renderError && highlights.length === 0 && targetTextRef.current && !rendering && (
            <p className="mt-4 text-center font-mono text-[11px] text-muted-foreground">
              Showing page {pageNumber}. The exact wording could not be highlighted on this page.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Maps stored source text back to on-page rectangles using pdf.js text items.
 * No coordinate ever comes from the AI.
 */
async function computeHighlights(
  page: Awaited<ReturnType<PDFDocumentProxy["getPage"]>>,
  viewport: { transform: number[]; scale: number; height: number },
  target: string,
): Promise<HighlightRect[]> {
  const items = await getPageItems(page);
  if (items.length === 0) return [];

  let haystack = "";
  const spans: { start: number; end: number; index: number }[] = [];
  items.forEach((item, index) => {
    const piece = normalize(item.str);
    if (!piece) return;
    const start = haystack.length;
    haystack += `${piece} `;
    spans.push({ start, end: haystack.length, index });
  });

  const normalizedTarget = normalize(target);
  const candidates = [
    normalizedTarget.slice(0, 300),
    normalizedTarget.slice(0, 140),
    normalizedTarget.slice(0, 70),
    normalizedTarget.split(" ").slice(0, 8).join(" "),
  ].filter((c) => c.length > 12);

  let matchStart = -1;
  let matchLength = 0;
  for (const candidate of candidates) {
    const idx = haystack.indexOf(candidate);
    if (idx !== -1) {
      matchStart = idx;
      matchLength = candidate.length;
      break;
    }
  }
  if (matchStart === -1) return [];

  const matchEnd = matchStart + matchLength;
  const rects: HighlightRect[] = [];
  for (const span of spans) {
    if (span.end <= matchStart || span.start >= matchEnd) continue;
    const item = items[span.index];
    if (!item) continue;
    const x = item.transform[4] ?? 0;
    const y = item.transform[5] ?? 0;
    const [left, top] = applyTransform(x, y + item.height, viewport.transform);
    rects.push({
      left,
      top,
      width: Math.max(item.width * viewport.scale, 4),
      height: Math.max(item.height * viewport.scale, 8),
    });
  }
  return rects;
}

function applyTransform(x: number, y: number, m: number[]): [number, number] {
  const [a = 1, b = 0, c = 0, d = 1, e = 0, f = 0] = m;
  return [a * x + c * y + e, b * x + d * y + f];
}
