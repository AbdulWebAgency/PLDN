import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

// The document engine (pdf.js) is browser-only, so the workspace is loaded
// after hydration rather than during SSR.
const PldnApp = lazy(() => import("@/components/pldn/PldnApp"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PLDN — Personalised Legal Document Navigator" },
      {
        name: "description",
        content:
          "Understand what matters to you inside a legal document, see exactly where each answer came from, and know what you still need to clarify.",
      },
      { property: "og:title", content: "PLDN — Personalised Legal Document Navigator" },
      {
        property: "og:description",
        content:
          "Goal-driven legal document understanding: personalised findings, clickable evidence, and honest information gaps.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Loading() {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <p className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
        Loading PLDN…
      </p>
    </div>
  );
}

function Index() {
  return (
    <ClientOnly fallback={<Loading />}>
      <Suspense fallback={<Loading />}>
        <PldnApp />
      </Suspense>
    </ClientOnly>
  );
}
