import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BadgeCheck, Flag, ShieldCheck, Tag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/auth-gate";
import { SafeImage } from "@/components/media";
import { EmptyState, RowSkeleton } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatINR, timeAgo } from "@/lib/format";
import { fadeUp, staggerList } from "@/lib/motion";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin panel — FARMZTRADE" },
      { name: "description", content: "Review seller verifications, approve listings and handle reports." },
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
  const [busy, setBusy] = useState<string | null>(null);

  const verifications = useQuery({
    queryKey: ["admin-verifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_verifications")
        .select("*, profiles:user_id(full_name, phone, city, district)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const listings = useQuery({
    queryKey: ["admin-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("animal_listings")
        .select("*, animal_images(*), seller:seller_id(full_name, phone)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const reports = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function log(action: string, targetId: string, note?: string) {
    await supabase.from("admin_actions").insert({
      admin_id: user!.id,
      action,
      target_id: targetId,
      note: note ?? null,
    });
  }

  async function decideVerification(id: string, userId: string, approve: boolean) {
    setBusy(id);
    await supabase
      .from("user_verifications")
      .update({ status: approve ? "approved" : "rejected", admin_note: approve ? null : "Details could not be confirmed." })
      .eq("id", id);
    await supabase.from("profiles").update({ verification: approve ? "approved" : "rejected" }).eq("id", userId);
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "verification",
      title: approve ? "You are a verified seller" : "Verification not approved",
      body: approve ? "You can now list animals for sale." : "Please review your details and submit again.",
      link: "/verification",
    });
    await log(approve ? "verification_approved" : "verification_rejected", id);
    await verifications.refetch();
    setBusy(null);
    toast.success(approve ? "Seller verified." : "Verification rejected.");
  }

  async function decideListing(id: string, sellerId: string, approve: boolean) {
    setBusy(id);
    await supabase
      .from("animal_listings")
      .update({
        status: approve ? "approved" : "rejected",
        reject_reason: approve ? null : "Listing did not meet our guidelines.",
      })
      .eq("id", id);
    await supabase.from("notifications").insert({
      user_id: sellerId,
      type: "listing",
      title: approve ? "Your listing is live" : "Listing needs changes",
      body: approve ? "Buyers can now see your animal." : "Please review the details and submit again.",
      link: "/my-listings",
    });
    await log(approve ? "listing_approved" : "listing_rejected", id);
    await listings.refetch();
    setBusy(null);
    toast.success(approve ? "Listing approved." : "Listing rejected.");
  }

  async function resolveReport(id: string) {
    setBusy(id);
    await supabase.from("reports").update({ status: "resolved" }).eq("id", id);
    await log("report_resolved", id);
    await reports.refetch();
    setBusy(null);
    toast.success("Report closed.");
  }

  return (
    <AppShell title="Admin panel" showBrandHeader={false} showBack>
      <Tabs defaultValue="sellers">
        <TabsList className="w-full rounded-full">
          <TabsTrigger value="sellers" className="flex-1 rounded-full">
            Sellers {verifications.data?.length ? `(${verifications.data.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="listings" className="flex-1 rounded-full">
            Listings {listings.data?.length ? `(${listings.data.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex-1 rounded-full">
            Reports {reports.data?.length ? `(${reports.data.length})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sellers" className="mt-4">
          {verifications.isLoading ? (
            <RowSkeleton count={2} />
          ) : verifications.data?.length ? (
            <motion.ul variants={staggerList} initial="hidden" animate="show" className="space-y-3">
              {verifications.data.map((v) => {
                const p = v.profiles as { full_name?: string; phone?: string; city?: string; district?: string } | null;
                return (
                  <motion.li key={v.id} variants={fadeUp} className="rounded-3xl bg-card p-4 card-shadow">
                    <p className="font-display font-bold">{v.farm_name ?? p?.full_name ?? "Seller"}</p>
                    <p className="text-xs text-muted-foreground">
                      {p?.full_name} • {p?.phone} • {[p?.city, p?.district].filter(Boolean).join(", ")}
                    </p>
                    <p className="mt-2 text-sm text-foreground/85">{v.farm_details}</p>
                    {v.experience && <p className="mt-1 text-xs text-muted-foreground">Experience: {v.experience}</p>}
                    {(v.farm_photo_paths ?? []).length > 0 && (
                      <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                        {(v.farm_photo_paths ?? []).map((path: string) => (
                          <div key={path} className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
                            <SafeImage bucket="verification-docs" path={path} alt="Farm photo" className="h-full w-full" />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 rounded-full"
                        disabled={busy === v.id}
                        onClick={() => decideVerification(v.id, v.user_id, true)}
                      >
                        <BadgeCheck className="mr-1 h-4 w-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1 rounded-full"
                        disabled={busy === v.id}
                        onClick={() => decideVerification(v.id, v.user_id, false)}
                      >
                        Reject
                      </Button>
                    </div>
                  </motion.li>
                );
              })}
            </motion.ul>
          ) : (
            <EmptyState icon={<BadgeCheck className="h-7 w-7" />} title="No pending sellers" body="All caught up." />
          )}
        </TabsContent>

        <TabsContent value="listings" className="mt-4">
          {listings.isLoading ? (
            <RowSkeleton count={2} />
          ) : listings.data?.length ? (
            <motion.ul variants={staggerList} initial="hidden" animate="show" className="space-y-3">
              {listings.data.map((l) => {
                const images = (l.animal_images ?? []) as { id: string; path: string }[];
                const seller = l.seller as { full_name?: string; phone?: string } | null;
                return (
                  <motion.li key={l.id} variants={fadeUp} className="rounded-3xl bg-card p-4 card-shadow">
                    <div className="flex gap-3">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
                        <SafeImage path={images[0]?.path} alt={l.title} className="h-full w-full" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display font-bold">{l.title}</p>
                        <p className="text-sm font-bold text-primary">{formatINR(Number(l.price))}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {seller?.full_name} • {seller?.phone}
                        </p>
                        <p className="text-xs text-muted-foreground">{timeAgo(l.created_at)}</p>
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm text-foreground/85">{l.description}</p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 rounded-full"
                        disabled={busy === l.id}
                        onClick={() => decideListing(l.id, l.seller_id, true)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1 rounded-full"
                        disabled={busy === l.id}
                        onClick={() => decideListing(l.id, l.seller_id, false)}
                      >
                        Reject
                      </Button>
                    </div>
                  </motion.li>
                );
              })}
            </motion.ul>
          ) : (
            <EmptyState icon={<Tag className="h-7 w-7" />} title="No listings waiting" body="Nothing to review." />
          )}
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          {reports.isLoading ? (
            <RowSkeleton count={2} />
          ) : reports.data?.length ? (
            <ul className="space-y-3">
              {reports.data.map((r) => (
                <li key={r.id} className="rounded-3xl bg-card p-4 card-shadow">
                  <p className="text-sm font-semibold">{r.reason}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{timeAgo(r.created_at)}</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-3 rounded-full"
                    disabled={busy === r.id}
                    onClick={() => resolveReport(r.id)}
                  >
                    Mark resolved
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={<Flag className="h-7 w-7" />} title="No open reports" body="The marketplace looks healthy." />
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
