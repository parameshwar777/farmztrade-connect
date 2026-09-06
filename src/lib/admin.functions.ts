import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Removing a person's account needs privileged access, so it runs on the
 * server and only after the caller is confirmed to be an admin.
 */
export const deleteUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; reason?: string }) => {
    if (!input?.userId) throw new Error("A user is required.");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId: callerId } = context;
    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: callerId,
      _role: "admin",
    });
    if (roleError) throw new Error("Could not confirm admin rights.");
    if (!isAdmin) throw new Error("Forbidden");
    if (data.userId === callerId) throw new Error("You cannot remove your own account.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin
      .from("animal_listings")
      .update({ status: "suspended", reject_reason: data.reason ?? "Account removed by moderation." })
      .eq("seller_id", data.userId);

    await supabaseAdmin.from("admin_actions").insert({
      admin_id: callerId,
      action: "user_deleted",
      target_table: "profiles",
      target_id: data.userId,
      note: data.reason ?? null,
    });

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });
