import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Minus, Plus, ShieldCheck, Star, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { SignInPrompt, useAuthAction } from "@/components/auth-gate";
import { SafeImage } from "@/components/media";
import { ErrorState, RowSkeleton } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { addToFeedCart, fetchFeedProduct, fetchFeedProducts, FREE_DELIVERY_ABOVE } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatINR } from "@/lib/format";
import { fadeUp } from "@/lib/motion";

export const Route = createFileRoute("/feed/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Feed product — FARMZTRADE" },
      { name: "description", content: "Product details, pack size, price and delivery information." },
      { property: "og:title", content: "Feed product — FARMZTRADE" },
      { property: "og:description", content: "Quality animal nutrition delivered to your farm." },
    ],
  }),
  component: FeedProductPage,
});

function FeedProductPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { guard, prompt, setPrompt } = useAuthAction();
  const [qty, setQty] = useState(1);

  const product = useQuery({ queryKey: ["feed-product", id], queryFn: () => fetchFeedProduct(id) });
  const related = useQuery({
    queryKey: ["feed-products", product.data?.category_slug],
    queryFn: () => fetchFeedProducts(product.data!.category_slug),
    enabled: Boolean(product.data?.category_slug),
  });

  if (product.isLoading) {
    return (
      <AppShell title="Loading…" showBrandHeader={false} showBack>
        <div className="aspect-square w-full animate-pulse rounded-3xl bg-muted" />
        <div className="mt-4">
          <RowSkeleton count={2} />
        </div>
      </AppShell>
    );
  }

  if (product.isError || !product.data) {
    return (
      <AppShell title="Product" showBrandHeader={false} showBack>
        <ErrorState message="This product is not available." />
      </AppShell>
    );
  }

  const p = product.data;
  const outOfStock = p.stock <= 0;

  function addToCart(then?: "cart") {
    guard(async () => {
      try {
        await addToFeedCart(user!.id, p.id, qty);
        toast.success("Added to cart.");
        if (then === "cart") navigate({ to: "/feed-cart" });
      } catch {
        toast.error("Could not add to cart.");
      }
    });
  }

  return (
    <AppShell title={p.name} showBrandHeader={false} showBack className="pb-40">
      <SignInPrompt open={prompt} onOpenChange={setPrompt} />

      <motion.div variants={fadeUp} initial="hidden" animate="show" className="overflow-hidden rounded-4xl bg-muted">
        <div className="aspect-[4/3] w-full">
          <SafeImage path={p.image_url} alt={p.name} eager className="h-full w-full" />
        </div>
      </motion.div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {p.brand} • {p.animal_type}
        </p>
        <h1 className="mt-1 font-display text-2xl font-extrabold leading-tight">{p.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{p.weight_label}</p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="font-display text-3xl font-extrabold text-primary">{formatINR(Number(p.price))}</span>
          {p.mrp && Number(p.mrp) > Number(p.price) && (
            <span className="text-sm text-muted-foreground line-through">{formatINR(Number(p.mrp))}</span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
            <Star className="h-3.5 w-3.5 fill-gold text-gold" />
            {Number(p.rating).toFixed(1)}
          </span>
        </div>

        <p className={outOfStock ? "mt-2 text-sm font-semibold text-destructive" : "mt-2 text-sm text-muted-foreground"}>
          {outOfStock ? "Out of stock" : `${p.stock} packs available`}
        </p>
      </div>

      <div className="mt-5 flex items-center gap-4 rounded-3xl bg-card p-4 card-shadow">
        <span className="text-sm font-semibold">Quantity</span>
        <div className="ml-auto flex items-center gap-3">
          <Button
            size="icon"
            variant="secondary"
            aria-label="Decrease"
            className="h-10 w-10 rounded-full"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center font-display text-lg font-bold">{qty}</span>
          <Button
            size="icon"
            variant="secondary"
            aria-label="Increase"
            className="h-10 w-10 rounded-full"
            onClick={() => setQty((q) => Math.min(p.stock || 99, q + 1))}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <section className="mt-4 rounded-3xl bg-card p-5 card-shadow">
        <h2 className="font-display text-base font-bold">About this product</h2>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/85">
          {p.description ?? "Balanced nutrition to support growth, milk yield and overall health."}
        </p>
        <Separator className="my-4" />
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            Free delivery above ₹{FREE_DELIVERY_ABOVE.toLocaleString("en-IN")}
          </li>
          <li className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Sealed packs sourced from trusted brands
          </li>
        </ul>
      </section>

      {(related.data ?? []).filter((r) => r.id !== p.id).length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-lg font-extrabold">You may also like</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {(related.data ?? [])
              .filter((r) => r.id !== p.id)
              .slice(0, 6)
              .map((r) => (
                <Link
                  key={r.id}
                  to="/feed/$id"
                  params={{ id: r.id }}
                  className="w-40 shrink-0 rounded-3xl bg-card p-3 card-shadow"
                >
                  <div className="aspect-square overflow-hidden rounded-2xl">
                    <SafeImage path={r.image_url} alt={r.name} className="h-full w-full" />
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs font-semibold">{r.name}</p>
                  <p className="text-sm font-bold text-primary">{formatINR(Number(r.price))}</p>
                </Link>
              ))}
          </div>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border/60 bg-card/95 px-4 py-3 backdrop-blur safe-bottom lg:bottom-0">
        <div className="mx-auto flex max-w-6xl gap-2">
          <Button
            variant="secondary"
            className="h-12 flex-1 rounded-full"
            disabled={outOfStock}
            onClick={() => addToCart()}
          >
            Add to Cart
          </Button>
          <Button className="h-12 flex-1 rounded-full" disabled={outOfStock} onClick={() => addToCart("cart")}>
            Buy Now
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
