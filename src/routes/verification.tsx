import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BadgeCheck, Clock, FileText, ShieldCheck, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/auth-gate";
import { ID_DOC_TYPES } from "@/components/admin/shared";
import { ImageUploader } from "@/components/image-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fadeUp } from "@/lib/motion";
import { uploadFile, validateImage } from "@/lib/storage";

export const Route = createFileRoute("/verification")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Seller verification — FARMZTRADE" },
      {
        name: "description",
        content: "Submit your farm details and ID proof to become a verified FARMZTRADE seller.",
      },
      { property: "og:title", content: "Seller verification — FARMZTRADE" },
      { property: "og:description", content: "Verified sellers build a trusted livestock marketplace." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Verification />
    </RequireAuth>
  ),
});

function Verification() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [farmPhotos, setFarmPhotos] = useState<string[]>([]);
  const [idDoc, setIdDoc] = useState<string | null>(null);
  const [idDocType, setIdDocType] = useState<string>("aadhaar");
  const [form, setForm] = useState({ farm_name: "", farm_details: "", experience: "" });

  const existing = useQuery({
    queryKey: ["verification", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_verifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: Boolean(user),
  });

  const status = existing.data?.status;

  async function uploadIdDoc(file: File) {
    const problem = validateImage(file);
    if (problem) return void toast.error(problem);
    setBusy(true);
    try {
      const path = await uploadFile("verification-docs", user!.id, file);
      setIdDoc(path);
      toast.success("ID proof uploaded.");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
    return undefined;
  }

  async function submit() {
    if (!user) return undefined;
    if (form.farm_name.trim().length < 3) return void toast.error("Enter your farm or business name.");
    if (form.farm_details.trim().length < 20) return void toast.error("Tell us a little more about your farm.");
    if (!idDocType) return void toast.error("Choose which government ID you are uploading.");
    if (!idDoc) return void toast.error("Upload a photo of your government ID.");
    if (farmPhotos.length < 1) return void toast.error("Add at least one farm photo.");

    setBusy(true);
    const { error } = await supabase.from("user_verifications").insert({
      user_id: user.id,
      farm_name: form.farm_name.trim(),
      farm_details: form.farm_details.trim(),
      experience: form.experience.trim() || null,
      id_doc_path: idDoc,
      id_doc_type: idDocType,
      farm_photo_paths: farmPhotos,
      status: "pending",
    });
    setBusy(false);

    if (error) {
      toast.error("Could not submit. Please try again.");
      return undefined;
    }
    await refreshProfile();
    await existing.refetch();
    toast.success("Submitted. We will review your details soon.");
    navigate({ to: "/profile" });
    return undefined;
  }

  if (status === "pending" || status === "approved" || status === "rejected") {
    const map = {
      pending: {
        icon: <Clock className="h-8 w-8 text-gold" />,
        title: "Verification in review",
        body: "Our team is checking your details. You will be notified once it is approved.",
      },
      approved: {
        icon: <BadgeCheck className="h-8 w-8 text-primary" />,
        title: "You are a verified seller",
        body: "You can now list animals for sale on FARMZTRADE.",
      },
      rejected: {
        icon: <XCircle className="h-8 w-8 text-destructive" />,
        title: "Verification not approved",
        body: existing.data?.admin_note ?? "Some details could not be confirmed. You can submit again.",
      },
    }[status];

    return (
      <AppShell title="Seller verification" showBrandHeader={false} showBack>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="rounded-4xl bg-card p-6 text-center card-shadow"
        >
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary-soft">{map.icon}</div>
          <h1 className="mt-4 font-display text-xl font-extrabold">{map.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{map.body}</p>
          {status === "rejected" && (
            <Button
              className="mt-5 h-12 w-full rounded-full"
              onClick={async () => {
                await supabase.from("user_verifications").delete().eq("id", existing.data!.id);
                await existing.refetch();
              }}
            >
              Submit again
            </Button>
          )}
        </motion.div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Seller verification" showBrandHeader={false} showBack>
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="space-y-5">
        <section className="rounded-4xl soft-gradient p-5">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <h1 className="mt-2 font-display text-lg font-extrabold text-primary-deep">Why we verify sellers</h1>
          <p className="mt-1 text-sm text-primary-deep/80">
            Buyers trust FARMZTRADE because every seller is checked by our team. Your documents are stored privately and
            are never shown to other users.
          </p>
        </section>

        <section className="rounded-3xl bg-card p-5 card-shadow">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fname">Farm / business name</Label>
              <Input
                id="fname"
                className="h-12 rounded-2xl"
                value={form.farm_name}
                onChange={(e) => setForm({ ...form, farm_name: e.target.value })}
                placeholder="e.g. Sri Lakshmi Dairy Farm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fdetails">About your farm</Label>
              <Textarea
                id="fdetails"
                rows={4}
                className="rounded-2xl"
                value={form.farm_details}
                onChange={(e) => setForm({ ...form, farm_details: e.target.value })}
                placeholder="Animals you keep, breeds, village and how long you have been farming."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fexp">Years of experience (optional)</Label>
              <Input
                id="fexp"
                className="h-12 rounded-2xl"
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
                placeholder="e.g. 8 years"
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-card p-5 card-shadow">
          <h2 className="font-display text-base font-bold">Government ID proof</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Aadhaar, PAN, voter ID or driving licence. Kept private for verification only.
          </p>
          <div className="mt-3 space-y-2">
            <Label>Which ID are you uploading?</Label>
            <Select value={idDocType} onValueChange={setIdDocType}>
              <SelectTrigger className="h-12 rounded-2xl">
                <SelectValue placeholder="Choose ID type" />
              </SelectTrigger>
              <SelectContent>
                {ID_DOC_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="mt-3 flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-border px-4 py-3">
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold">{idDoc ? "ID proof added" : "Take photo or choose file"}</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadIdDoc(file);
                e.target.value = "";
              }}
            />
          </label>
        </section>

        <section className="rounded-3xl bg-card p-5 card-shadow">
          <h2 className="font-display text-base font-bold">Farm photos</h2>
          <p className="mt-1 text-sm text-muted-foreground">One or two photos of your farm or animals.</p>
          <div className="mt-3">
            <ImageUploader
              userId={user!.id}
              bucket="verification-docs"
              paths={farmPhotos}
              onChange={setFarmPhotos}
              max={4}
              min={1}
            />
          </div>
        </section>

        <Button onClick={submit} disabled={busy} className="h-13 w-full rounded-full text-base">
          {busy ? "Submitting…" : "Submit for verification"}
        </Button>
      </motion.div>
    </AppShell>
  );
}
