import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PackageCheck } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/auth-gate";
import { SafeImage } from "@/components/media";
import { EmptyState, ErrorState, RowSkeleton } from "@/components/states";
import { Button } from "@/components/ui/button";
import { fetchMyOrders } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatINR, timeAgo } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { fadeUp, staggerList } from "@/lib/motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/orders")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My orders — FARMZTRADE" },
      { name: "description", content: "Track your feed orders, delivery status and payment details." },
      { property: "og:title", content: "My orders — FARMZTRADE" },
      { property: "og:description", content: "Your FARMZTRADE feed store orders." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Orders />
    </RequireAuth>
  ),
});

const STATUS_STYLE: Record<string, string> = {
  payment_pending: "bg-gold/25 text-gold-foreground",
  confirmed: "bg-secondary text-secondary-foreground",
  processing: "bg-secondary text-secondary-foreground",
  shipped: "bg-primary-soft text-primary-deep",
  delivered: "bg-primary-soft text-primary-deep",
  cancelled: "bg-destructive/15 text-destructive",
};

function Orders() {
  const { user } = useAuth();
  const { t } = useI18n();
  const orders = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: () => fetchMyOrders(user!.id),
    enabled: Boolean(user),
  });

  return (
    <AppShell title="My orders" showBrandHeader={false}>
      {orders.isLoading ? (
        <RowSkeleton count={3} />
      ) : orders.isError ? (
        <ErrorState onRetry={() => void orders.refetch()} />
      ) : orders.data?.length ? (
        <motion.ul variants={staggerList} initial="hidden" animate="show" className="space-y-3">
          {orders.data.map((o) => (
            <motion.li key={o.id} variants={fadeUp} className="rounded-3xl bg-card p-4 card-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display font-bold">#{o.order_no}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(o.created_at)}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-[11px] font-bold capitalize",
                    STATUS_STYLE[o.status] ?? "bg-secondary",
                  )}
                >
                  {o.status.replace("_", " ")}
                </span>
              </div>

              <ul className="mt-3 space-y-2">
                {(o.feed_order_items ?? []).map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                      <SafeImage path={item.image_url} alt="" className="h-full w-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × {formatINR(Number(item.unit_price))}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="text-muted-foreground capitalize">
                  {o.payment_provider === "cod" ? "Cash on delivery" : o.payment_provider} • {o.payment_status}
                </span>
                <span className="font-display text-lg font-extrabold text-primary">{formatINR(Number(o.total))}</span>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      ) : (
        <EmptyState
          icon={<PackageCheck className="h-7 w-7" />}
          title={t("empty.orders.title")}
          body={t("empty.orders.body")}
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
