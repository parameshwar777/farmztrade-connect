import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell, TrustNote } from "@/components/app-shell";
import { RequireAuth } from "@/components/auth-gate";
import { ImageUploader } from "@/components/image-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { fetchCategories } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sell")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sell an animal — FARMZTRADE" },
      {
        name: "description",
        content: "List cattle, goats, sheep, poultry or pets with photos, health details and your asking price.",
      },
      { property: "og:title", content: "Sell an animal — FARMZTRADE" },
      { property: "og:description", content: "Reach genuine buyers near you in a few simple steps." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Sell />
    </RequireAuth>
  ),
});

const STEPS = ["Category", "Details", "Photos", "Price", "Location", "Review"];

type Draft = {
  category_slug: string;
  title: string;
  breed: string;
  age_months: string;
  weight_kg: string;
  gender: string;
  milk_yield: string;
  pregnant: boolean;
  vaccinated: boolean;
  vaccination_note: string;
  health: string;
  description: string;
  price: string;
  negotiable: boolean;
  village: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  photos: string[];
};

function Sell() {
  const { user, profile, isVerified } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    category_slug: "",
    title: "",
    breed: "",
    age_months: "",
    weight_kg: "",
    gender: "Female",
    milk_yield: "",
    pregnant: false,
    vaccinated: true,
    vaccination_note: "",
    health: "Healthy",
    description: "",
    price: "",
    negotiable: true,
    village: profile?.village ?? "",
    city: profile?.city ?? "",
    district: profile?.district ?? "",
    state: profile?.state ?? "Andhra Pradesh",
    pincode: profile?.pincode ?? "",
    photos: [],
  });

  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories, staleTime: 300_000 });

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  if (!isVerified) {
    return (
      <AppShell title="Sell an animal" showBrandHeader={false}>
        <div className="mx-auto max-w-md rounded-4xl bg-card p-6 text-center card-shadow">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-gold/25 text-gold-foreground">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-display text-xl font-extrabold">Seller verification needed</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            FARMZTRADE checks every seller before listings go live, so buyers can trust what they see. Submit your details
            once and we'll notify you when you're approved.
          </p>
          <Button asChild className="mt-6 h-12 w-full rounded-full">
            <Link to="/verification">Start verification</Link>
          </Button>
        </div>
        <TrustNote />
      </AppShell>
    );
  }

  function canContinue() {
    if (step === 0) return Boolean(draft.category_slug);
    if (step === 1) return draft.title.trim().length >= 5 && Boolean(draft.age_months);
    if (step === 2) return draft.photos.length >= 3;
    if (step === 3) return Number(draft.price) > 0;
    if (step === 4) return Boolean(draft.district && draft.city);
    return true;
  }

  async function submit() {
    if (!user) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("animal_listings")
      .insert({
        seller_id: user.id,
        category_slug: draft.category_slug,
        title: draft.title.trim(),
        breed: draft.breed.trim() || null,
        age_months: Number(draft.age_months) || null,
        weight_kg: draft.weight_kg ? Number(draft.weight_kg) : null,
        gender: draft.gender,
        milk_yield: draft.milk_yield ? Number(draft.milk_yield) : null,
        pregnant: draft.gender === "Female" ? draft.pregnant : null,
        vaccinated: draft.vaccinated,
        vaccination_note: draft.vaccination_note.trim() || null,
        health: draft.health.trim() || null,
        description: draft.description.trim() || null,
        price: Number(draft.price),
        negotiable: draft.negotiable,
        village: draft.village.trim() || null,
        city: draft.city.trim(),
        district: draft.district.trim(),
        state: draft.state.trim(),
        pincode: draft.pincode.trim() || null,
        status: "pending",
      })
      .select()
      .single();

    if (error || !data) {
      setBusy(false);
      toast.error("Could not save your listing. Please try again.");
      return;
    }

    if (draft.photos.length) {
      await supabase
        .from("animal_images")
        .insert(draft.photos.map((url, i) => ({ listing_id: data.id, url, sort_order: i })));
    }

    setBusy(false);
    toast.success("Listing submitted for approval.");
    navigate({ to: "/my-listings" });
  }

  return (
    <AppShell title="Sell an animal" showBrandHeader={false}>
      <div className="mb-5 flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1">
            <div
              className={cn(
                "h-1.5 rounded-full transition-colors",
                i < step ? "bg-primary" : i === step ? "bg-gold" : "bg-border",
              )}
            />
          </div>
        ))}
      </div>
      <p className="mb-4 text-sm font-semibold text-muted-foreground">
        Step {step + 1} of {STEPS.length} — {STEPS[step]}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -28 }}
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
          className="space-y-5"
        >
          {step === 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(categories.data ?? []).map((c) => (
                <button
                  key={c.slug}
                  onClick={() => set("category_slug", c.slug)}
                  className={cn(
                    "rounded-3xl border-2 bg-card px-4 py-5 text-left transition-colors card-shadow",
                    draft.category_slug === c.slug ? "border-primary" : "border-transparent",
                  )}
                >
                  <span className="block text-sm font-bold">{c.name}</span>
                  <span className="block text-xs text-muted-foreground">{c.count} listed</span>
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <>
              <Field label="Listing title" htmlFor="title">
                <Input
                  id="title"
                  className="h-12 rounded-2xl"
                  placeholder="Murrah buffalo, 2nd lactation"
                  value={draft.title}
                  onChange={(e) => set("title", e.target.value)}
                />
              </Field>
              <Field label="Breed" htmlFor="breed">
                <Input
                  id="breed"
                  className="h-12 rounded-2xl"
                  placeholder="Murrah"
                  value={draft.breed}
                  onChange={(e) => set("breed", e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Age (months)" htmlFor="age">
                  <Input
                    id="age"
                    inputMode="numeric"
                    className="h-12 rounded-2xl"
                    value={draft.age_months}
                    onChange={(e) => set("age_months", e.target.value.replace(/\D/g, ""))}
                  />
                </Field>
                <Field label="Weight (kg)" htmlFor="weight">
                  <Input
                    id="weight"
                    inputMode="numeric"
                    className="h-12 rounded-2xl"
                    value={draft.weight_kg}
                    onChange={(e) => set("weight_kg", e.target.value.replace(/\D/g, ""))}
                  />
                </Field>
              </div>
              <Field label="Gender">
                <div className="flex gap-2">
                  {["Female", "Male"].map((g) => (
                    <Button
                      key={g}
                      type="button"
                      variant={draft.gender === g ? "default" : "secondary"}
                      className="h-11 flex-1 rounded-full"
                      onClick={() => set("gender", g)}
                    >
                      {g}
                    </Button>
                  ))}
                </div>
              </Field>
              {draft.gender === "Female" && (
                <>
                  <Field label="Milk yield (litres/day)" htmlFor="milk">
                    <Input
                      id="milk"
                      inputMode="decimal"
                      className="h-12 rounded-2xl"
                      placeholder="Optional"
                      value={draft.milk_yield}
                      onChange={(e) => set("milk_yield", e.target.value.replace(/[^\d.]/g, ""))}
                    />
                  </Field>
                  <Toggle label="Currently pregnant" checked={draft.pregnant} onChange={(v) => set("pregnant", v)} />
                </>
              )}
              <Toggle label="Vaccinated" checked={draft.vaccinated} onChange={(v) => set("vaccinated", v)} />
              {draft.vaccinated && (
                <Field label="Vaccination details" htmlFor="vaxnote">
                  <Input
                    id="vaxnote"
                    className="h-12 rounded-2xl"
                    placeholder="FMD + HS, June 2026"
                    value={draft.vaccination_note}
                    onChange={(e) => set("vaccination_note", e.target.value)}
                  />
                </Field>
              )}
              <Field label="Health notes" htmlFor="health">
                <Input
                  id="health"
                  className="h-12 rounded-2xl"
                  value={draft.health}
                  onChange={(e) => set("health", e.target.value)}
                />
              </Field>
              <Field label="Description" htmlFor="desc">
                <Textarea
                  id="desc"
                  rows={4}
                  maxLength={800}
                  className="rounded-2xl"
                  placeholder="Tell buyers about temperament, feeding and why you are selling."
                  value={draft.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </Field>
            </>
          )}

          {step === 2 && (
            <div>
              <p className="mb-3 text-sm text-muted-foreground">
                Add at least 3 clear photos — full body from the side, face, and legs. Good photos sell faster.
              </p>
              <ImageUploader userId={user!.id} paths={draft.photos} onChange={(p) => set("photos", p)} />
            </div>
          )}

          {step === 3 && (
            <>
              <Field label="Asking price (₹)" htmlFor="price">
                <Input
                  id="price"
                  inputMode="numeric"
                  className="h-13 rounded-2xl text-xl font-bold"
                  placeholder="85000"
                  value={draft.price}
                  onChange={(e) => set("price", e.target.value.replace(/\D/g, ""))}
                />
              </Field>
              {Number(draft.price) > 0 && (
                <p className="text-sm font-semibold text-primary">{formatINR(Number(draft.price))}</p>
              )}
              <Toggle label="Price is negotiable" checked={draft.negotiable} onChange={(v) => set("negotiable", v)} />
            </>
          )}

          {step === 4 && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Village" htmlFor="village">
                <Input
                  id="village"
                  className="h-12 rounded-2xl"
                  value={draft.village}
                  onChange={(e) => set("village", e.target.value)}
                />
              </Field>
              <Field label="City / Town" htmlFor="scity">
                <Input
                  id="scity"
                  className="h-12 rounded-2xl"
                  value={draft.city}
                  onChange={(e) => set("city", e.target.value)}
                />
              </Field>
              <Field label="District" htmlFor="sdistrict">
                <Input
                  id="sdistrict"
                  className="h-12 rounded-2xl"
                  value={draft.district}
                  onChange={(e) => set("district", e.target.value)}
                />
              </Field>
              <Field label="State" htmlFor="sstate">
                <Input
                  id="sstate"
                  className="h-12 rounded-2xl"
                  value={draft.state}
                  onChange={(e) => set("state", e.target.value)}
                />
              </Field>
              <Field label="PIN code" htmlFor="spin">
                <Input
                  id="spin"
                  inputMode="numeric"
                  maxLength={6}
                  className="h-12 rounded-2xl"
                  value={draft.pincode}
                  onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))}
                />
              </Field>
            </div>
          )}

          {step === 5 && (
            <div className="rounded-3xl bg-card p-5 card-shadow">
              <h2 className="font-display text-lg font-extrabold">{draft.title || "Your listing"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {draft.breed || draft.category_slug} • {draft.age_months} months • {draft.gender}
              </p>
              <p className="mt-3 font-display text-2xl font-extrabold text-primary">
                {formatINR(Number(draft.price))} {draft.negotiable && <span className="text-sm font-semibold">negotiable</span>}
              </p>
              <p className="mt-2 text-sm">
                {draft.village ? `${draft.village}, ` : ""}
                {draft.city}, {draft.district}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">{draft.photos.length} photos attached</p>
              <div className="mt-4 rounded-2xl bg-secondary px-4 py-3 text-xs leading-relaxed text-secondary-foreground">
                Your listing goes to the FARMZTRADE team for a quick check before it appears to buyers. You'll get a
                notification once it's live.
              </div>
              <Button onClick={submit} disabled={busy} className="mt-5 h-13 w-full rounded-full text-base">
                {busy ? "Submitting…" : "Submit for approval"}
                {!busy && <Check className="ml-1.5 h-5 w-5" />}
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {step < STEPS.length - 1 && (
        <div className="mt-7 flex gap-3">
          {step > 0 && (
            <Button variant="secondary" className="h-12 rounded-full px-5" onClick={() => setStep(step - 1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <Button className="h-12 flex-1 rounded-full" disabled={!canContinue()} onClick={() => setStep(step + 1)}>
            Continue
          </Button>
        </div>
      )}
      {step === STEPS.length - 1 && (
        <Button variant="secondary" className="mt-4 h-12 w-full rounded-full" onClick={() => setStep(step - 1)}>
          Back
        </Button>
      )}
    </AppShell>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-secondary px-4 py-3">
      <span className="text-sm font-medium">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
