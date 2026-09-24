/**
 * Browser-side PDF access. The uploaded file never leaves the user's browser
 * as a whole document — only the small set of sections relevant to a question
 * is sent to the server for AI reasoning.
 */
import * as pdfjs from "pdfjs-dist";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

let configured = false;

/** pdf.js 6 uses Map.getOrInsertComputed, which older browsers lack. */
function polyfillMap() {
  const proto = Map.prototype as unknown as Record<string, unknown>;
  if (typeof proto["getOrInsertComputed"] !== "function") {
    proto["getOrInsertComputed"] = function <K, V>(this: Map<K, V>, key: K, compute: (k: K) => V) {
      if (!this.has(key)) this.set(key, compute(key));
      return this.get(key) as V;
    };
  }
  if (typeof proto["getOrInsert"] !== "function") {
    proto["getOrInsert"] = function <K, V>(this: Map<K, V>, key: K, value: V) {
      if (!this.has(key)) this.set(key, value);
      return this.get(key) as V;
    };
  }
}

function configure() {
  if (configured) return;
  polyfillMap();
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
  configured = true;
}

export class DocumentError extends Error {
  constructor(
    message: string,
    readonly kind:
      | "invalid-file"
      | "corrupt"
      | "empty"
      | "encrypted"
      | "too-large" = "corrupt",
  ) {
    super(message);
    this.name = "DocumentError";
  }
}

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/** Validates the upload without trusting the file name or reported MIME type. */
export async function validatePdf(file: File): Promise<ArrayBuffer> {
  if (file.size === 0) {
    throw new DocumentError("This file is empty.", "empty");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new DocumentError(
      "This file is larger than 25 MB. Please upload a smaller document.",
      "too-large",
    );
  }
  const buffer = await file.arrayBuffer();
  const header = new TextDecoder().decode(new Uint8Array(buffer.slice(0, 5)));
  if (header !== "%PDF-") {
    throw new DocumentError(
      "This doesn't look like a PDF file. Only PDF documents are supported right now.",
      "invalid-file",
    );
  }
  return buffer;
}

export async function loadPdf(data: ArrayBuffer): Promise<PDFDocumentProxy> {
  configure();
  try {
    return await pdfjs.getDocument({ data: data.slice(0) }).promise;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/password/i.test(message)) {
      throw new DocumentError(
        "This PDF is password protected, so it can't be read.",
        "encrypted",
      );
    }
    throw new DocumentError(
      "This PDF couldn't be opened. It may be damaged or unsupported.",
      "corrupt",
    );
  }
}

export interface ExtractedItem {
  str: string;
  /** pdf.js transform matrix in PDF user space. */
  transform: number[];
  width: number;
  height: number;
  hasEOL: boolean;
}

export async function getPageItems(page: PDFPageProxy): Promise<ExtractedItem[]> {
  const content = await page.getTextContent();
  const items: ExtractedItem[] = [];
  for (const raw of content.items) {
    if (!("str" in raw)) continue;
    items.push({
      str: raw.str,
      transform: raw.transform,
      width: raw.width,
      height: raw.height,
      hasEOL: raw.hasEOL,
    });
  }
  return items;
}

/** Joins text items into page text, preserving line breaks. */
export function itemsToText(items: ExtractedItem[]): string {
  let out = "";
  let lastY: number | null = null;
  for (const item of items) {
    const y = Math.round(item.transform[5] ?? 0);
    if (lastY !== null && Math.abs(y - lastY) > 2) out += "\n";
    out += item.str;
    if (item.hasEOL) out += "\n";
    lastY = y;
  }
  return out.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n");
}

export type { PDFDocumentProxy, PDFPageProxy };
