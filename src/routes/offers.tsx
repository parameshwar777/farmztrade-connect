import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { HandCoins } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell, TrustNote } from "@/components/app-shell";
import { RequireAuth } from "@/components/auth-gate";
import { SafeImage } from "@/components/media";
import { EmptyState, ErrorState, RowSkeleton } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchMyOffers, respondToOffer, type OfferWithListing } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatINR, timeAgo } from "@/lib/format";
import { fadeUp, staggerList } from "@/lib/motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/offers")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Offers — FARMZTRADE" },
      { name: "description", content: "Track the offers you have made and received, and respond with a counter price." },
      { property: "og:title", content: "Offers — FARMZTRADE" },
      { property: "og:description", content: "Accept, decline or counter livestock offers." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Offers />
    </RequireAuth>
  ),
});

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-gold/25 text-gold-foreground",
  accepted: "bg-primary-soft text-primary-deep",
  rejected: "bg-destructive/15 text-destructive",
  countered: "bg-secondary text-secondary-foreground",
  withdrawn: "bg-secondary text-muted-foreground",
  expired: "bg-secondary text-muted-foreground",
};

function Offers() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"received" | "sent">("received");
  const [counter, setCounter] = useState<{ offer: OfferWithListing; amount: string } | null>(null);

  const offers = useQuery({
    queryKey: ["offers", user?.id],
    queryFn: () => fetchMyOffers(user!.id),
    enabled: Boolean(user),
  });

  const rows = (offers.data ?? []).filter((o) => (tab === "received" ? o.seller_id === user?.id : o.buyer_id === user?.id));

  async function respond(offer: OfferWithListing, action: "accepted" | "rejected" | "countered", amount?: number) {
    try {
      await respondToOffer(offer, action, amount);
      await offers.refetch();
      toast.success(
        action === "accepted" ? "Offer accepted." : action === "rejected" ? "Offer declined." : "Counter offer sent.",
      );
    } catch {
      toast.error("Could not update the offer.");
    }
  }

  return (
    <AppShell title="Offers" showBrandHeader={false}>
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="grid w-full grid-cols-2 rounded-full">
          <TabsTrigger value="received" className="rounded-full">
            Received
          </TabsTrigger>
          <TabsTrigger value="sent" className="rounded-full">
            Sent
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4">
        {offers.isLoading ? (
          <RowSkeleton count={4} />
        ) : offers.isError ? (
          <ErrorState onRetry={() => void offers.refetch()} />
        ) : rows.length ? (
          <motion.ul variants={staggerList} initial="hidden" animate="show" className="space-y-3">
            {rows.map((o) => (
              <motion.li key={o.id} variants={fadeUp} className="rounded-3xl bg-card p-4 card-shadow">
                <div className="flex gap-3">
                  <Link
                    to="/animals/$id"
                    params={{ id: o.listing_id }}
                    className="h-16 w-20 shrink-0 overflow-hidden rounded-2xl"
                  >
                    <SafeImage path={o.listing?.animal_images[0]?.url} alt="" className="h-full w-full" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{o.listing?.title ?? "Listing"}</p>
                    <p className="text-xs text-muted-foreground">
                      Listed {o.listing ? formatINR(Number(o.listing.price)) : "—"} • {timeAgo(o.created_at)}
                    </p>
                    <p className="mt-1 font-display text-lg font-extrabold text-primary">{formatINR(Number(o.amount))}</p>
                    {o.counter_amount ? (
                      <p className="text-xs font-semibold text-gold-foreground">
                        Counter: {formatINR(Number(o.counter_amount))}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      "h-fit shrink-0 rounded-full px-3 py-1 text-[11px] font-bold capitalize",
                      STATUS_STYLE[o.status] ?? "bg-secondary",
                    )}
                  >
                    {o.status}
                  </span>
                </div>

                {o.message && (
                  <p className="mt-3 rounded-2xl bg-secondary px-4 py-2.5 text-sm text-secondary-foreground">
                    “{o.message}”
                  </p>
                )}

                {tab === "received" && o.status === "pending" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" className="flex-1 rounded-full" onClick={() => respond(o, "accepted")}>
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1 rounded-full"
                      onClick={() => setCounter({ offer: o, amount: String(o.amount) })}
                    >
                      Counter
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 rounded-full text-destructive"
                      onClick={() => respond(o, "rejected")}
                    >
                      Decline
                    </Button>
                  </div>
                )}
              </motion.li>
            ))}
          </motion.ul>
        ) : (
          <EmptyState
            icon={<HandCoins className="h-7 w-7" />}
            title={tab === "received" ? "No offers received yet" : "No offers sent yet"}
            body={
              tab === "received"
                ? "Offers from buyers on your listings will appear here."
                : "Browse animals and send your price to a seller."
            }
            action={
              <Button asChild variant="secondary" className="rounded-full">
                <Link to="/search">Browse animals</Link>
              </Button>
            }
          />
        )}
      </div>

      <TrustNote />

      <Dialog open={Boolean(counter)} onOpenChange={(o) => !o && setCounter(null)}>
        <DialogContent className="rounded-3xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Counter offer</DialogTitle>
          </DialogHeader>
          <Input
            inputMode="numeric"
            className="h-12 rounded-2xl text-lg font-semibold"
            value={counter?.amount ?? ""}
            onChange={(e) => counter && setCounter({ ...counter, amount: e.target.value.replace(/\D/g, "") })}
          />
          <Button
            className="h-12 w-full rounded-full"
            onClick={() => {
              if (!counter) return;
              const amount = Number(counter.amount);
              if (!amount) {
                toast.error("Enter a counter amount.");
                return;
              }
              void respond(counter.offer, "countered", amount);
              setCounter(null);
            }}
          >
            Send counter offer
          </Button>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
