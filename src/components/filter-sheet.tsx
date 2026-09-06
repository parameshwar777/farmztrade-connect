import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { Category, ListingFilters } from "@/lib/api";

const AP_DISTRICTS = [
  "Guntur",
  "Krishna",
  "Prakasam",
  "Nellore",
  "Kurnool",
  "Anantapur",
  "Chittoor",
  "East Godavari",
  "West Godavari",
  "Visakhapatnam",
];

export function FilterSheet({
  filters,
  categories,
  onApply,
  resultCount,
}: {
  filters: ListingFilters;
  categories: Category[];
  onApply: (next: ListingFilters) => void;
  resultCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ListingFilters>(filters);

  const activeCount = Object.entries(filters).filter(
    ([k, v]) => !["q", "sort", "limit"].includes(k) && v !== undefined && v !== "" && v !== false,
  ).length;

  function set<K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setDraft(filters);
      }}
    >
      <SheetTrigger asChild>
        <Button variant="secondary" className="h-11 shrink-0 gap-2 rounded-full">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-4xl px-5 pb-8">
        <SheetHeader className="px-0">
          <SheetTitle className="font-display text-xl">Filters</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 pt-2">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={draft.category ?? "all"} onValueChange={(v) => set("category", v === "all" ? undefined : v)}>
              <SelectTrigger className="h-12 rounded-2xl">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="breed">Breed</Label>
            <Input
              id="breed"
              className="h-12 rounded-2xl"
              placeholder="e.g. Murrah, Boer"
              value={draft.breed ?? ""}
              onChange={(e) => set("breed", e.target.value || undefined)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>District</Label>
              <Select value={draft.district ?? "any"} onValueChange={(v) => set("district", v === "any" ? undefined : v)}>
                <SelectTrigger className="h-12 rounded-2xl">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any district</SelectItem>
                  {AP_DISTRICTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City / Town</Label>
              <Input
                id="city"
                className="h-12 rounded-2xl"
                placeholder="Any"
                value={draft.city ?? ""}
                onChange={(e) => set("city", e.target.value || undefined)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Price range (₹)</Label>
            <Slider
              min={0}
              max={300000}
              step={5000}
              value={[draft.minPrice ?? 0, draft.maxPrice ?? 300000]}
              onValueChange={([min = 0, max = 300000]) => {
                set("minPrice", min || undefined);
                set("maxPrice", max >= 300000 ? undefined : max);
              }}
            />
            <p className="text-xs text-muted-foreground">
              ₹{(draft.minPrice ?? 0).toLocaleString("en-IN")} – ₹{(draft.maxPrice ?? 300000).toLocaleString("en-IN")}
              {draft.maxPrice ? "" : "+"}
            </p>
          </div>

          <div className="space-y-3">
            <Label>Age (months)</Label>
            <Slider
              min={0}
              max={120}
              step={3}
              value={[draft.minAge ?? 0, draft.maxAge ?? 120]}
              onValueChange={([min = 0, max = 120]) => {
                set("minAge", min || undefined);
                set("maxAge", max >= 120 ? undefined : max);
              }}
            />
            <p className="text-xs text-muted-foreground">
              {draft.minAge ?? 0} – {draft.maxAge ?? 120}
              {draft.maxAge ? "" : "+"} months
            </p>
          </div>

          <div className="space-y-3">
            <Label>Weight (kg)</Label>
            <Slider
              min={0}
              max={800}
              step={10}
              value={[draft.minWeight ?? 0, draft.maxWeight ?? 800]}
              onValueChange={([min = 0, max = 800]) => {
                set("minWeight", min || undefined);
                set("maxWeight", max >= 800 ? undefined : max);
              }}
            />
            <p className="text-xs text-muted-foreground">
              {draft.minWeight ?? 0} – {draft.maxWeight ?? 800}
              {draft.maxWeight ? "" : "+"} kg
            </p>
          </div>

          <div className="space-y-2">
            <Label>Gender</Label>
            <div className="flex gap-2">
              {(["Any", "Male", "Female"] as const).map((g) => (
                <Button
                  key={g}
                  type="button"
                  variant={(draft.gender ?? "Any") === g ? "default" : "secondary"}
                  className="h-11 flex-1 rounded-full"
                  onClick={() => set("gender", g)}
                >
                  {g}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-secondary px-4 py-3">
            <Label htmlFor="verified" className="text-sm font-medium">
              Verified sellers only
            </Label>
            <Switch
              id="verified"
              checked={Boolean(draft.verifiedOnly)}
              onCheckedChange={(v) => set("verifiedOnly", v || undefined)}
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-secondary px-4 py-3">
            <Label htmlFor="vax" className="text-sm font-medium">
              Vaccinated only
            </Label>
            <Switch
              id="vax"
              checked={Boolean(draft.vaccinatedOnly)}
              onCheckedChange={(v) => set("vaccinatedOnly", v || undefined)}
            />
          </div>

          <div className="space-y-2">
            <Label>Sort by</Label>
            <Select value={draft.sort ?? "newest"} onValueChange={(v) => set("sort", v as ListingFilters["sort"])}>
              <SelectTrigger className="h-12 rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="popular">Most popular</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className="mt-6 flex-row gap-3 px-0">
          <Button
            variant="secondary"
            className="h-12 flex-1 rounded-full"
            onClick={() => {
              const cleared: ListingFilters = { q: filters.q };
              setDraft(cleared);
              onApply(cleared);
              setOpen(false);
            }}
          >
            Reset
          </Button>
          <Button
            className="h-12 flex-1 rounded-full"
            onClick={() => {
              onApply(draft);
              setOpen(false);
            }}
          >
            Show {resultCount ?? ""} Results
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
