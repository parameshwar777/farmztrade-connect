import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  CalendarClock,
  Heart,
  MapPin,
  MessageCircle,
  Phone,
  Scale,
  Share2,
  ShoppingBasket,
  Syringe,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell, TrustNote } from "@/components/app-shell";
import { SignInPrompt, useAuthAction } from "@/components/auth-gate";
import { StatusBadge, VerifiedBadge } from "@/components/badges";
import { SafeImage } from "@/components/media";
import { OfferDialog } from "@/components/offer-dialog";
import { ErrorState, RowSkeleton } from "@/components/states";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  addInterested,
  fetchFavoriteIds,
  fetchListing,
  startConversation,
  toggleFavorite,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatAge, formatINR, formatWeight, shortPlace, timeAgo } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/animals/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Animal details — FARMZTRADE" },
      { name: "description", content: "See photos, breed, age, weight, health details and seller information." },
      { property: "og:title", content: "Animal details — FARMZTRADE" },
      { property: "og:description", content: "Chat with the seller, make an offer or arrange a visit." },
    ],
  }),
  component: AnimalDetail,
});

function AnimalDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = useAuth();
  const { guard, prompt, setPrompt } = useAuthAction();
  const [active, setActive] = useState(0);
  const [offerOpen, setOfferOpen] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  const listing = useQuery({ queryKey: ["listing", id], queryFn: () => fetchListing(id) });
  const favorites = useQuery({
    queryKey: ["favorite-ids", user?.id],
    queryFn: () => fetchFavoriteIds(user!.id),
    enabled: Boolean(user),
  });

  if (listing.isLoading) {
    return (
      <AppShell title="Loading…" showBrandHeader={false} showBack>
        <div className="aspect-[4/3] w-full animate-pulse rounded-3xl bg-muted" />
        <div className="mt-4">
          <RowSkeleton count={3} />
        </div>
      </AppShell>
    );
  }

  if (listing.isError || !listing.data) {
    return (
      <AppShell title="Animal" showBrandHeader={false} showBack>
        <ErrorState message="This listing is no longer available." onRetry={() => void listing.refetch()} />
      </AppShell>
    );
  }

  const l = listing.data;
  const isOwner = user?.id === l.seller_id;
  const isFavorite = (favorites.data ?? []).includes(l.id);
  const images = l.animal_images.length ? l.animal_images : [{ url: "", sort_order: 0 }];

  async function handleFavorite() {
    guard(async () => {
      await toggleFavorite(user!.id, l.id, !isFavorite);
      await favorites.refetch();
      toast.success(isFavorite ? "Removed from favorites." : "Saved to favorites.");
    });
  }

  async function handleInterested() {
    guard(async () => {
      try {
        await addInterested(user!.id, l.id);
        toast.success("Added to your interested list.");
      } catch {
        toast.error("Could not add this animal.");
      }
    });
  }

  async function handleChat() {
    guard(async () => {
      try {
        const conversation = await startConversation(l, user!.id);
        navigate({ to: "/chats/$id", params: { id: conversation.id } });
      } catch {
        toast.error("Could not open the chat.");
      }
    });
  }

  async function handleShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: l.title, text: `${l.title} — ${formatINR(Number(l.price))}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied.");
      }
    } catch {
      /* user dismissed the share sheet */
    }
  }

  return (
    <AppShell
      title={l.title}
      showBrandHeader={false}
      showBack
      className="pb-40"
      headerRight={
        <Button variant="ghost" size="icon" aria-label="Share" onClick={handleShare} className="h-10 w-10 rounded-full">
          <Share2 className="h-5 w-5" />
        </Button>
      }
    >
      <SignInPrompt open={prompt} onOpenChange={setPrompt} />

      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <div className="relative overflow-hidden rounded-4xl bg-muted">
          <div className="aspect-[4/3] w-full">
            <SafeImage path={images[active]?.url} alt={l.title} eager className="h-full w-full" />
          </div>
          <button
            aria-label={isFavorite ? "Remove from favorites" : "Save to favorites"}
            onClick={handleFavorite}
            className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-card/90 float-shadow"
          >
            <Heart className={cn("h-5 w-5", isFavorite ? "fill-destructive text-destructive" : "text-foreground")} />
          </button>
          {l.status !== "approved" && (
            <div className="absolute left-3 top-3">
              <StatusBadge status={l.status} />
            </div>
          )}
        </div>

        {images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {images.map((img, i) => (
              <button
                key={`${img.url}-${i}`}
                onClick={() => setActive(i)}
                aria-label={`Photo ${i + 1}`}
                className={cn(
                  "h-16 w-16 shrink-0 overflow-hidden rounded-2xl ring-2 transition-all",
                  i === active ? "ring-primary" : "ring-transparent",
                )}
              >
                <SafeImage path={img.url} alt="" className="h-full w-full" />
              </button>
            ))}
          </div>
        )}
      </motion.div>

      <div className="mt-5">
        <h1 className="font-display text-2xl font-extrabold leading-tight">{l.title}</h1>
        <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {shortPlace([l.village, l.city, l.district, l.state])}
          <span>•</span>
          {timeAgo(l.created_at)}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="font-display text-3xl font-extrabold text-primary">{formatINR(Number(l.price))}</span>
          {l.negotiable && (
            <span className="rounded-full bg-gold/25 px-3 py-1 text-xs font-semibold text-gold-foreground">
              Negotiable
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Fact icon={CalendarClock} label="Age" value={formatAge(l.age_months)} />
        <Fact icon={Scale} label="Weight" value={formatWeight(l.weight_kg)} />
        <Fact icon={BadgeCheck} label="Breed" value={l.breed ?? "—"} />
        <Fact icon={Syringe} label="Vaccinated" value={l.vaccinated ? "Yes" : "Not stated"} />
      </div>

      <section className="mt-6 rounded-3xl bg-card p-5 card-shadow">
        <h2 className="font-display text-base font-bold">Details</h2>
        <dl className="mt-3 grid grid-cols-2 gap-y-3 text-sm">
          <Detail label="Category" value={l.category_slug.replace(/-/g, " ")} />
          <Detail label="Gender" value={l.gender ?? "—"} />
          {l.milk_yield ? <Detail label="Milk yield" value={`${l.milk_yield} litres/day`} /> : null}
          {l.pregnant !== null ? <Detail label="Pregnant" value={l.pregnant ? "Yes" : "No"} /> : null}
          <Detail label="Health" value={l.health ?? "—"} />
          <Detail label="Views" value={String(l.views)} />
        </dl>
        {l.vaccination_note && (
          <p className="mt-3 rounded-2xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">
            {l.vaccination_note}
          </p>
        )}
        {l.description && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed">{l.description}</p>}
      </section>

      <section className="mt-4 rounded-3xl bg-card p-5 card-shadow">
        <h2 className="font-display text-base font-bold">Seller</h2>
        <div className="mt-3 flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={l.seller?.avatar_url ?? undefined} alt="" />
            <AvatarFallback className="bg-primary-soft font-semibold text-primary-deep">
              {(l.seller?.full_name ?? "FZ").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{l.seller?.full_name ?? "Seller"}</p>
            <p className="truncate text-xs text-muted-foreground">
              {shortPlace([l.seller?.city, l.seller?.district])} • Member since{" "}
              {l.seller?.created_at ? new Date(l.seller.created_at).getFullYear() : "—"}
            </p>
          </div>
          {l.seller?.verification === "approved" && <VerifiedBadge compact />}
        </div>

        <Separator className="my-4" />

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" className="flex-1 rounded-full" onClick={handleChat}>
            <MessageCircle className="mr-1.5 h-4 w-4" />
            {t("chat.with")}
          </Button>
          <Button
            variant="secondary"
            className="flex-1 rounded-full"
            onClick={() => guard(() => setShowPhone(true))}
          >
            <Phone className="mr-1.5 h-4 w-4" />
            {showPhone && l.seller?.phone ? l.seller.phone : "Show number"}
          </Button>
        </div>
      </section>

      <TrustNote />

      {!isOwner && (
        <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border/60 bg-card/95 px-4 py-3 backdrop-blur safe-bottom lg:bottom-0">
          <div className="mx-auto flex max-w-6xl gap-2">
            <Button variant="secondary" className="h-12 flex-1 rounded-full" onClick={handleInterested}>
              <ShoppingBasket className="mr-1.5 h-4 w-4" />
              {t("cart.interested")}
            </Button>
            <Button className="h-12 flex-1 rounded-full" onClick={() => guard(() => setOfferOpen(true))}>
              {t("offer.make")}
            </Button>
          </div>
        </div>
      )}

      {isOwner && (
        <div className="mt-6 rounded-3xl bg-secondary p-4 text-center text-sm">
          This is your listing.{" "}
          <Link to="/my-listings" className="font-semibold text-primary">
            Manage your listings
          </Link>
        </div>
      )}

      {user && (
        <OfferDialog
          listing={l}
          buyerId={user.id}
          open={offerOpen}
          onOpenChange={setOfferOpen}
          onSent={() => navigate({ to: "/offers" })}
        />
      )}
    </AppShell>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof Scale; label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-card p-4 card-shadow">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-bold capitalize">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium capitalize">{value}</dd>
    </div>
  );
}
