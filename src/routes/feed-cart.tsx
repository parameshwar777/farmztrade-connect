import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/auth-gate";
import { SafeImage } from "@/components/media";
import { EmptyState, ErrorState, RowSkeleton } from "@/components/states";
import { Button } from "@/components/ui/button";
import { deliveryFeeFor, fetchFeedCart, FREE_DELIVERY_ABOVE, updateFeedCartItem } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatINR } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { fadeUp, staggerList } from "@/lib/motion";

export const Route = createFileRoute("/feed-cart")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Feed cart — FARMZTRADE" },
      { name: "description", content: "Review your feed order, delivery fee and total before checkout." },
      { property: "og:title", content: "Feed cart — FARMZTRADE" },
      { property: "og:description", content: "Your FARMZTRADE feed store cart." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <FeedCart />
    </RequireAuth>
  ),
});

function FeedCart() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const cart = useQuery({
    queryKey: ["feed-cart", user?.id],
    queryFn: () => fetchFeedCart(user!.id),
    enabled: Boolean(user),
  });

  const items = cart.data ?? [];
  const subtotal = items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);
  const delivery = deliveryFeeFor(subtotal);

  async function change(id: string, quantity: number) {
    try {
      await updateFeedCartItem(id, quantity);
      await cart.refetch();
    } catch {
      toast.error("Could not update the cart.");
    }
  }

  return (
    <AppShell title="Cart" showBrandHeader={false} className="pb-52">
      {cart.isLoading ? (
        <RowSkeleton count={3} />
      ) : cart.isError ? (
        <ErrorState onRetry={() => void cart.refetch()} />
      ) : items.length ? (
        <>
          <motion.ul variants={staggerList} initial="hidden" animate="show" className="space-y-3">
            {items.map((item) => (
              <motion.li key={item.id} variants={fadeUp} className="flex gap-3 rounded-3xl bg-card p-3 card-shadow">
                <Link
                  to="/feed/$id"
                  params={{ id: item.product.id }}
                  className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl"
                >
                  <SafeImage path={item.product.image_url} alt={item.product.name} className="h-full w-full" />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">{item.product.weight_label}</p>
                  <p className="mt-1 font-bold text-primary">{formatINR(Number(item.product.price))}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      aria-label="Decrease"
                      className="h-9 w-9 rounded-full"
                      onClick={() => change(item.id, item.quantity - 1)}
                    >
                      {item.quantity === 1 ? <Trash2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                    </Button>
                    <span className="w-7 text-center font-semibold">{item.quantity}</span>
                    <Button
                      size="icon"
                      variant="secondary"
                      aria-label="Increase"
                      className="h-9 w-9 rounded-full"
                      onClick={() => change(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.li>
            ))}
          </motion.ul>

          {delivery > 0 && (
            <p className="mt-4 flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-xs text-secondary-foreground">
              <Truck className="h-4 w-4 shrink-0" />
              Add {formatINR(FREE_DELIVERY_ABOVE - subtotal)} more for free delivery.
            </p>
          )}

          <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border/60 bg-card/95 px-4 py-3 backdrop-blur safe-bottom lg:bottom-0">
            <div className="mx-auto max-w-6xl">
              <dl className="space-y-1 text-sm">
                <Row label="Subtotal" value={formatINR(subtotal)} />
                <Row label="Delivery" value={delivery === 0 ? "Free" : formatINR(delivery)} />
                <Row label="Total" value={formatINR(subtotal + delivery)} strong />
              </dl>
              <Button className="mt-3 h-12 w-full rounded-full" onClick={() => navigate({ to: "/checkout" })}>
                {t("feed.checkout")}
              </Button>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          icon={<ShoppingBag className="h-7 w-7" />}
          title="Your cart is empty"
          body="Browse the feed store to stock up on nutrition for your animals."
          action={
            <Button asChild className="rounded-full">
              <Link to="/feed">Shop feed</Link>
            </Button>
          }
        />
      )}
    </AppShell>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className={strong ? "font-bold" : "text-muted-foreground"}>{label}</dt>
      <dd className={strong ? "font-display text-lg font-extrabold text-primary" : "font-medium"}>{value}</dd>
    </div>
  );
}
