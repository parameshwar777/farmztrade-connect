import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, PlusCircle, Search, Wheat } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AnimalCard } from "@/components/animal-card";
import { AppShell, TrustNote } from "@/components/app-shell";
import { SignInPrompt, useAuthAction } from "@/components/auth-gate";
import { VerifiedBadge } from "@/components/badges";
import { CategoryCard } from "@/components/category-card";
import { SafeImage } from "@/components/media";
import { CardGridSkeleton } from "@/components/states";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import heroImage from "@/assets/farm-hero.jpg";
import {
  fetchCategories,
  fetchFavoriteIds,
  fetchListings,
  fetchVerifiedSellers,
  toggleFavorite,
  type ListingWithMeta,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { shortPlace } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { fadeUp, staggerList } from "@/lib/motion";

export const Route = createFileRoute("/home")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Livestock marketplace — FARMZTRADE" },
      {
        name: "description",
        content:
          "Browse cattle, buffalo, goats, sheep, poultry and pets from verified sellers near you, and shop quality feed.",
      },
      { property: "og:title", content: "Livestock marketplace — FARMZTRADE" },
      {
        property: "og:description",
        content: "Verified sellers, direct chat and fair offers on every animal.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { guard, prompt, setPrompt } = useAuthAction();
  const [query, setQuery] = useState("");

  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories, staleTime: 300_000 });
  const featured = useQuery({
    queryKey: ["listings", "featured"],
    queryFn: () => fetchListings({ sort: "popular", limit: 6 }),
    staleTime: 60_000,
  });
  const recent = useQuery({
    queryKey: ["listings", "recent"],
    queryFn: () => fetchListings({ sort: "newest", limit: 6 }),
    staleTime: 60_000,
  });
  const nearby = useQuery({
    queryKey: ["listings", "nearby", profile?.district],
    queryFn: () => fetchListings({ district: profile?.district ?? undefined, limit: 6 }),
    enabled: Boolean(profile?.district),
    staleTime: 60_000,
  });
  const sellers = useQuery({ queryKey: ["verified-sellers"], queryFn: fetchVerifiedSellers, staleTime: 300_000 });
  const favorites = useQuery({
    queryKey: ["favorite-ids", user?.id],
    queryFn: () => fetchFavoriteIds(user!.id),
    enabled: Boolean(user),
  });

  async function onToggleFavorite(listing: ListingWithMeta, next: boolean) {
    guard(async () => {
      try {
        await toggleFavorite(user!.id, listing.id, next);
        await favorites.refetch();
        toast.success(next ? "Saved to favorites." : "Removed from favorites.");
      } catch {
        toast.error("Could not update favorites.");
      }
    });
  }

  const favIds = new Set(favorites.data ?? []);

  return (
    <AppShell>
      <SignInPrompt open={prompt} onOpenChange={setPrompt} />

      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="relative overflow-hidden rounded-4xl card-shadow"
      >
        <img src={heroImage} alt="Cattle grazing on an Indian farm at sunrise" className="h-56 w-full object-cover sm:h-72" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-deep/90 via-primary-deep/45 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h1 className="max-w-md font-display text-2xl font-extrabold leading-tight text-primary-foreground sm:text-3xl">
            {t("home.hero.title")}
          </h1>
          <p className="mt-1 text-sm text-primary-foreground/85">{t("home.hero.body")}</p>
        </div>
      </motion.section>

      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") navigate({ to: "/search", search: { q: query || undefined } });
            }}
            placeholder={t("search.placeholder")}
            className="h-12 rounded-full border-border bg-card pl-11"
          />
        </div>
        <Button
          className="h-12 shrink-0 rounded-full px-5"
          onClick={() => navigate({ to: "/search", search: { q: query || undefined } })}
        >
          {t("search.filters")}
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <QuickAction to="/search" icon={Search} label={t("home.buy")} />
        <QuickAction to="/sell" icon={PlusCircle} label={t("home.sell")} highlight />
        <QuickAction to="/feed" icon={Wheat} label={t("home.shop")} />
      </div>

      <Section title={t("home.categories")}>
        {categories.isLoading ? (
          <CardGridSkeleton count={4} className="grid-cols-2 sm:grid-cols-4" />
        ) : (
          <motion.div
            variants={staggerList}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
          >
            {(categories.data ?? []).map((c) => (
              <CategoryCard key={c.slug} category={c} />
            ))}
          </motion.div>
        )}
      </Section>

      <Section title={t("home.featured")} action={{ to: "/search", label: t("common.viewAll") }}>
        <ListingRow
          listings={featured.data}
          loading={featured.isLoading}
          favIds={favIds}
          onToggleFavorite={onToggleFavorite}
        />
      </Section>

      {Boolean(profile?.district) && (nearby.data?.length ?? 0) > 0 && (
        <Section title={`${t("home.popular")} — ${profile?.district}`}>
          <ListingRow
            listings={nearby.data}
            loading={nearby.isLoading}
            favIds={favIds}
            onToggleFavorite={onToggleFavorite}
          />
        </Section>
      )}

      <Section title={t("home.recent")} action={{ to: "/search", label: t("common.viewAll") }}>
        <ListingRow
          listings={recent.data}
          loading={recent.isLoading}
          favIds={favIds}
          onToggleFavorite={onToggleFavorite}
        />
      </Section>

      <Section title={t("home.sellers")}>
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {(sellers.data ?? []).map((s) => (
            <div key={s.id} className="w-40 shrink-0 rounded-3xl bg-card p-4 text-center card-shadow">
              <Avatar className="mx-auto h-14 w-14">
                <AvatarImage src={s.avatar_url ?? undefined} alt="" />
                <AvatarFallback className="bg-primary-soft font-semibold text-primary-deep">
                  {s.full_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="mt-2 truncate text-sm font-semibold">{s.full_name}</p>
              <p className="truncate text-xs text-muted-foreground">{shortPlace([s.city, s.district])}</p>
              <div className="mt-2 flex justify-center">
                <VerifiedBadge compact />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <section className="mt-8 overflow-hidden rounded-4xl soft-gradient p-5 card-shadow">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-extrabold text-primary-deep">{t("feed.title")}</h2>
            <p className="mt-1 text-sm text-primary-deep/80">{t("feed.subtitle")}</p>
            <Button asChild size="sm" className="mt-3 rounded-full">
              <Link to="/feed">
                {t("home.shop")} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="hidden h-24 w-24 shrink-0 overflow-hidden rounded-3xl sm:block">
            <SafeImage path={undefined} alt="" className="h-full w-full" />
          </div>
        </div>
      </section>

      <TrustNote />
    </AppShell>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
  highlight = false,
}: {
  to: string;
  icon: typeof Search;
  label: string;
  highlight?: boolean;
}) {
  return (
    <Link
      to={to}
      className={
        highlight
          ? "flex flex-col items-center gap-2 rounded-3xl brand-gradient px-3 py-4 text-primary-foreground card-shadow"
          : "flex flex-col items-center gap-2 rounded-3xl bg-card px-3 py-4 card-shadow"
      }
    >
      <Icon className={highlight ? "h-6 w-6" : "h-6 w-6 text-primary"} />
      <span className="text-center text-xs font-semibold leading-tight">{label}</span>
    </Link>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: { to: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="min-w-0 truncate font-display text-lg font-extrabold">{title}</h2>
        {action && (
          <Link to={action.to} className="shrink-0 text-sm font-semibold text-primary">
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function ListingRow({
  listings,
  loading,
  favIds,
  onToggleFavorite,
}: {
  listings?: ListingWithMeta[];
  loading: boolean;
  favIds: Set<string>;
  onToggleFavorite: (l: ListingWithMeta, next: boolean) => void;
}) {
  if (loading) return <CardGridSkeleton count={2} className="grid-cols-2" />;
  if (!listings?.length) return <p className="text-sm text-muted-foreground">Nothing here yet.</p>;

  return (
    <motion.div
      variants={staggerList}
      initial="hidden"
      animate="show"
      className="flex snap-x gap-3 overflow-x-auto pb-2 no-scrollbar"
    >
      {listings.map((l) => (
        <div key={l.id} className="w-[62vw] max-w-64 shrink-0 snap-start sm:w-64">
          <AnimalCard listing={l} favorite={favIds.has(l.id)} onToggleFavorite={onToggleFavorite} />
        </div>
      ))}
    </motion.div>
  );
}
