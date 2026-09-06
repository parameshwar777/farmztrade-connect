import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, Loader2, Plus, Star } from "lucide-react";
import { useState } from "react";

import { SafeImage } from "@/components/media";
import { Button } from "@/components/ui/button";
import type { FeedProduct } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { fadeUp, spring } from "@/lib/motion";

export function FeedProductCard({
  product,
  onAdd,
}: {
  product: FeedProduct;
  onAdd?: (product: FeedProduct) => Promise<void> | void;
}) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const outOfStock = product.stock <= 0;

  async function handleAdd() {
    if (!onAdd || state !== "idle") return;
    setState("busy");
    try {
      await onAdd(product);
      setState("done");
      setTimeout(() => setState("idle"), 1600);
    } catch {
      setState("idle");
    }
  }

  return (
    <motion.div variants={fadeUp} whileHover={{ y: -3 }} className="flex h-full flex-col overflow-hidden rounded-3xl bg-card card-shadow">
      <Link to="/feed/$id" params={{ id: product.id }} className="block">
        <div className="relative aspect-[5/4] overflow-hidden bg-muted">
          <SafeImage path={product.image_url} alt={product.name} className="h-full w-full" />
          {outOfStock && (
            <span className="absolute left-3 top-3 rounded-full bg-foreground/80 px-2 py-0.5 text-[11px] font-semibold text-background">
              Out of stock
            </span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {product.brand} • {product.animal_type}
        </p>
        <Link to="/feed/$id" params={{ id: product.id }} className="mt-1">
          <h3 className="line-clamp-2 font-display text-[15px] font-bold leading-snug">{product.name}</h3>
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">{product.weight_label}</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="font-display text-lg font-extrabold text-primary">{formatINR(Number(product.price))}</span>
          {product.mrp && Number(product.mrp) > Number(product.price) && (
            <span className="text-xs text-muted-foreground line-through">{formatINR(Number(product.mrp))}</span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-gold text-gold" />
          {Number(product.rating).toFixed(1)}
          <span className="mx-1">•</span>
          {outOfStock ? "Unavailable" : `${product.stock} in stock`}
        </div>

        {onAdd && (
          <Button onClick={handleAdd} disabled={outOfStock || state === "busy"} className="mt-3 w-full rounded-full" size="sm">
            <motion.span key={state} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="inline-flex items-center gap-1.5">
              {state === "busy" && <Loader2 className="h-4 w-4 animate-spin" />}
              {state === "done" && <Check className="h-4 w-4" />}
              {state === "idle" && <Plus className="h-4 w-4" />}
              {state === "done" ? "Added" : "Add to Cart"}
            </motion.span>
          </Button>
        )}
      </div>
    </motion.div>
  );
}
