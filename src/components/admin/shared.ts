import { supabase } from "@/integrations/supabase/client";

/** Every moderation decision is written to the audit trail. */
export async function logAdminAction(
  adminId: string,
  action: string,
  opts?: { table?: string; targetId?: string; note?: string },
) {
  await supabase.from("admin_actions").insert({
    admin_id: adminId,
    action,
    target_table: opts?.table ?? null,
    target_id: opts?.targetId ?? null,
    note: opts?.note ?? null,
  });
}

export async function notify(userId: string, type: string, title: string, body: string, link?: string) {
  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body,
    link: link ?? null,
  });
}

export const ID_DOC_TYPES = [
  { value: "aadhaar", label: "Aadhaar card" },
  { value: "pan", label: "PAN card" },
  { value: "driving_licence", label: "Driving licence" },
  { value: "voter_id", label: "Voter ID" },
];

export function idDocLabel(value?: string | null) {
  return ID_DOC_TYPES.find((t) => t.value === value)?.label ?? "Government ID";
}
