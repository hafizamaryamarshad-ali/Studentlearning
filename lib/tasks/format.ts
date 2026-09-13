import type { SubmissionStatus } from "@/lib/supabase/types";

export const submissionStatusLabel: Record<SubmissionStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  needs_revision: "Needs revision",
  approved: "Approved",
  rejected: "Rejected",
};

export function submissionStatusTone(status: SubmissionStatus) {
  if (status === "approved") return "bg-emerald-100 text-emerald-800";
  if (status === "needs_revision" || status === "rejected") return "bg-amber-100 text-amber-800";
  if (status === "under_review") return "bg-violet-100 text-violet-800";
  return "bg-blue-100 text-blue-800";
}

export function formatDeadline(deadline: string | null) {
  if (!deadline) return "No deadline";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(deadline));
}
