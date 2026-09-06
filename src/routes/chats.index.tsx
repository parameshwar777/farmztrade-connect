import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/auth-gate";
import { SafeImage } from "@/components/media";
import { EmptyState, ErrorState, RowSkeleton } from "@/components/states";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchConversations } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { staggerList, fadeUp } from "@/lib/motion";

export const Route = createFileRoute("/chats/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Messages — FARMZTRADE" },
      { name: "description", content: "Your conversations with buyers and sellers about specific animals." },
      { property: "og:title", content: "Messages — FARMZTRADE" },
      { property: "og:description", content: "Chat, negotiate and arrange visits in one place." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Chats />
    </RequireAuth>
  ),
});

function Chats() {
  const { user } = useAuth();
  const { t } = useI18n();
  const chats = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: () => fetchConversations(user!.id),
    enabled: Boolean(user),
    refetchInterval: 20_000,
  });

  return (
    <AppShell title="Messages" showBrandHeader={false}>
      {chats.isLoading ? (
        <RowSkeleton count={5} />
      ) : chats.isError ? (
        <ErrorState onRetry={() => void chats.refetch()} />
      ) : chats.data?.length ? (
        <motion.ul variants={staggerList} initial="hidden" animate="show" className="space-y-2">
          {chats.data.map((c) => {
            return (
              <motion.li key={c.id} variants={fadeUp}>
                <Link
                  to="/chats/$id"
                  params={{ id: c.id }}
                  className="flex items-center gap-3 rounded-3xl bg-card p-3 card-shadow"
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={c.other?.avatar_url ?? undefined} alt="" />
                      <AvatarFallback className="bg-primary-soft text-xs font-semibold text-primary-deep">
                        {(c.other?.full_name ?? "FZ").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate font-semibold">{c.other?.full_name ?? "FARMZTRADE user"}</p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(c.last_message_at)}</span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{c.listing?.title ?? "Listing"}</p>
                    <p className="truncate text-sm text-foreground/80">{c.last_message ?? "Say hello"}</p>
                  </div>
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl">
                    <SafeImage path={c.listing?.animal_images[0]?.url} alt="" className="h-full w-full" />
                  </div>
                </Link>
              </motion.li>
            );
          })}
        </motion.ul>
      ) : (
        <EmptyState
          icon={<MessageCircle className="h-7 w-7" />}
          title={t("empty.messages.title")}
          body={t("empty.messages.body")}
        />
      )}
    </AppShell>
  );
}
