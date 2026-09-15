import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Package, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell, TrustNote } from "@/components/app-shell";
import { RequireAuth } from "@/components/auth-gate";
import { ImageUploader } from "@/components/image-uploader";
import { SafeImage } from "@/components/media";
import { EmptyState, RowSkeleton } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createFeedProduct,
  deleteMyFeedProduct,
  fetchFeedCategories,
  fetchMyFeedProducts,
  type FeedProduct,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatINR, timeAgo } from "@/lib/format";
import { fadeUp } from "@/lib/motion";

export const Route = createFileRoute("/sell-feed")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sell feed — FARMZTRADE" },
      {
        name: "description",
        content: "List cattle feed, minerals, supplements or pet food in the FARMZTRADE feed store after a quick review.",
      },
      { property: "og:title", content: "Sell feed — FARMZTRADE" },
      { property: "og:description", content: "Reach farmers buying feed near you." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <SellFeed />
    </RequireAuth>
  ),
});

type Draft = {
  name: string;
  brand: string;
  category_slug: string;
  animal_type: string;
  weight_label: string;
  mrp: string;
  price: string;
  stock: string;
  description: string;
  ingredients: string;
  suitable_for: string;
  photos: string[];
};

const emptyDraft: Draft = {
  name: "",
  brand: "",
  category_slug: "",
  animal_type: "",
  weight_label: "",
  mrp: "",
  price: "",
  stock: "10",
  description: "",
  ingredients: "",
  suitable_for: "",
  photos: [],
};

function statusLabel(status: string) {
  if (status === "approved") return "Live in store";
  if (status === "rejected") return "Not approved";
  return "Waiting for review";
}

function SellFeed() {
  const { user } = useAuth();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [busy, setBusy] = useState(false);

  const categories = useQuery({ queryKey: ["feed-categories"], queryFn: fetchFeedCategories, staleTime: 300_000 });
  const mine = useQuery({
    queryKey: ["my-feed-products", user?.id],
    queryFn: () => fetchMyFeedProducts(user!.id),
    enabled: Boolean(user),
  });

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function submit() {
    if (!user) return;
    if (draft.name.trim().length < 3) return void toast.error("Enter a product name.");
    if (!draft.category_slug) return void toast.error("Choose a feed type.");
    const price = Number(draft.price);
    if (!Number.isFinite(price) || price <= 0) return void toast.error("Enter your selling price.");
    const mrp = draft.mrp.trim() === "" ? null : Number(draft.mrp);
    if (mrp !== null && (!Number.isFinite(mrp) || mrp < price)) {
      return void toast.error("Original price must be higher than your selling price.");
    }
    if (!draft.photos.length) return void toast.error("Add at least one photo.");

    setBusy(true);
    try {
      await createFeedProduct(user.id, {
        name: draft.name.trim(),
        brand: draft.brand.trim() || null,
        category_slug: draft.category_slug,
        animal_type: draft.animal_type.trim() || null,
        weight_label: draft.weight_label.trim() || null,
        mrp,
        price,
        stock: Number(draft.stock) || 0,
        description: draft.description.trim() || null,
        ingredients: draft.ingredients.trim() || null,
        suitable_for: draft.suitable_for.trim() || null,
        image_url: draft.photos[0] ?? null,
      });
      setDraft(emptyDraft);
      await mine.refetch();
      toast.success("Sent for review. We'll notify you once it's live.");
    } catch {
      toast.error("Could not send your product. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(product: FeedProduct) {
    try {
      await deleteMyFeedProduct(product.id);
      await mine.refetch();
      toast.success("Product removed.");
    } catch {
      toast.error("Could not remove this product.");
    }
  }

  return (
    <AppShell title="Sell feed" showBrandHeader={false} showBack>
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="space-y-6">
        <section className="rounded-4xl bg-card p-4 card-shadow">
          <h1 className="font-display text-lg font-extrabold">List a feed product</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Our team checks every product before it appears in the feed store.
          </p>

          <div className="mt-4 space-y-3">
            <Field label="Product name">
              <Input className="h-12 rounded-2xl" value={draft.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Brand">
              <Input className="h-12 rounded-2xl" value={draft.brand} onChange={(e) => set("brand", e.target.value)} />
            </Field>
            <Field label="Feed type">
              <Select value={draft.category_slug} onValueChange={(v) => set("category_slug", v)}>
                <SelectTrigger className="h-12 rounded-2xl">
                  <SelectValue placeholder="Choose feed type" />
                </SelectTrigger>
                <SelectContent>
                  {(categories.data ?? []).map((c) => (
                    <SelectItem key={c.slug} value={c.slug}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Original price (₹)">
                <Input
                  inputMode="numeric"
                  className="h-12 rounded-2xl"
                  value={draft.mrp}
                  onChange={(e) => set("mrp", e.target.value)}
                />
              </Field>
              <Field label="Your price (₹)">
                <Input
                  inputMode="numeric"
                  className="h-12 rounded-2xl"
                  value={draft.price}
                  onChange={(e) => set("price", e.target.value)}
                />
              </Field>
              <Field label="Stock">
                <Input
                  inputMode="numeric"
                  className="h-12 rounded-2xl"
                  value={draft.stock}
                  onChange={(e) => set("stock", e.target.value)}
                />
              </Field>
              <Field label="Pack size">
                <Input
                  className="h-12 rounded-2xl"
                  placeholder="e.g. 50 kg bag"
                  value={draft.weight_label}
                  onChange={(e) => set("weight_label", e.target.value)}
                />
              </Field>
            </div>
            <Field label="For which animals">
              <Input
                className="h-12 rounded-2xl"
                placeholder="Cow, buffalo, goat…"
                value={draft.animal_type}
                onChange={(e) => set("animal_type", e.target.value)}
              />
            </Field>
            <Field label="Description">
              <Textarea
                rows={3}
                className="rounded-2xl"
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>
            <Field label="Ingredients">
              <Textarea
                rows={2}
                className="rounded-2xl"
                value={draft.ingredients}
                onChange={(e) => set("ingredients", e.target.value)}
              />
            </Field>
            <Field label="Photos">
              {user && (
                <ImageUploader
                  userId={user.id}
                  paths={draft.photos}
                  onChange={(photos) => set("photos", photos)}
                  min={1}
                  max={5}
                />
              )}
            </Field>
            <Button className="h-12 w-full rounded-full" disabled={busy} onClick={submit}>
              {busy ? "Sending…" : "Send for review"}
            </Button>
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-extrabold">My feed products</h2>
          {mine.isLoading ? (
            <RowSkeleton count={2} />
          ) : mine.data?.length ? (
            <ul className="space-y-3">
              {mine.data.map((p) => (
                <li key={p.id} className="flex gap-3 rounded-3xl bg-card p-3 card-shadow">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
                    <SafeImage path={p.image_url} alt={p.name} className="h-full w-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display font-bold">{p.name}</p>
                    <p className="text-sm font-bold text-primary">{formatINR(Number(p.price))}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(p.created_at)}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="secondary" className="rounded-full">
                        {statusLabel(p.status)}
                      </Badge>
                    </div>
                    {p.reject_reason && p.status === "rejected" ? (
                      <p className="mt-1 text-xs text-muted-foreground">{p.reject_reason}</p>
                    ) : null}
                  </div>
                  <Button size="sm" variant="secondary" className="self-center rounded-full" onClick={() => remove(p)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<Package className="h-7 w-7" />}
              title="Nothing listed yet"
              body="Your feed products will show here with their review status."
            />
          )}
        </section>
      </motion.div>
      <TrustNote />
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
