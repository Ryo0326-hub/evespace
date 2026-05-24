import { cn } from "@/lib/utils";
import type { VerificationStatus } from "@/types/evespace";

const labels: Record<VerificationStatus, string> = {
  not_applicable: "Private Board",
  verified: "Verified Event",
  pending_review: "Verification Pending",
  unverified: "Unverified Event",
  rejected: "Rejected Event",
};

const styles: Record<VerificationStatus, string> = {
  not_applicable: "border-slate-200/40 bg-slate-300/15 text-slate-100",
  verified: "border-emerald-200/40 bg-emerald-300/15 text-emerald-100",
  pending_review: "border-cyan-200/40 bg-cyan-300/15 text-cyan-100",
  unverified: "border-amber-200/40 bg-amber-300/15 text-amber-100",
  rejected: "border-rose-200/40 bg-rose-300/15 text-rose-100",
};

export function EventVerificationBadge({
  status,
}: {
  status: VerificationStatus;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold",
        styles[status],
      )}
      title={getDescription(status)}
    >
      {labels[status]}
    </span>
  );
}

function getDescription(status: VerificationStatus) {
  if (status === "verified") {
    return "This event has been reviewed by Evespace.";
  }

  if (status === "pending_review") {
    return "The organizer has submitted this event for review.";
  }

  if (status === "rejected") {
    return "This event was reviewed and rejected by Evespace.";
  }

  return "This event has not yet been verified.";
}
