import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { idDocLabel, logAdminAction, notify } from "@/components/admin/shared";
import { SafeImage } from "@/components/media";
import { EmptyState, RowSkeleton } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { timeAgo } from "@/lib/format";

/** Seller verification queue: government ID + farm proof before selling. */
export function SellersPanel({ adminId }: { adminId: string }) {
  const [view, setView] = useState<"pending" | "decided">("pending");
  const [busy, setBusy] = useState<string | null>(null);

  const rows = useQuery({
    queryKey: ["admin-verifications", view],
    queryFn: async () => {
      let query = supabase
        .from("user_verifications")
        .select("*, profiles:user_id(full_name, phone, city, district, verification)")
        .order("created_at", { ascending: false })
        .limit(60);
      query = view === "pending" ? query.eq("status", "pending") : query.neq("status", "pending");
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  async function decide(id: string, userId: string, approve: boolean) {
    setBusy(id);
    await supabase
      .from("user_verifications")
      .update({
        status: approve ? "approved" : "rejected",
        admin_note: approve ? null : "Your government ID or farm details could not be confirmed.",
      })
      .eq("id", id);
    await supabase.from("profiles").update({ verification: approve ? "approved" : "rejected" }).eq("id", userId);
    await notify(
      userId,
      "verification",
      approve ? "You are a verified seller" : "Verification not approved",
      approve
        ? "You can now list animals for sale on FARMZTRADE."
        : "Please upload a clear government ID and submit again.",
      "/verification",
    );
    await logAdminAction(adminId, approve ? "verification_approved" : "verification_rejected", {
      table: "user_verifications",
      targetId: id,
    });
    await rows.refetch();
    setBusy(null);
    toast.success(approve ? "Seller verified." : "Verification rejected.");
  }

  return (
    <Tabs value={view} onValueChange={(v) => setView(v as "pending" | "decided")}>
      <TabsList className="w-full rounded-full">
        <TabsTrigger value="pending" className="flex-1 rounded-full">
          Waiting
        </TabsTrigger>
        <TabsTrigger value="decided" className="flex-1 rounded-full">
          Decided
        </TabsTrigger>
      </TabsList>

      <TabsContent value={view} className="mt-4">
        {rows.isLoading ? (
          <RowSkeleton count={2} />
        ) : rows.data?.length ? (
          <ul className="space-y-3">
            {rows.data.map((v) => {
              const p = v.profiles as
                | { full_name?: string; phone?: string; city?: string; district?: string }
                | null;
              return (
                <li key={v.id} className="rounded-3xl bg-card p-4 card-shadow">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-display font-bold">{v.farm_name ?? p?.full_name ?? "Seller"}</p>
                      <p className="text-xs text-muted-foreground">
                        {[p?.full_name, p?.phone, [p?.city, p?.district].filter(Boolean).join(", ")]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    </div>
                    <Badge variant="secondary" className="rounded-full capitalize">
                      {v.status}
                    </Badge>
                  </div>

                  <p className="mt-2 text-sm text-foreground/85">{v.farm_details}</p>
                  {v.experience && <p className="mt-1 text-xs text-muted-foreground">Experience: {v.experience}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">Submitted {timeAgo(v.created_at)}</p>

                  <div className="mt-3 rounded-2xl bg-secondary p-3">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <FileText className="h-4 w-4 text-primary" /> {idDocLabel(v.id_doc_type)}
                    </p>
                    {v.id_doc_path ? (
                      <div className="mt-2 h-40 w-full overflow-hidden rounded-2xl">
                        <SafeImage
                          bucket="verification-docs"
                          path={v.id_doc_path}
                          alt="Government ID"
                          className="h-full w-full object-contain"
                        />
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-destructive">No ID uploaded — reject this request.</p>
                    )}
                  </div>

                  {(v.farm_photo_paths ?? []).length > 0 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                      {(v.farm_photo_paths ?? []).map((path: string) => (
                        <div key={path} className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
                          <SafeImage bucket="verification-docs" path={path} alt="Farm photo" className="h-full w-full" />
                        </div>
                      ))}
                    </div>
                  )}

                  {v.status === "pending" && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 rounded-full"
                        disabled={busy === v.id}
                        onClick={() => decide(v.id, v.user_id, true)}
                      >
                        <BadgeCheck className="mr-1 h-4 w-4" /> Approve seller
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1 rounded-full"
                        disabled={busy === v.id}
                        onClick={() => decide(v.id, v.user_id, false)}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                  {v.status !== "pending" && v.admin_note && (
                    <p className="mt-2 text-xs text-muted-foreground">Note: {v.admin_note}</p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon={<BadgeCheck className="h-7 w-7" />}
            title={view === "pending" ? "No sellers waiting" : "Nothing decided yet"}
            body={view === "pending" ? "All caught up." : "Approved and rejected sellers show here."}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
