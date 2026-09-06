import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PlusCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/auth-gate";
import { StatusBadge } from "@/components/badges";
import { SafeImage } from "@/components/media";
import { EmptyState, ErrorState, RowSkeleton } from "@/components/states";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyListings } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatINR, timeAgo } from "@/lib/format";
import { fadeUp, staggerList } from "@/lib/motion";

export const Route = createFileRoute("/my-listings")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My listings — FARMZTRADE" },
      { name: "description", content: "Track approval status, views and interest on the animals you have listed." },
      { property: "og:title", content: "My listings — FARMZTRADE" },
      { property: "og:description", content: "Manage your livestock listings on FARMZTRADE." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <MyListings />
    </RequireAuth>
  ),
});

function MyListings() {
  const { user } = useAuth();
  const listings = useQuery({
    queryKey: ["my-listings", user?.id],
    queryFn: () => fetchMyListings(user!.id),
    enabled: Boolean(user),
  });

  async function markSold(id: string) {
    const { error } = await supabase.from("animal_listings").update({ status: "sold" }).eq("id", id);
    if (error) {
      toast.error("Could not update the listing.");
      return;
    }
    await listings.refetch();
    toast.success("Marked as sold.");
  }

  async function remove(id: string) {
    const { error } = await supabase.from("animal_listings").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete the listing.");
      return;
    }
    await listings.refetch();
    toast.success("Listing deleted.");
  }

  return (
    <AppShell
      title="My listings"
      showBrandHeader={false}
      headerRight={
        <Button asChild size="sm" className="rounded-full">
          <Link to="/sell">
            <PlusCircle className="mr-1 h-4 w-4" />
            New
          </Link>
        </Button>
      }
    >
      {listings.isLoading ? (
        <RowSkeleton count={4} />
      ) : listings.isError ? (
        <ErrorState onRetry={() => void listings.refetch()} />
      ) : listings.data?.length ? (
        <motion.ul variants={staggerList} initial="hidden" animate="show" className="space-y-3">
          {listings.data.map((l) => (
            <motion.li key={l.id} variants={fadeUp} className="rounded-3xl bg-card p-3 card-shadow">
              <div className="flex gap-3">
                <Link to="/animals/$id" params={{ id: l.id }} className="h-20 w-24 shrink-0 overflow-hidden rounded-2xl">
                  <SafeImage path={l.animal_images[0]?.url} alt="" className="h-full w-full" />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate font-semibold">{l.title}</p>
                    <StatusBadge status={l.status} />
                  </div>
                  <p className="mt-0.5 text-sm font-bold text-primary">{formatINR(Number(l.price))}</p>
                  <p className="text-xs text-muted-foreground">
                    {l.views} views • {timeAgo(l.created_at)}
                  </p>
                  {l.status === "rejected" && l.reject_reason && (
                    <p className="mt-1 text-xs text-destructive">{l.reject_reason}</p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                {l.status === "approved" && (
                  <Button size="sm" variant="secondary" className="flex-1 rounded-full" onClick={() => markSold(l.id)}>
                    Mark as sold
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full text-destructive"
                  onClick={() => remove(l.id)}
                  aria-label="Delete listing"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      ) : (
        <EmptyState
          title="No listings yet"
          body="List your first animal and reach buyers near you."
          action={
            <Button asChild className="rounded-full">
              <Link to="/sell">List an animal</Link>
            </Button>
          }
        />
      )}
    </AppShell>
  );
}
