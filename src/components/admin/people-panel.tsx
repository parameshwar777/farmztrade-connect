import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, ShieldMinus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { logAdminAction, notify } from "@/components/admin/shared";
import { EmptyState, RowSkeleton } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { deleteUserAccount } from "@/lib/admin.functions";

/** Grant or remove admin rights and remove abusive accounts. */
export function PeoplePanel({ adminId }: { adminId: string }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const removeAccount = useServerFn(deleteUserAccount);

  const people = useQuery({
    queryKey: ["admin-people", q],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("id, full_name, phone, city, district, verification")
        .order("created_at", { ascending: false })
        .limit(60);
      if (q.trim()) query = query.or(`full_name.ilike.%${q.trim()}%,phone.ilike.%${q.trim()}%`);
      const { data, error } = await query;
      if (error) throw error;
      const { data: roles } = await supabase.from("user_roles").select("user_id, role").eq("role", "admin");
      const adminIds = new Set((roles ?? []).map((r) => r.user_id));
      return (data ?? []).map((p) => ({ ...p, isAdmin: adminIds.has(p.id) }));
    },
  });

  async function setAdmin(userId: string, name: string, on: boolean) {
    setBusy(userId);
    const res = on
      ? await supabase.from("user_roles").insert({ user_id: userId, role: "admin" })
      : await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
    setBusy(null);
    if (res.error) return void toast.error("Could not change admin rights.");
    await logAdminAction(adminId, on ? "admin_granted" : "admin_revoked", {
      table: "user_roles",
      targetId: userId,
      note: name,
    });
    if (on) {
      await notify(userId, "admin", "You are now an admin", "You can open the admin panel from your profile.", "/admin");
    }
    await people.refetch();
    toast.success(on ? `${name} is now an admin.` : `Admin rights removed from ${name}.`);
    return undefined;
  }

  async function remove(userId: string, name: string) {
    if (!window.confirm(`Remove ${name}? Their account and listings will be taken down.`)) return;
    setBusy(userId);
    try {
      await removeAccount({ data: { userId, reason: "Removed by admin" } });
      toast.success(`${name} removed.`);
      await people.refetch();
    } catch {
      toast.error("Could not remove this account.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <Input
        className="h-12 rounded-2xl"
        placeholder="Search by name or phone"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {people.isLoading ? (
        <RowSkeleton count={3} />
      ) : people.data?.length ? (
        <ul className="space-y-3">
          {people.data.map((p) => (
            <li key={p.id} className="rounded-3xl bg-card p-4 card-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-display font-bold">{p.full_name || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground">
                    {[p.phone, p.city, p.district].filter(Boolean).join(" • ")}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {p.isAdmin && <Badge className="rounded-full">Admin</Badge>}
                  <Badge variant="secondary" className="rounded-full capitalize">
                    {p.verification}
                  </Badge>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant={p.isAdmin ? "secondary" : "default"}
                  className="flex-1 rounded-full"
                  disabled={busy === p.id || p.id === adminId}
                  onClick={() => setAdmin(p.id, p.full_name || "This user", !p.isAdmin)}
                >
                  {p.isAdmin ? (
                    <>
                      <ShieldMinus className="mr-1 h-4 w-4" /> Remove admin
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-1 h-4 w-4" /> Make admin
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full"
                  disabled={busy === p.id || p.id === adminId}
                  onClick={() => remove(p.id, p.full_name || "This user")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={<Users className="h-7 w-7" />} title="No users found" body="Try a different name or phone." />
      )}
    </div>
  );
}
