import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

import { FeedManager } from "@/components/admin/feed-manager";
import { ListingsPanel } from "@/components/admin/listings-panel";
import { OffersPanel } from "@/components/admin/offers-panel";
import { PeoplePanel } from "@/components/admin/people-panel";
import { ReportsPanel } from "@/components/admin/reports-panel";
import { SellersPanel } from "@/components/admin/sellers-panel";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/auth-gate";
import { EmptyState, RowSkeleton } from "@/components/states";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { fadeUp } from "@/lib/motion";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin panel — FARMZTRADE" },
      { name: "description", content: "Review seller verifications, approve listings, manage feed products and handle reports." },
      { property: "og:title", content: "Admin panel — FARMZTRADE" },
      { property: "og:description", content: "FARMZTRADE moderation tools." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <AdminGate />
    </RequireAuth>
  ),
});

function AdminGate() {
  const { isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <AppShell title="Admin" showBrandHeader={false} showBack>
        <RowSkeleton count={3} />
      </AppShell>
    );
  }
  if (!isAdmin) {
    return (
      <AppShell title="Admin" showBrandHeader={false} showBack>
        <EmptyState
          icon={<ShieldCheck className="h-7 w-7" />}
          title="Admins only"
          body="This area is limited to the FARMZTRADE moderation team."
        />
      </AppShell>
    );
  }
  return <AdminPanel />;
}

function AdminPanel() {
  const { user } = useAuth();
  const adminId = user!.id;

  const counts = useQuery({
    queryKey: ["admin-counts"],
    queryFn: async () => {
      const [sellers, listings, reports, offers, products] = await Promise.all([
        supabase.from("user_verifications").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("animal_listings").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("offers").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("feed_products").select("id", { count: "exact", head: true }),
      ]);
      return {
        sellers: sellers.count ?? 0,
        listings: listings.count ?? 0,
        reports: reports.count ?? 0,
        offers: offers.count ?? 0,
        products: products.count ?? 0,
      };
    },
  });

  const log = useQuery({
    queryKey: ["admin-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_actions")
        .select("*, admin:admin_id(full_name)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <AppShell title="Admin panel" showBrandHeader={false} showBack>
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="space-y-4">
        <section className="grid grid-cols-2 gap-3">
          <Stat label="Sellers waiting" value={counts.data?.sellers} />
          <Stat label="Listings waiting" value={counts.data?.listings} />
          <Stat label="Open reports" value={counts.data?.reports} />
          <Stat label="Open offers" value={counts.data?.offers} />
        </section>

        <Tabs defaultValue="sellers">
          <div className="-mx-4 overflow-x-auto px-4 no-scrollbar">
            <TabsList className="w-max rounded-full">
              <TabsTrigger value="sellers" className="rounded-full">
                Sellers {counts.data?.sellers ? `(${counts.data.sellers})` : ""}
              </TabsTrigger>
              <TabsTrigger value="listings" className="rounded-full">
                Listings {counts.data?.listings ? `(${counts.data.listings})` : ""}
              </TabsTrigger>
              <TabsTrigger value="feed" className="rounded-full">
                Feed store
              </TabsTrigger>
              <TabsTrigger value="offers" className="rounded-full">
                Offers
              </TabsTrigger>
              <TabsTrigger value="reports" className="rounded-full">
                Reports {counts.data?.reports ? `(${counts.data.reports})` : ""}
              </TabsTrigger>
              <TabsTrigger value="people" className="rounded-full">
                Users &amp; admins
              </TabsTrigger>
              <TabsTrigger value="log" className="rounded-full">
                Activity
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="sellers" className="mt-4">
            <SellersPanel adminId={adminId} />
          </TabsContent>
          <TabsContent value="listings" className="mt-4">
            <ListingsPanel adminId={adminId} />
          </TabsContent>
          <TabsContent value="feed" className="mt-4">
            <FeedManager adminId={adminId} />
          </TabsContent>
          <TabsContent value="offers" className="mt-4">
            <OffersPanel />
          </TabsContent>
          <TabsContent value="reports" className="mt-4">
            <ReportsPanel adminId={adminId} />
          </TabsContent>
          <TabsContent value="people" className="mt-4">
            <PeoplePanel adminId={adminId} />
          </TabsContent>
          <TabsContent value="log" className="mt-4">
            {log.isLoading ? (
              <RowSkeleton count={3} />
            ) : log.data?.length ? (
              <ul className="space-y-2">
                {log.data.map((a) => {
                  const admin = a.admin as { full_name?: string } | null;
                  return (
                    <li key={a.id} className="rounded-2xl bg-card p-3 card-shadow">
                      <p className="text-sm font-semibold capitalize">{a.action.replace(/_/g, " ")}</p>
                      <p className="text-xs text-muted-foreground">
                        {admin?.full_name ?? "Admin"} • {timeAgo(a.created_at)}
                        {a.note ? ` • ${a.note}` : ""}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState title="No activity yet" body="Moderation decisions appear here." />
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-3xl bg-card p-4 card-shadow">
      <p className="font-display text-2xl font-extrabold text-primary">{value ?? "—"}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
