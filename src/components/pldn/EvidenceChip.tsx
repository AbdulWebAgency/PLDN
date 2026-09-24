import { ArrowUpRight } from "lucide-react";
import { evidenceLabel } from "@/lib/analysis/evidence";
import { cn } from "@/lib/utils";
import type { Evidence } from "@/types/pldn";

interface EvidenceChipProps {
  evidence: Evidence;
  onSelect: (evidence: Evidence) => void;
  variant?: "solid" | "soft";
  className?: string;
}

/**
 * The core interaction of PLDN: every document-based claim carries a citation
 * that jumps the document pane to the exact clause.
 */
export function EvidenceChip({
  evidence,
  onSelect,
  variant = "soft",
  className,
}: EvidenceChipProps) {
  const label = evidenceLabel(evidence);
  return (
    <button
      type="button"
      onClick={() => onSelect(evidence)}
      aria-label={`Open the document at ${label}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-[11px] font-medium transition-colors",
        variant === "solid"
          ? "bg-evidence text-primary-foreground hover:bg-evidence/90"
          : "border border-evidence/25 bg-evidence-soft text-evidence hover:bg-evidence/15",
        className,
      )}
    >
      {label}
      <ArrowUpRight className="size-3" aria-hidden="true" />
    </button>
  );
}
