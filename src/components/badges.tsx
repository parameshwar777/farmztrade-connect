import { BadgeCheck, Flame, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ListingStatus } from "@/lib/api";

export function VerifiedBadge({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary-deep",
        className,
      )}
    >
      <BadgeCheck className="h-3.5 w-3.5" />
      {compact ? "Verified" : "Verified Seller"}
    </span>
  );
}

export function ApprovedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">
      <ShieldCheck className="h-3.5 w-3.5" />
      Admin Approved
    </span>
  );
}

export function PopularBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[11px] font-semibold text-gold-foreground">
      <Flame className="h-3.5 w-3.5" />
      Popular
    </span>
  );
}

const statusStyles: Record<string, string> = {
  approved: "bg-primary-soft text-primary-deep",
  pending: "bg-warning/20 text-warning-foreground",
  draft: "bg-muted text-muted-foreground",
  rejected: "bg-destructive/12 text-destructive",
  sold: "bg-foreground/10 text-foreground",
  suspended: "bg-destructive/12 text-destructive",
};

const statusLabels: Record<string, string> = {
  approved: "Active",
  pending: "Pending approval",
  draft: "Draft",
  rejected: "Rejected",
  sold: "Sold",
  suspended: "Suspended",
};

export function StatusBadge({ status, className }: { status: ListingStatus | string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
        statusStyles[status] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {statusLabels[status] ?? status.replace(/_/g, " ")}
    </span>
  );
}

export function TrustNote({ className }: { className?: string }) {
  return (
    <p className={cn("rounded-2xl bg-secondary px-4 py-3 text-xs leading-relaxed text-secondary-foreground", className)}>
      FARMZTRADE connects buyers and sellers. Always inspect an animal in person and confirm health records before
      paying. FARMZTRADE is not a party to any sale and does not hold payments between buyers and sellers.
    </p>
  );
}
