import { useQuery } from "@tanstack/react-query";
import { Handshake } from "lucide-react";

import { EmptyState, RowSkeleton } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, timeAgo } from "@/lib/format";

/** Read-only view of every price negotiation, newest first. */
export function OffersPanel() {
  const offers = useQuery({
    queryKey: ["admin-offers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*, listing:listing_id(title, price), buyer:buyer_id(full_name, phone), seller:seller_id(full_name, phone)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (offers.isLoading) return <RowSkeleton count={3} />;
  if (!offers.data?.length) {
    return <EmptyState icon={<Handshake className="h-7 w-7" />} title="No offers yet" body="Buyer offers appear here." />;
  }

  return (
    <ul className="space-y-3">
      {offers.data.map((o) => {
        const listing = o.listing as { title?: string; price?: number } | null;
        const buyer = o.buyer as { full_name?: string; phone?: string } | null;
        const seller = o.seller as { full_name?: string; phone?: string } | null;
        return (
          <li key={o.id} className="rounded-3xl bg-card p-4 card-shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-display font-bold">{listing?.title ?? "Listing removed"}</p>
                <p className="text-xs text-muted-foreground">
                  Asking {listing?.price ? formatINR(Number(listing.price)) : "—"}
                </p>
              </div>
              <Badge variant="secondary" className="rounded-full capitalize">
                {o.status}
              </Badge>
            </div>

            <p className="mt-2 text-sm font-bold text-primary">
              Offer {formatINR(Number(o.amount))}
              {o.counter_amount ? (
                <span className="ml-2 text-xs font-semibold text-gold">
                  Counter {formatINR(Number(o.counter_amount))}
                </span>
              ) : null}
            </p>
            {o.message && <p className="mt-1 text-sm text-foreground/80">“{o.message}”</p>}

            <div className="mt-3 space-y-2 border-l-2 border-border pl-3">
              <TimelineRow label="Offer placed" who={buyer?.full_name ?? "Buyer"} when={o.created_at} />
              {o.counter_amount ? (
                <TimelineRow
                  label={`Countered at ${formatINR(Number(o.counter_amount))}`}
                  who={seller?.full_name ?? "Seller"}
                  when={o.updated_at}
                />
              ) : null}
              {o.status !== "pending" && (
                <TimelineRow
                  label={`Marked ${o.status}`}
                  who={o.status === "withdrawn" ? (buyer?.full_name ?? "Buyer") : (seller?.full_name ?? "Seller")}
                  when={o.updated_at}
                />
              )}
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Buyer {buyer?.full_name} ({buyer?.phone}) → Seller {seller?.full_name} ({seller?.phone})
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function TimelineRow({ label, who, when }: { label: string; who: string; when: string }) {
  return (
    <div className="relative text-xs">
      <span className="absolute -left-[17px] top-1.5 h-2 w-2 rounded-full bg-primary" />
      <p className="font-semibold">{label}</p>
      <p className="text-muted-foreground">
        {who} • {timeAgo(when)}
      </p>
    </div>
  );
}
