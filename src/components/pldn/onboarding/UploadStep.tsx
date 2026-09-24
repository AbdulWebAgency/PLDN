import { useCallback, useRef, useState } from "react";
import { AlertTriangle, FileUp, Loader2 } from "lucide-react";
import {
  DocumentError,
  getPageItems,
  itemsToText,
  loadPdf,
  validatePdf,
  type PDFDocumentProxy,
} from "@/lib/document/pdf";
import { segmentSections } from "@/lib/document/segment";
import type { PageText, ParsedDocument } from "@/types/pldn";
import { cn } from "@/lib/utils";

interface UploadStepProps {
  situation: string;
  onParsed: (doc: ParsedDocument, pdf: PDFDocumentProxy) => void;
  onBack: () => void;
}

const SAMPLE_URL = "/samples/employment-agreement.pdf";

export function UploadStep({ situation, onParsed, onBack }: UploadStepProps) {
  const [status, setStatus] = useState<"idle" | "parsing">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setStatus("parsing");
      setProgress(0);
      try {
        const buffer = await validatePdf(file);
        const pdf = await loadPdf(buffer);
        if (pdf.numPages === 0) {
          throw new DocumentError("This PDF has no pages.", "empty");
        }

        const pages: PageText[] = [];
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const items = await getPageItems(page);
          pages.push({ pageNumber, text: itemsToText(items) });
          setProgress(Math.round((pageNumber / pdf.numPages) * 100));
        }

        const totalChars = pages.reduce((sum, p) => sum + p.text.replace(/\s/g, "").length, 0);
        if (totalChars === 0) {
          throw new DocumentError(
            "No readable text could be extracted from this PDF. It may be a scan or an image-only document.",
            "empty",
          );
        }

        const parsed: ParsedDocument = {
          id: `doc-${Date.now()}`,
          fileName: file.name.replace(/[^\w.\-() ]/g, "").slice(0, 80) || "document.pdf",
          byteSize: file.size,
          pageCount: pdf.numPages,
          pages,
          sections: segmentSections(pages),
          lowTextConfidence: totalChars < 1200,
        };
        onParsed(parsed, pdf);
      } catch (err) {
        setStatus("idle");
        setError(
          err instanceof DocumentError
            ? err.message
            : "This document couldn't be read. Please try a different PDF.",
        );
      }
    },
    [onParsed],
  );

  const loadSample = async () => {
    setError(null);
    try {
      const response = await fetch(SAMPLE_URL);
      if (!response.ok) throw new Error("sample missing");
      const blob = await response.blob();
      await handleFile(new File([blob], "Sample_Employment_Agreement.pdf", { type: "application/pdf" }));
    } catch {
      setError("The sample document could not be loaded. Please upload your own PDF.");
    }
  };

  return (
    <div className="animate-rise space-y-6 sm:space-y-8">
      <header>
        <p className="label-mono">Step 2 of 3</p>
        <h1 className="mt-2 font-serif text-[26px] leading-tight tracking-tight sm:text-[30px]">
          Upload the document
        </h1>
        {situation && (
          <p className="mt-2 max-w-xl font-serif text-[14px] text-muted-foreground">
            “{situation}”
          </p>
        )}
      </header>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        className={cn(
          "rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors sm:rounded-2xl sm:p-10",
          dragging ? "border-evidence bg-evidence-soft" : "border-border bg-card",
        )}
      >
        {status === "parsing" ? (
          <div className="space-y-3">
            <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
            <p className="text-[13px]" aria-live="polite">
              Reading the document… {progress}%
            </p>
            <div className="mx-auto h-1 w-56 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-evidence transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <FileUp className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 text-[14px] font-medium">Drop a PDF here</p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              PDF only, up to 25 MB. DOCX support is planned.
            </p>
            <div className="mt-5 flex flex-col items-stretch justify-center gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                 className="min-h-11 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground sm:min-h-0"
              >
                Choose a file
              </button>
              <button
                type="button"
                onClick={loadSample}
                 className="min-h-11 rounded-lg border border-border px-4 py-2 text-[13px] font-medium hover:bg-secondary sm:min-h-0"
              >
                Use the sample employment agreement
              </button>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleFile(file);
                event.target.value = "";
              }}
            />
          </>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-[13px]"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p>{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={onBack}
        className="text-[12.5px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        Back to your situation
      </button>
    </div>
  );
}
