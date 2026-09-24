import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MapPin, Navigation, Phone, Search, Stethoscope, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell, TrustNote } from "@/components/app-shell";
import { SignInPrompt, useAuthAction } from "@/components/auth-gate";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { fetchDoctors, fetchMyDoctorProfile, saveDoctorProfile, type VetDoctor } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { shortPlace } from "@/lib/format";
import { staggerList } from "@/lib/motion";

export const Route = createFileRoute("/doctors")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Veterinary doctors near you — FARMZTRADE" },
      {
        name: "description",
        content:
          "Find veterinary doctors and animal hospitals near your village, city or district, and call them directly.",
      },
      { property: "og:title", content: "Veterinary doctors near you — FARMZTRADE" },
      { property: "og:description", content: "Nearby vets and animal hospitals with direct phone numbers." },
    ],
  }),
  component: DoctorsPage,
});

function DoctorsPage() {
  const { user, profile } = useAuth();
  const { guard, prompt, setPrompt } = useAuthAction();
  const queryClient = useQueryClient();

  const [text, setText] = useState("");
  const [debounced, setDebounced] = useState("");
  const [onlyNearby, setOnlyNearby] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(text.trim()), 350);
    return () => window.clearTimeout(id);
  }, [text]);

  const filters = useMemo(
    () => ({
      q: debounced || undefined,
      district: onlyNearby && profile?.district ? profile.district : undefined,
    }),
    [debounced, onlyNearby, profile?.district],
  );

  const doctors = useQuery({
    queryKey: ["doctors", filters],
    queryFn: () => fetchDoctors(filters),
    staleTime: 30_000,
  });

  const mine = useQuery({
    queryKey: ["my-doctor-profile", user?.id],
    queryFn: () => fetchMyDoctorProfile(user!.id),
    enabled: Boolean(user),
  });

  // Live updates: any insert/update from the database shows up immediately.
  useEffect(() => {
    const channel = supabase
      .channel("vet-doctors-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "vet_doctors" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["doctors"] });
        void queryClient.invalidateQueries({ queryKey: ["my-doctor-profile"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <AppShell title="Veterinary Doctors" showBrandHeader={false}>
      <SignInPrompt open={prompt} onOpenChange={setPrompt} />

      <section className="rounded-4xl soft-gradient p-5 card-shadow">
        <div className="flex items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-card text-primary">
            <Stethoscope className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-lg font-extrabold text-primary-deep">Find a vet near you</h1>
            <p className="mt-1 text-sm text-primary-deep/80">
              Veterinary doctors and animal hospitals listed by area. Call them directly for treatment and advice.
            </p>
            <Button
              size="sm"
              className="mt-3 rounded-full"
              onClick={() => guard(() => setOpen(true))}
            >
              {mine.data ? "Edit my doctor details" : "I am a vet — register"}
            </Button>
          </div>
        </div>
      </section>

      <div className="sticky top-[68px] z-20 -mx-4 mt-4 bg-background/95 px-4 pb-3 pt-1 backdrop-blur">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search doctor, hospital, city or district…"
            className="h-11 rounded-full border-border bg-card pl-11 pr-10"
          />
          {text && (
            <button
              aria-label="Clear search"
              onClick={() => setText("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {Boolean(profile?.district) && (
          <div className="mt-2 flex gap-2">
            <FilterChip active={onlyNearby} onClick={() => setOnlyNearby(true)}>
              Near me — {profile?.district}
            </FilterChip>
            <FilterChip active={!onlyNearby} onClick={() => setOnlyNearby(false)}>
              All areas
            </FilterChip>
          </div>
        )}
      </div>

      {doctors.isError ? (
        <ErrorState onRetry={() => void doctors.refetch()} />
      ) : doctors.isLoading ? (
        <CardGridSkeleton count={4} className="grid-cols-1 lg:grid-cols-2" />
      ) : doctors.data?.length ? (
        <motion.div
          variants={staggerList}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-3 lg:grid-cols-2"
        >
          {doctors.data.map((d) => (
            <DoctorCard key={d.id} doctor={d} />
          ))}
        </motion.div>
      ) : (
        <EmptyState
          title="No doctors listed here yet"
          body="Try searching another city, or show all areas."
          action={
            onlyNearby && profile?.district ? (
              <Button variant="secondary" className="rounded-full" onClick={() => setOnlyNearby(false)}>
                Show all areas
              </Button>
            ) : undefined
          }
        />
      )}

      <TrustNote />

      <DoctorFormDialog
        open={open}
        onOpenChange={setOpen}
        existing={mine.data ?? null}
        onSaved={() => {
          void doctors.refetch();
          void mine.refetch();
        }}
      />
    </AppShell>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? "shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
          : "shrink-0 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-deep"
      }
    >
      {children}
    </button>
  );
}

function DoctorCard({ doctor }: { doctor: VetDoctor }) {
  const place = shortPlace([doctor.village, doctor.city, doctor.district, doctor.state]);
  return (
    <article className="rounded-3xl bg-card p-4 card-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-display text-base font-extrabold">{doctor.full_name}</h2>
          {doctor.hospital_name && <p className="truncate text-sm text-muted-foreground">{doctor.hospital_name}</p>}
          {doctor.specialization && (
            <span className="mt-2 inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-deep">
              {doctor.specialization}
            </span>
          )}
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary-deep">
          <Stethoscope className="h-5 w-5" />
        </span>
      </div>

      {(place || doctor.address_line) && (
        <p className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0">{[doctor.address_line, place].filter(Boolean).join(", ")}</span>
        </p>
      )}
      {doctor.available_hours && <p className="mt-1 text-xs text-muted-foreground">Timings: {doctor.available_hours}</p>}
      {doctor.about && <p className="mt-2 line-clamp-2 text-sm">{doctor.about}</p>}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button asChild className="rounded-full">
          <a href={directionsUrl(doctor)} target="_blank" rel="noopener noreferrer">
            <Navigation className="mr-1.5 h-4 w-4" /> Directions
          </a>
        </Button>
        <Button asChild variant="secondary" className="rounded-full">
          <a href={`tel:${doctor.phone}`}>
            <Phone className="mr-1.5 h-4 w-4" /> Call
          </a>
        </Button>
      </div>
    </article>
  );
}

function DoctorFormDialog({
  open,
  onOpenChange,
  existing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existing: VetDoctor | null;
  onSaved: () => void;
}) {
  const { user, profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    hospital_name: "",
    specialization: "",
    available_hours: "",
    address_line: "",
    village: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
    about: "",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      full_name: existing?.full_name ?? profile?.full_name ?? "",
      phone: existing?.phone ?? profile?.phone ?? "",
      hospital_name: existing?.hospital_name ?? "",
      specialization: existing?.specialization ?? "",
      available_hours: existing?.available_hours ?? "",
      address_line: existing?.address_line ?? "",
      village: existing?.village ?? profile?.village ?? "",
      city: existing?.city ?? profile?.city ?? "",
      district: existing?.district ?? profile?.district ?? "",
      state: existing?.state ?? profile?.state ?? "",
      pincode: existing?.pincode ?? profile?.pincode ?? "",
      about: existing?.about ?? "",
    });
    setCoords(
      existing?.latitude != null && existing?.longitude != null
        ? { lat: Number(existing.latitude), lng: Number(existing.longitude) }
        : null,
    );
  }, [open, existing, profile]);

  function captureLocation() {
    if (!navigator.geolocation) return void toast.error("Location is not available on this device.");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
        toast.success("Clinic location saved.");
      },
      () => toast.error("Please allow location access and try again."),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    if (!user) return;
    if (!form.full_name.trim() || !form.phone.trim()) {
      toast.error("Please add your name and phone number.");
      return;
    }
    if (!form.city.trim() && !form.district.trim()) {
      toast.error("Please add your city or district so farmers can find you.");
      return;
    }
    setSaving(true);
    try {
      await saveDoctorProfile(
        user.id,
        {
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          hospital_name: form.hospital_name.trim() || null,
          specialization: form.specialization.trim() || null,
          available_hours: form.available_hours.trim() || null,
          address_line: form.address_line.trim() || null,
          village: form.village.trim() || null,
          city: form.city.trim() || null,
          district: form.district.trim() || null,
          state: form.state.trim() || null,
          pincode: form.pincode.trim() || null,
          latitude: coords?.lat ?? null,
          longitude: coords?.lng ?? null,
          about: form.about.trim() || null,
        },
        existing?.id,
      );
      toast.success(existing ? "Your details are updated." : "You are listed. Farmers nearby can now reach you.");
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("Could not save your details. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit your doctor details" : "Register as a veterinary doctor"}</DialogTitle>
          <DialogDescription>
            Farmers in your area will see your name, clinic and phone number so they can call you.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <Field label="Doctor name" value={form.full_name} onChange={(v) => set("full_name", v)} />
          <Field label="Phone number" value={form.phone} onChange={(v) => set("phone", v)} />
          <Field
            label="Hospital / clinic name"
            value={form.hospital_name}
            onChange={(v) => set("hospital_name", v)}
          />
          <Field
            label="Specialization"
            placeholder="Cattle, poultry, pets…"
            value={form.specialization}
            onChange={(v) => set("specialization", v)}
          />
          <Field
            label="Timings"
            placeholder="9 AM – 7 PM"
            value={form.available_hours}
            onChange={(v) => set("available_hours", v)}
          />
          <Field label="Address" value={form.address_line} onChange={(v) => set("address_line", v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Village" value={form.village} onChange={(v) => set("village", v)} />
            <Field label="City" value={form.city} onChange={(v) => set("city", v)} />
            <Field label="District" value={form.district} onChange={(v) => set("district", v)} />
            <Field label="State" value={form.state} onChange={(v) => set("state", v)} />
          </div>
          <Field label="Pincode" value={form.pincode} onChange={(v) => set("pincode", v)} />
          <Button type="button" variant="secondary" className="rounded-full" onClick={captureLocation}>
            <MapPin className="mr-1.5 h-4 w-4" />
            {coords ? "Clinic location saved — tap to update" : "Use my current location for directions"}
          </Button>
          <div className="grid gap-1.5">
            <Label htmlFor="doctor-about">About</Label>
            <Textarea
              id="doctor-about"
              value={form.about}
              onChange={(e) => set("about", e.target.value)}
              placeholder="Experience, services offered, home visits…"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" className="rounded-full" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="rounded-full" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Save details"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const id = `doctor-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
