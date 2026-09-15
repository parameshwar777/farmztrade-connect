import { supabase } from "@/integrations/supabase/client";

/**
 * Remove an account and suspend their listings (Admin action).
 */
export async function deleteUserAccount(input: { userId: string; reason?: string }) {
  if (!input?.userId) throw new Error("A user is required.");

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Unauthorized");

  // Suspend listings
  await supabase
    .from("animal_listings")
    .update({ status: "suspended", reject_reason: input.reason ?? "Account removed by moderation." })
    .eq("seller_id", input.userId);

  // Record admin action
  await supabase.from("admin_actions").insert({
    admin_id: session.user.id,
    action: "user_deleted",
    target_table: "profiles",
    target_id: input.userId,
    note: input.reason ?? null,
  });

  return { ok: true };
}
