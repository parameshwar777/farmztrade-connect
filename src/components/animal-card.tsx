import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart, MapPin } from "lucide-react";

import { VerifiedBadge, PopularBadge } from "@/components/badges";
import { SafeImage } from "@/components/media";
import type { ListingWithMeta } from "@/lib/api";
import { formatAge, formatINR, formatWeight, shortPlace } from "@/lib/format";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function AnimalCard({
  listing,
  favorite = false,
  onToggleFavorite,
  layout = "grid",
}: {
  listing: ListingWithMeta;
  favorite?: boolean;
  onToggleFavorite?: (listing: ListingWithMeta, next: boolean) => void;
  layout?: "grid" | "row";
}) {
  const cover = listing.animal_images[0]?.url;
  const sold = listing.status === "sold";

  if (layout === "row") {
    return (
      <motion.div variants={fadeUp}>
        <Link
          to="/animals/$id"
          params={{ id: listing.id }}
          className="flex gap-3 rounded-3xl bg-card p-3 card-shadow"
        >
          <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-2xl">
            <SafeImage path={cover} alt={listing.title} className="h-full w-full" />
            {sold && <SoldOverlay />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold">{listing.title}</h3>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {[listing.gender, formatAge(listing.age_months), formatWeight(listing.weight_kg)]
                .filter((v) => v && v !== "—")
                .join(" • ")}
            </p>
            <p className="mt-1 font-display text-lg font-bold text-primary">{formatINR(Number(listing.price))}</p>
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              {shortPlace([listing.city, listing.district])}
            </p>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div variants={fadeUp} whileHover={{ y: -3 }} whileTap={{ scale: 0.985 }} className="h-full">
      <Link
        to="/animals/$id"
        params={{ id: listing.id }}
        className="group flex h-full flex-col overflow-hidden rounded-3xl bg-card card-shadow"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <SafeImage
            path={cover}
            alt={listing.title}
            className="h-full w-full transition-transform duration-500 group-hover:scale-[1.06]"
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {listing.is_popular && <PopularBadge />}
          </div>
          {onToggleFavorite && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.8 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(listing, !favorite);
              }}
              aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-card/90 backdrop-blur"
            >
              <motion.span
                key={String(favorite)}
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 14 }}
              >
                <Heart
                  className={cn("h-[18px] w-[18px]", favorite ? "fill-destructive text-destructive" : "text-foreground/70")}
                />
              </motion.span>
            </motion.button>
          )}
          {sold && <SoldOverlay />}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {listing.category_slug} {listing.breed ? `• ${listing.breed}` : ""}
          </p>
          <h3 className="mt-1 truncate font-display text-base font-bold">{listing.title}</h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {[listing.gender, formatAge(listing.age_months)].filter((v) => v && v !== "—").join(" • ")}
          </p>
          <p className="mt-2 font-display text-xl font-extrabold text-primary">{formatINR(Number(listing.price))}</p>
          <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            {shortPlace([listing.city, listing.state])}
          </p>
          {listing.seller?.verification === "approved" && (
            <div className="mt-3">
              <VerifiedBadge compact />
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

function SoldOverlay() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-foreground/45">
      <span className="rounded-full bg-card px-3 py-1 text-xs font-bold tracking-widest text-foreground">SOLD</span>
    </div>
  );
}
