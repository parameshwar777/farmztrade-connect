import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AnimalCard } from "@/components/animal-card";
import { AppShell, TrustNote } from "@/components/app-shell";
import { SignInPrompt, useAuthAction } from "@/components/auth-gate";
import { FilterSheet } from "@/components/filter-sheet";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchCategories,
  fetchFavoriteIds,
  fetchListings,
  toggleFavorite,
  type ListingFilters,
  type ListingWithMeta,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { staggerList } from "@/lib/motion";

type SearchParams = { q?: string; category?: string };

export const Route = createFileRoute("/search")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search["q"] === "string" && search["q"] ? (search["q"] as string) : undefined,
    category:
      typeof search["category"] === "string" && search["category"] ? (search["category"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Browse animals — FARMZTRADE" },
      {
        name: "description",
        content: "Filter livestock by category, breed, price, age, weight and district to find the right animal.",
      },
      { property: "og:title", content: "Browse animals — FARMZTRADE" },
      { property: "og:description", content: "Search verified livestock listings across India." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q, category } = Route.useSearch();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = useAuth();
  const { guard, prompt, setPrompt } = useAuthAction();

  const [text, setText] = useState(q ?? "");
  const [debounced, setDebounced] = useState(q ?? "");
  const [filters, setFilters] = useState<ListingFilters>({ category, sort: "newest" });

  useEffect(() => {
    setFilters((f) => ({ ...f, category }));
  }, [category]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(text.trim()), 350);
    return () => window.clearTimeout(id);
  }, [text]);

  const effective = useMemo<ListingFilters>(() => ({ ...filters, q: debounced || undefined }), [filters, debounced]);

  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories, staleTime: 300_000 });
  const listings = useQuery({
    queryKey: ["listings", effective],
    queryFn: () => fetchListings(effective),
    staleTime: 30_000,
  });
  const favorites = useQuery({
    queryKey: ["favorite-ids", user?.id],
    queryFn: () => fetchFavoriteIds(user!.id),
    enabled: Boolean(user),
  });
  const favIds = new Set(favorites.data ?? []);

  function onToggleFavorite(listing: ListingWithMeta, next: boolean) {
    guard(async () => {
      try {
        await toggleFavorite(user!.id, listing.id, next);
        await favorites.refetch();
      } catch {
        toast.error("Could not update favorites.");
      }
    });
  }

  const activeChips = Object.entries(effective).filter(
    ([k, v]) => !["sort", "limit", "q"].includes(k) && v !== undefined && v !== "" && v !== false && v !== "Any",
  );

  return (
    <AppShell title={t("nav.search")} showBrandHeader={false}>
      <SignInPrompt open={prompt} onOpenChange={setPrompt} />

      <div className="sticky top-[68px] z-20 -mx-4 bg-background/95 px-4 pb-3 pt-1 backdrop-blur">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("search.placeholder")}
              className="h-11 rounded-full border-border bg-card pl-11 pr-10"
            />
            {text && (
              <button
                aria-label="Clear search"
                onClick={() => setText("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <FilterSheet
            filters={effective}
            categories={categories.data ?? []}
            resultCount={listings.data?.length}
            onApply={(next) => {
              setFilters(next);
              navigate({ to: "/search", search: { q: debounced || undefined, category: next.category } });
            }}
          />
        </div>

        {activeChips.length > 0 && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {activeChips.map(([key, value]) => (
              <button
                key={key}
                onClick={() => setFilters((f) => ({ ...f, [key]: undefined }))}
                className="flex shrink-0 items-center gap-1 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-deep"
              >
                {String(value === true ? key : value)}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="mb-3 text-sm text-muted-foreground">
        {listings.isLoading ? t("common.loading") : `${listings.data?.length ?? 0} ${t("search.results").toLowerCase()}`}
      </p>

      {listings.isError ? (
        <ErrorState onRetry={() => void listings.refetch()} />
      ) : listings.isLoading ? (
        <CardGridSkeleton count={6} className="grid-cols-2 lg:grid-cols-4" />
      ) : listings.data?.length ? (
        <motion.div
          variants={staggerList}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        >
          {listings.data.map((l) => (
            <AnimalCard key={l.id} listing={l} favorite={favIds.has(l.id)} onToggleFavorite={onToggleFavorite} />
          ))}
        </motion.div>
      ) : (
        <EmptyState
          title={t("empty.animals.title")}
          body={t("empty.animals.body")}
          action={
            <Button
              variant="secondary"
              className="rounded-full"
              onClick={() => {
                setFilters({ sort: "newest" });
                setText("");
                navigate({ to: "/search", search: {} });
              }}
            >
              Clear filters
            </Button>
          }
        />
      )}

      <TrustNote />
    </AppShell>
  );
}
