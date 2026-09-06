import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { AnimalCard } from "@/components/animal-card";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/auth-gate";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { fetchFavorites, toggleFavorite } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { staggerList } from "@/lib/motion";

export const Route = createFileRoute("/favorites")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Favorites — FARMZTRADE" },
      { name: "description", content: "The animals you saved while browsing FARMZTRADE." },
      { property: "og:title", content: "Favorites — FARMZTRADE" },
      { property: "og:description", content: "Keep an eye on the animals you like most." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Favorites />
    </RequireAuth>
  ),
});

function Favorites() {
  const { user } = useAuth();
  const { t } = useI18n();
  const favorites = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: () => fetchFavorites(user!.id),
    enabled: Boolean(user),
  });

  return (
    <AppShell title="Favorites" showBrandHeader={false}>
      {favorites.isLoading ? (
        <CardGridSkeleton count={4} className="grid-cols-2 lg:grid-cols-4" />
      ) : favorites.isError ? (
        <ErrorState onRetry={() => void favorites.refetch()} />
      ) : favorites.data?.length ? (
        <motion.div
          variants={staggerList}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        >
          {favorites.data.map((l) => (
            <AnimalCard
              key={l.id}
              listing={l}
              favorite
              onToggleFavorite={async () => {
                await toggleFavorite(user!.id, l.id, false);
                await favorites.refetch();
                toast.success("Removed from favorites.");
              }}
            />
          ))}
        </motion.div>
      ) : (
        <EmptyState
          icon={<Heart className="h-7 w-7" />}
          title={t("empty.favorites.title")}
          body={t("empty.favorites.body")}
          action={
            <Button asChild className="rounded-full">
              <Link to="/search">Browse animals</Link>
            </Button>
          }
        />
      )}
    </AppShell>
  );
}
