import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { useEffect } from "react";

import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/auth-gate";
import { EmptyState, ErrorState, RowSkeleton } from "@/components/states";
import { fetchNotifications, markNotificationsRead } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { fadeUp, staggerList } from "@/lib/motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Notifications — FARMZTRADE" },
      { name: "description", content: "Offers, messages, order updates and verification news in one place." },
      { property: "og:title", content: "Notifications — FARMZTRADE" },
      { property: "og:description", content: "Stay up to date with your FARMZTRADE activity." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <NotificationsPage />
    </RequireAuth>
  ),
});

function NotificationsPage() {
  const { user } = useAuth();
  const list = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => fetchNotifications(user!.id),
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (!user || !list.data?.some((n) => !n.read)) return;
    void markNotificationsRead(user.id);
  }, [user, list.data]);

  return (
    <AppShell title="Notifications" showBrandHeader={false}>
      {list.isLoading ? (
        <RowSkeleton count={4} />
      ) : list.isError ? (
        <ErrorState onRetry={() => void list.refetch()} />
      ) : list.data?.length ? (
        <motion.ul variants={staggerList} initial="hidden" animate="show" className="space-y-2.5">
          {list.data.map((n) => {
            const body = (
              <>
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                      n.read ? "bg-border" : "bg-primary",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              </>
            );
            return (
              <motion.li key={n.id} variants={fadeUp} className="rounded-2xl bg-card p-4 card-shadow">
                {n.link ? (
                  <Link to={n.link} className="block">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </motion.li>
            );
          })}
        </motion.ul>
      ) : (
        <EmptyState
          icon={<Bell className="h-7 w-7" />}
          title="No notifications yet"
          body="Offers, messages and order updates will appear here."
        />
      )}
    </AppShell>
  );
}
