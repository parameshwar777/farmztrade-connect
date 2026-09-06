import { useQuery } from "@tanstack/react-query";
import { Tag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { logAdminAction, notify } from "@/components/admin/shared";
import { SafeImage } from "@/components/media";
import { EmptyState, RowSkeleton } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, timeAgo } from "@/lib/format";

type View = "pending" | "live" | "suspended";

/** Approve, reject or take down animal listings. */
export function ListingsPanel({ adminId }: { adminId: string }) {
  const [view, setView] = useState<View>("pending");
  const [busy, setBusy] = useState<string | null>(null);

  const listings = useQuery({
    queryKey: ["admin-listings", view],
    queryFn: async () => {
      const statuses = view === "pending" ? ["pending"] : view === "live" ? ["approved", "sold"] : ["suspended", "rejected"];
      const { data, error } = await supabase
        .from("animal_listings")
        .select("*, animal_images(url), seller:seller_id(full_name, phone)")
        .in("status", statuses)
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data ?? [];
    },
  });

  async function setStatus(id: string, sellerId: string, status: "approved" | "rejected" | "suspended") {
    setBusy(id);
    await supabase
      .from("animal_listings")
      .update({
        status,
        reject_reason: status === "approved" ? null : "Listing did not meet our guidelines.",
      })
      .eq("id", id);
    await notify(
      sellerId,
      "listing",
      status === "approved" ? "Your listing is live" : "Listing removed",
      status === "approved" ? "Buyers can now see your animal." : "Please review the rules and submit again.",
      "/my-listings",
    );
    await logAdminAction(adminId, `listing_${status}`, { table: "animal_listings", targetId: id });
    await listings.refetch();
    setBusy(null);
    toast.success(status === "approved" ? "Listing approved." : "Listing removed.");
  }

  return (
    <Tabs value={view} onValueChange={(v) => setView(v as View)}>
      <TabsList className="w-full rounded-full">
        <TabsTrigger value="pending" className="flex-1 rounded-full">
          Waiting
        </TabsTrigger>
        <TabsTrigger value="live" className="flex-1 rounded-full">
          Live
        </TabsTrigger>
        <TabsTrigger value="suspended" className="flex-1 rounded-full">
          Removed
        </TabsTrigger>
      </TabsList>

      <TabsContent value={view} className="mt-4">
        {listings.isLoading ? (
          <RowSkeleton count={2} />
        ) : listings.data?.length ? (
          <ul className="space-y-3">
            {listings.data.map((l) => {
              const images = (l.animal_images ?? []) as { url: string }[];
              const seller = l.seller as { full_name?: string; phone?: string } | null;
              return (
                <li key={l.id} className="rounded-3xl bg-card p-4 card-shadow">
                  <div className="flex gap-3">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
                      <SafeImage path={images[0]?.url} alt={l.title} className="h-full w-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate font-display font-bold">{l.title}</p>
                        <Badge variant="secondary" className="rounded-full capitalize">
                          {l.status}
                        </Badge>
                      </div>
                      <p className="text-sm font-bold text-primary">{formatINR(Number(l.price))}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {seller?.full_name} • {seller?.phone}
                      </p>
                      <p className="text-xs text-muted-foreground">{timeAgo(l.created_at)}</p>
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-foreground/85">{l.description}</p>
                  <div className="mt-3 flex gap-2">
                    {l.status !== "approved" && (
                      <Button
                        size="sm"
                        className="flex-1 rounded-full"
                        disabled={busy === l.id}
                        onClick={() => setStatus(l.id, l.seller_id, "approved")}
                      >
                        Approve
                      </Button>
                    )}
                    {l.status === "pending" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1 rounded-full"
                        disabled={busy === l.id}
                        onClick={() => setStatus(l.id, l.seller_id, "rejected")}
                      >
                        Reject
                      </Button>
                    )}
                    {(l.status === "approved" || l.status === "sold") && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1 rounded-full"
                        disabled={busy === l.id}
                        onClick={() => setStatus(l.id, l.seller_id, "suspended")}
                      >
                        Take down
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState icon={<Tag className="h-7 w-7" />} title="Nothing here" body="No listings in this list." />
        )}
      </TabsContent>
    </Tabs>
  );
}
