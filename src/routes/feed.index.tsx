import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Search, ShoppingBag, Truck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { SignInPrompt, useAuthAction } from "@/components/auth-gate";
import { FeedProductCard } from "@/components/feed-product-card";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addToFeedCart,
  FREE_DELIVERY_ABOVE,
  fetchFeedCart,
  fetchFeedCategories,
  fetchFeedProducts,
  type FeedProduct,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { staggerList } from "@/lib/motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/feed/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Feed store — FARMZTRADE" },
      {
        name: "description",
        content: "Shop cattle feed, goat feed, poultry feed, minerals, supplements and pet food with home delivery.",
      },
      { property: "og:title", content: "Feed store — FARMZTRADE" },
      { property: "og:description", content: "Quality nutrition for healthier animals, delivered to your farm." },
    ],
  }),
  component: FeedStore,
});

function FeedStore() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { guard, prompt, setPrompt } = useAuthAction();
  const [category, setCategory] = useState<string | undefined>();
  const [text, setText] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(text.trim()), 350);
    return () => window.clearTimeout(id);
  }, [text]);

  const categories = useQuery({ queryKey: ["feed-categories"], queryFn: fetchFeedCategories, staleTime: 300_000 });
  const products = useQuery({
    queryKey: ["feed-products", category, debounced],
    queryFn: () => fetchFeedProducts(category, debounced || undefined),
    staleTime: 60_000,
  });
  const cart = useQuery({
    queryKey: ["feed-cart", user?.id],
    queryFn: () => fetchFeedCart(user!.id),
    enabled: Boolean(user),
  });
  const cartCount = (cart.data ?? []).reduce((sum, i) => sum + i.quantity, 0);

  function add(product: FeedProduct) {
    return new Promise<void>((resolve, reject) => {
      guard(async () => {
        try {
          await addToFeedCart(user!.id, product.id);
          await cart.refetch();
          resolve();
        } catch {
          toast.error("Could not add to cart.");
          reject(new Error("failed"));
        }
      });
      if (!user) reject(new Error("auth"));
    }).catch(() => undefined);
  }

  return (
    <AppShell
      title={t("feed.title")}
      showBrandHeader={false}
      headerRight={
        <Button asChild size="sm" variant="secondary" className="relative rounded-full">
          <Link to="/feed-cart">
            <ShoppingBag className="mr-1 h-4 w-4" />
            {cartCount > 0 ? cartCount : "Cart"}
          </Link>
        </Button>
      }
    >
      <SignInPrompt open={prompt} onOpenChange={setPrompt} />

      <section className="overflow-hidden rounded-4xl soft-gradient p-5 card-shadow">
        <h1 className="font-display text-xl font-extrabold text-primary-deep">{t("feed.title")}</h1>
        <p className="mt-1 text-sm text-primary-deep/80">{t("feed.subtitle")}</p>
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-primary">
          <Truck className="h-4 w-4" />
          Free delivery above ₹{FREE_DELIVERY_ABOVE.toLocaleString("en-IN")}
        </p>
      </section>

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search feed, minerals, pet food…"
          className="h-12 rounded-full bg-card pl-11 pr-10"
        />
        {text && (
          <button
            aria-label="Clear search"
            onClick={() => setText("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <CategoryChip active={!category} onClick={() => setCategory(undefined)} label="All" />
        {(categories.data ?? []).map((c) => (
          <CategoryChip
            key={c.slug}
            active={category === c.slug}
            onClick={() => setCategory(c.slug)}
            label={c.name}
          />
        ))}
      </div>

      <div className="mt-4">
        {products.isLoading ? (
          <CardGridSkeleton count={6} className="grid-cols-2 lg:grid-cols-4" />
        ) : products.isError ? (
          <ErrorState onRetry={() => void products.refetch()} />
        ) : products.data?.length ? (
          <motion.div
            variants={staggerList}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-3 lg:grid-cols-4"
          >
            {products.data.map((p) => (
              <FeedProductCard key={p.id} product={p} onAdd={add} />
            ))}
          </motion.div>
        ) : (
          <EmptyState title="No products found" body="Try another category or search term." />
        )}
      </div>
    </AppShell>
  );
}

function CategoryChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
        active ? "bg-primary text-primary-foreground" : "bg-card text-foreground card-shadow",
      )}
    >
      {label}
    </button>
  );
}
