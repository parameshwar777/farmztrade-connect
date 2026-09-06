import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Flag, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { logAdminAction, notify } from "@/components/admin/shared";
import { SafeImage } from "@/components/media";
import { EmptyState, RowSkeleton } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { deleteUserAccount } from "@/lib/admin.functions";
import { formatINR, timeAgo } from "@/lib/format";

/** Reported listings and users, with the reported post shown inline. */
export function ReportsPanel({ adminId }: { adminId: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const removeAccount = useServerFn(deleteUserAccount);

  const reports = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select(
          "*, listing:listing_id(id, title, price, status, description, seller_id, animal_images(url)), reporter:reporter_id(full_name, phone), reported:reported_user_id(full_name, phone)",
        )
        .order("created_at", { ascending: false })
        .limit(80);
      if (error) throw error;
      return data ?? [];
    },
  });

  async function resolve(id: string) {
    setBusy(id);
    await supabase.from("reports").update({ status: "resolved" }).eq("id", id);
    await logAdminAction(adminId, "report_resolved", { table: "reports", targetId: id });
    await reports.refetch();
    setBusy(null);
    toast.success("Report closed.");
  }

  async function removeListing(reportId: string, listingId: string, sellerId: string) {
    setBusy(reportId);
    await supabase
      .from("animal_listings")
      .update({ status: "suspended", reject_reason: "Removed after a report from the community." })
      .eq("id", listingId);
    await notify(
      sellerId,
      "listing",
      "Your listing was removed",
      "It did not follow the FARMZTRADE rules for animals that can be sold.",
      "/my-listings",
    );
    await supabase.from("reports").update({ status: "action_taken" }).eq("id", reportId);
    await logAdminAction(adminId, "listing_suspended", { table: "animal_listings", targetId: listingId });
    await reports.refetch();
    setBusy(null);
    toast.success("Post taken down.");
  }

  async function removeUser(reportId: string, userId: string, name: string) {
    if (!window.confirm(`Remove ${name}? Their account and all listings will be taken down.`)) return;
    setBusy(reportId);
    try {
      await removeAccount({ data: { userId, reason: "Removed after report" } });
      await supabase.from("reports").update({ status: "action_taken" }).eq("id", reportId);
      await reports.refetch();
      toast.success(`${name} removed.`);
    } catch {
      toast.error("Could not remove this account.");
    } finally {
      setBusy(null);
    }
  }

  if (reports.isLoading) return <RowSkeleton count={2} />;
  if (!reports.data?.length) {
    return <EmptyState icon={<Flag className="h-7 w-7" />} title="No reports" body="The marketplace looks healthy." />;
  }

  return (
    <ul className="space-y-3">
      {reports.data.map((r) => {
        const listing = r.listing as
          | {
              id: string;
              title: string;
              price: number;
              status: string;
              description?: string | null;
              seller_id: string;
              animal_images?: { url: string }[];
            }
          | null;
        const reporter = r.reporter as { full_name?: string; phone?: string } | null;
        const reported = r.reported as { full_name?: string; phone?: string } | null;
        const offenderId = listing?.seller_id ?? r.reported_user_id;
        const offenderName = reported?.full_name ?? "This seller";

        return (
          <li key={r.id} className="rounded-3xl bg-card p-4 card-shadow">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold">{r.reason}</p>
              <Badge variant="secondary" className="rounded-full capitalize">
                {r.status.replace("_", " ")}
              </Badge>
            </div>
            {r.details && <p className="mt-1 text-sm text-foreground/80">{r.details}</p>}
            <p className="mt-1 text-xs text-muted-foreground">
              Reported by {reporter?.full_name ?? "a user"} • {timeAgo(r.created_at)}
            </p>

            {listing && (
              <div className="mt-3 flex gap-3 rounded-2xl bg-secondary p-3">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
                  <SafeImage path={listing.animal_images?.[0]?.url} alt={listing.title} className="h-full w-full" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display font-bold">{listing.title}</p>
                  <p className="text-sm font-bold text-primary">{formatINR(Number(listing.price))}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{listing.description}</p>
                  <p className="mt-1 text-xs capitalize text-muted-foreground">Status: {listing.status}</p>
                </div>
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {r.status === "open" && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full"
                  disabled={busy === r.id}
                  onClick={() => resolve(r.id)}
                >
                  Mark resolved
                </Button>
              )}
              {listing && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full"
                  disabled={busy === r.id}
                  onClick={() => removeListing(r.id, listing.id, listing.seller_id)}
                >
                  Take down post
                </Button>
              )}
              {offenderId && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="rounded-full"
                  disabled={busy === r.id}
                  onClick={() => removeUser(r.id, offenderId, offenderName)}
                >
                  <Trash2 className="mr-1 h-4 w-4" /> Delete user
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
