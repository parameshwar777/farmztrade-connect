import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MessageCircle, ShoppingBasket, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell, TrustNote } from "@/components/app-shell";
import { RequireAuth } from "@/components/auth-gate";
import { SafeImage } from "@/components/media";
import { EmptyState, ErrorState, RowSkeleton } from "@/components/states";
import { Button } from "@/components/ui/button";
import { fetchInterested, removeInterested, startConversation } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatINR, shortPlace } from "@/lib/format";
import { fadeUp, staggerList } from "@/lib/motion";

export const Route = createFileRoute("/interested")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Interested animals — FARMZTRADE" },
      { name: "description", content: "The animals you shortlisted to follow up on with their sellers." },
      { property: "og:title", content: "Interested animals — FARMZTRADE" },
      { property: "og:description", content: "Follow up with sellers on your shortlist." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Interested />
    </RequireAuth>
  ),
});

function Interested() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const interested = useQuery({
    queryKey: ["interested", user?.id],
    queryFn: () => fetchInterested(user!.id),
    enabled: Boolean(user),
  });

  return (
    <AppShell title="Interested" showBrandHeader={false}>
      <p className="mb-4 text-sm text-muted-foreground">
        Animals are bought directly from the seller — this list keeps track of the ones you want to follow up on.
      </p>

      {interested.isLoading ? (
        <RowSkeleton count={4} />
      ) : interested.isError ? (
        <ErrorState onRetry={() => void interested.refetch()} />
      ) : interested.data?.length ? (
        <motion.ul variants={staggerList} initial="hidden" animate="show" className="space-y-3">
          {interested.data.map((l) => (
            <motion.li key={l.id} variants={fadeUp} className="rounded-3xl bg-card p-3 card-shadow">
              <div className="flex gap-3">
                <Link to="/animals/$id" params={{ id: l.id }} className="h-20 w-24 shrink-0 overflow-hidden rounded-2xl">
                  <SafeImage path={l.animal_images[0]?.url} alt="" className="h-full w-full" />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{l.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {shortPlace([l.city, l.district])} • {l.seller?.full_name}
                  </p>
                  <p className="mt-1 font-bold text-primary">{formatINR(Number(l.price))}</p>
                </div>
                <button
                  aria-label="Remove"
                  className="h-fit rounded-full p-2 text-muted-foreground"
                  onClick={async () => {
                    await removeInterested(user!.id, l.id);
                    await interested.refetch();
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="mt-3 w-full rounded-full"
                onClick={async () => {
                  try {
                    const conversation = await startConversation(l, user!.id);
                    navigate({ to: "/chats/$id", params: { id: conversation.id } });
                  } catch {
                    toast.error("Could not open the chat.");
                  }
                }}
              >
                <MessageCircle className="mr-1.5 h-4 w-4" />
                Message seller
              </Button>
            </motion.li>
          ))}
        </motion.ul>
      ) : (
        <EmptyState
          icon={<ShoppingBasket className="h-7 w-7" />}
          title="Nothing on your shortlist"
          body="Tap “Add to Interested” on an animal to keep it here."
          action={
            <Button asChild className="rounded-full">
              <Link to="/search">Browse animals</Link>
            </Button>
          }
        />
      )}

      <TrustNote />
    </AppShell>
  );
}
