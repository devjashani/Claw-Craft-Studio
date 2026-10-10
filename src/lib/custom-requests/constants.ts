import { CustomRequestStatus } from "@/types/database.types";

export interface StatusMeta {
  key: string;
  label: string;
  description: string;
  badgeClass: string;
  stepIndex: number; // 0 to 5 for progressive stages, -1 for cancelled
  isTerminal?: boolean;
}

/**
 * Standard customer-facing lifecycle stages:
 * 0: Submitted (new)
 * 1: Under review (reviewing)
 * 2: Quote shared (quoted)
 * 3: Accepted (accepted)
 * 4: Being crafted (in_progress)
 * 5: Completed (completed)
 * Terminal: Cancelled (cancelled)
 */
export const CUSTOM_REQUEST_STATUSES: Record<string, StatusMeta> = {
  new: {
    key: "new",
    label: "Submitted",
    description: "Your custom build request has been received and logged in our studio queue.",
    badgeClass: "bg-acid/10 border-acid/40 text-acid",
    stepIndex: 0,
  },
  reviewing: {
    key: "reviewing",
    label: "Under review",
    description: "Our artisans are analyzing can geometry, structural balance, and fabrication feasibility.",
    badgeClass: "bg-blue-500/10 border-blue-500/40 text-blue-400",
    stepIndex: 1,
  },
  quoted: {
    key: "quoted",
    label: "Quote shared",
    description: "We have prepared and shared a custom quotation and estimated turnaround timeline.",
    badgeClass: "bg-purple-500/10 border-purple-500/40 text-purple-400",
    stepIndex: 2,
  },
  accepted: {
    key: "accepted",
    label: "Accepted",
    description: "Quotation accepted; workbench scheduled and materials being curated.",
    badgeClass: "bg-cyan-500/10 border-cyan-500/40 text-cyan-400",
    stepIndex: 3,
  },
  in_progress: {
    key: "in_progress",
    label: "Being crafted",
    description: "Artisans are cutting, folding, riveting, and assembling your relic.",
    badgeClass: "bg-amber-500/10 border-amber-500/40 text-amber-400",
    stepIndex: 4,
  },
  completed: {
    key: "completed",
    label: "Completed",
    description: "Sculpture finalized, inspected, packed in rigid protective armor packaging, and dispatched.",
    badgeClass: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400",
    stepIndex: 5,
    isTerminal: true,
  },
  cancelled: {
    key: "cancelled",
    label: "Cancelled",
    description: "This commission request was closed or cancelled.",
    badgeClass: "bg-blood/10 border-blood/40 text-blood",
    stepIndex: -1,
    isTerminal: true,
  },

  // --- Legacy Mappings (Preserves backwards compatibility for existing rows) ---
  reviewed: {
    key: "reviewed",
    label: "Under review",
    description: "Our artisans are analyzing can geometry and fabrication feasibility.",
    badgeClass: "bg-blue-500/10 border-blue-500/40 text-blue-400",
    stepIndex: 1,
  },
  in_discussion: {
    key: "in_discussion",
    label: "Quote shared",
    description: "We are discussing quote options and design specifications with you.",
    badgeClass: "bg-purple-500/10 border-purple-500/40 text-purple-400",
    stepIndex: 2,
  },
  contacted: {
    key: "contacted",
    label: "Under review",
    description: "Artisans reached out regarding your commission.",
    badgeClass: "bg-blue-500/10 border-blue-500/40 text-blue-400",
    stepIndex: 1,
  },
  declined: {
    key: "declined",
    label: "Cancelled",
    description: "This commission proposal was declined or cancelled.",
    badgeClass: "bg-blood/10 border-blood/40 text-blood",
    stepIndex: -1,
    isTerminal: true,
  },
  closed: {
    key: "closed",
    label: "Cancelled",
    description: "This request was closed.",
    badgeClass: "bg-blood/10 border-blood/40 text-blood",
    stepIndex: -1,
    isTerminal: true,
  },
};

/**
 * Normalizes any database status string to its customer-facing display metadata
 */
export function getCustomRequestStatusMeta(status: string | null | undefined): StatusMeta {
  if (!status) return CUSTOM_REQUEST_STATUSES.new;
  const normalized = status.toLowerCase().trim();
  return (
    CUSTOM_REQUEST_STATUSES[normalized] || {
      key: normalized,
      label: normalized.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      description: "Request status updated.",
      badgeClass: "bg-steel/10 border-steel/40 text-steel",
      stepIndex: 1,
    }
  );
}

/**
 * Ordered lifecycle steps for stepper visualization
 */
export const LIFECYCLE_STEPS = [
  { key: "new", label: "Submitted" },
  { key: "reviewing", label: "Under review" },
  { key: "quoted", label: "Quote shared" },
  { key: "accepted", label: "Accepted" },
  { key: "in_progress", label: "Being crafted" },
  { key: "completed", label: "Completed" },
];

/**
 * Format timestamp in Indian Standard Time (IST, UTC+5:30)
 */
export function formatIST(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "N/A";
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "N/A";
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d) + " IST";
  } catch {
    return "N/A";
  }
}
