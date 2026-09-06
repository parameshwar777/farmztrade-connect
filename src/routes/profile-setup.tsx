import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { RequireAuth } from "@/components/auth-gate";
import { BrandLockup } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile-setup")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Complete your profile — FARMZTRADE" },
      { name: "description", content: "Tell us your name and location so buyers and sellers near you can find you." },
      { property: "og:title", content: "Complete your profile — FARMZTRADE" },
      { property: "og:description", content: "Set up your FARMZTRADE account in under a minute." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <ProfileSetup />
    </RequireAuth>
  ),
});

const INTENTS = [
  { value: "buyer", label: "I want to buy", body: "Browse animals and feed" },
  { value: "seller", label: "I want to sell", body: "List your animals" },
  { value: "both", label: "Both", body: "Buy and sell" },
] as const;

function ProfileSetup() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    village: "",
    city: "",
    district: "",
    state: "Andhra Pradesh",
    pincode: "",
    bio: "",
    intent: "both" as (typeof INTENTS)[number]["value"],
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm((f) => ({
      ...f,
      full_name: profile.full_name ?? "",
      village: profile.village ?? "",
      city: profile.city ?? "",
      district: profile.district ?? "",
      state: profile.state ?? "Andhra Pradesh",
      pincode: profile.pincode ?? "",
      bio: profile.bio ?? "",
      intent: profile.intent,
    }));
  }, [profile]);

  async function save() {
    if (form.full_name.trim().length < 3) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!form.district.trim() || !form.city.trim()) {
      toast.error("Please add your district and city or town.");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name.trim(),
        village: form.village.trim() || null,
        city: form.city.trim(),
        district: form.district.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim() || null,
        bio: form.bio.trim() || null,
        intent: form.intent,
        profile_complete: true,
      })
      .eq("id", user!.id);
    setBusy(false);
    if (error) {
      toast.error("Could not save your profile. Please try again.");
      return;
    }
    await refreshProfile();
    toast.success("Profile saved.");
    navigate({ to: "/home", replace: true });
  }

  return (
    <div className="min-h-screen bg-background px-6 py-8 safe-top safe-bottom">
      <BrandLockup />
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-8 max-w-md">
        <h1 className="font-display text-2xl font-extrabold">Tell us about you</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Buyers and sellers see your name and area. Your mobile number stays hidden until you choose to share it.
        </p>

        <div className="mt-7 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              className="h-12 rounded-2xl"
              placeholder="Ramesh Reddy"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>What brings you here?</Label>
            <div className="grid gap-2">
              {INTENTS.map((i) => (
                <button
                  key={i.value}
                  type="button"
                  onClick={() => setForm({ ...form, intent: i.value })}
                  className={cn(
                    "flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors",
                    form.intent === i.value ? "border-primary bg-primary-soft" : "border-border bg-card",
                  )}
                >
                  <span>
                    <span className="block text-sm font-semibold">{i.label}</span>
                    <span className="block text-xs text-muted-foreground">{i.body}</span>
                  </span>
                  <span
                    className={cn(
                      "h-4 w-4 rounded-full border-2",
                      form.intent === i.value ? "border-primary bg-primary" : "border-border",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="village">Village</Label>
              <Input
                id="village"
                className="h-12 rounded-2xl"
                placeholder="Optional"
                value={form.village}
                onChange={(e) => setForm({ ...form, village: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City / Town</Label>
              <Input
                id="city"
                className="h-12 rounded-2xl"
                placeholder="Guntur"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="district">District</Label>
              <Input
                id="district"
                className="h-12 rounded-2xl"
                placeholder="Guntur"
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                className="h-12 rounded-2xl"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin">PIN code</Label>
            <Input
              id="pin"
              inputMode="numeric"
              maxLength={6}
              className="h-12 rounded-2xl"
              placeholder="522001"
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">About your farm (optional)</Label>
            <Textarea
              id="bio"
              rows={3}
              maxLength={300}
              className="rounded-2xl"
              placeholder="We raise Murrah buffaloes and Boer goats."
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>

          <Button onClick={save} disabled={busy} className="h-13 w-full rounded-full text-base">
            {busy ? "Saving…" : "Save & Continue"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
