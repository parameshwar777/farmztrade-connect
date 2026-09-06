import { useQuery } from "@tanstack/react-query";
import { Package, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { logAdminAction } from "@/components/admin/shared";
import { SafeImage } from "@/components/media";
import { EmptyState, RowSkeleton } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { FeedProduct } from "@/lib/api";
import { formatINR } from "@/lib/format";

type Draft = {
  id?: string;
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
  image_url: string;
  active: boolean;
};

const emptyDraft = (category: string): Draft => ({
  name: "",
  brand: "",
  category_slug: category,
  animal_type: "",
  weight_label: "",
  mrp: "",
  price: "",
  stock: "0",
  description: "",
  ingredients: "",
  suitable_for: "",
  image_url: "",
  active: true,
});

function toDraft(p: FeedProduct): Draft {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand ?? "",
    category_slug: p.category_slug,
    animal_type: p.animal_type ?? "",
    weight_label: p.weight_label ?? "",
    mrp: p.mrp === null ? "" : String(p.mrp),
    price: String(p.price),
    stock: String(p.stock),
    description: p.description ?? "",
    ingredients: p.ingredients ?? "",
    suitable_for: p.suitable_for ?? "",
    image_url: p.image_url ?? "",
    active: p.active,
  };
}

export function FeedManager({ adminId }: { adminId: string }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);

  const categories = useQuery({
    queryKey: ["admin-feed-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("feed_categories").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const products = useQuery({
    queryKey: ["admin-feed-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("feed_products").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  function startNew() {
    setDraft(emptyDraft(categories.data?.[0]?.slug ?? "cattle-feed"));
    setOpen(true);
  }

  function startEdit(p: FeedProduct) {
    setDraft(toDraft(p));
    setOpen(true);
  }

  async function save() {
    if (!draft) return;
    if (draft.name.trim().length < 3) return void toast.error("Enter a product name.");
    const price = Number(draft.price);
    if (!Number.isFinite(price) || price <= 0) return void toast.error("Enter a valid selling price.");
    const mrp = draft.mrp.trim() === "" ? null : Number(draft.mrp);
    if (mrp !== null && (!Number.isFinite(mrp) || mrp < price)) {
      return void toast.error("Original price must be higher than the offer price.");
    }

    const payload = {
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
      image_url: draft.image_url.trim() || null,
      active: draft.active,
    };

    setBusy(true);
    const res = draft.id
      ? await supabase.from("feed_products").update(payload).eq("id", draft.id)
      : await supabase.from("feed_products").insert(payload);
    setBusy(false);

    if (res.error) return void toast.error("Could not save the product.");
    await logAdminAction(adminId, draft.id ? "feed_product_updated" : "feed_product_created", {
      table: "feed_products",
      ...(draft.id ? { targetId: draft.id } : {}),
      note: payload.name,
    });
    setOpen(false);
    setDraft(null);
    await products.refetch();
    toast.success(draft.id ? "Product updated." : "Product added.");
    return undefined;
  }

  async function remove(p: FeedProduct) {
    setBusy(true);
    const { error } = await supabase.from("feed_products").delete().eq("id", p.id);
    setBusy(false);
    if (error) return void toast.error("Could not delete. It may be part of an order — switch it off instead.");
    await logAdminAction(adminId, "feed_product_deleted", { table: "feed_products", targetId: p.id, note: p.name });
    await products.refetch();
    toast.success("Product removed.");
    return undefined;
  }

  async function toggleActive(p: FeedProduct) {
    await supabase.from("feed_products").update({ active: !p.active }).eq("id", p.id);
    await products.refetch();
  }

  return (
    <div className="space-y-3">
      <Button className="h-12 w-full rounded-full" onClick={startNew}>
        <Plus className="mr-1 h-4 w-4" /> Add feed product
      </Button>

      {products.isLoading ? (
        <RowSkeleton count={3} />
      ) : products.data?.length ? (
        <ul className="space-y-3">
          {products.data.map((p) => (
            <li key={p.id} className="rounded-3xl bg-card p-4 card-shadow">
              <div className="flex gap-3">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
                  <SafeImage path={p.image_url} alt={p.name} className="h-full w-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display font-bold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[p.brand, p.weight_label, p.category_slug].filter(Boolean).join(" • ")}
                  </p>
                  <p className="mt-1 text-sm font-bold text-primary">
                    {formatINR(Number(p.price))}
                    {p.mrp ? (
                      <span className="ml-2 text-xs font-normal text-muted-foreground line-through">
                        {formatINR(Number(p.mrp))}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">Stock: {p.stock}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button size="sm" variant="secondary" className="flex-1 rounded-full" onClick={() => startEdit(p)}>
                  <Pencil className="mr-1 h-4 w-4" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full"
                  disabled={busy}
                  onClick={() => remove(p)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{p.active ? "Live" : "Hidden"}</span>
                  <Switch checked={p.active} onCheckedChange={() => void toggleActive(p)} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={<Package className="h-7 w-7" />} title="No feed products yet" body="Add your first product." />
      )}

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setDraft(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">{draft?.id ? "Edit product" : "New feed product"}</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="space-y-3">
              <Field label="Product name">
                <Input
                  className="h-12 rounded-2xl"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </Field>
              <Field label="Brand">
                <Input
                  className="h-12 rounded-2xl"
                  value={draft.brand}
                  onChange={(e) => setDraft({ ...draft, brand: e.target.value })}
                />
              </Field>
              <Field label="Category">
                <Select value={draft.category_slug} onValueChange={(v) => setDraft({ ...draft, category_slug: v })}>
                  <SelectTrigger className="h-12 rounded-2xl">
                    <SelectValue placeholder="Choose category" />
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
                    onChange={(e) => setDraft({ ...draft, mrp: e.target.value })}
                  />
                </Field>
                <Field label="Offer price (₹)">
                  <Input
                    inputMode="numeric"
                    className="h-12 rounded-2xl"
                    value={draft.price}
                    onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                  />
                </Field>
                <Field label="Stock">
                  <Input
                    inputMode="numeric"
                    className="h-12 rounded-2xl"
                    value={draft.stock}
                    onChange={(e) => setDraft({ ...draft, stock: e.target.value })}
                  />
                </Field>
                <Field label="Pack size">
                  <Input
                    className="h-12 rounded-2xl"
                    placeholder="e.g. 50 kg bag"
                    value={draft.weight_label}
                    onChange={(e) => setDraft({ ...draft, weight_label: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Animal type">
                <Input
                  className="h-12 rounded-2xl"
                  placeholder="Cow, buffalo, goat…"
                  value={draft.animal_type}
                  onChange={(e) => setDraft({ ...draft, animal_type: e.target.value })}
                />
              </Field>
              <Field label="Description">
                <Textarea
                  rows={3}
                  className="rounded-2xl"
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </Field>
              <Field label="Ingredients">
                <Textarea
                  rows={2}
                  className="rounded-2xl"
                  value={draft.ingredients}
                  onChange={(e) => setDraft({ ...draft, ingredients: e.target.value })}
                />
              </Field>
              <Field label="Suitable for">
                <Input
                  className="h-12 rounded-2xl"
                  value={draft.suitable_for}
                  onChange={(e) => setDraft({ ...draft, suitable_for: e.target.value })}
                />
              </Field>
              <Field label="Photo link">
                <Input
                  className="h-12 rounded-2xl"
                  placeholder="https://…"
                  value={draft.image_url}
                  onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                />
              </Field>
              <div className="flex items-center justify-between rounded-2xl bg-secondary px-4 py-3">
                <span className="text-sm font-semibold">Show in the feed store</span>
                <Switch checked={draft.active} onCheckedChange={(v) => setDraft({ ...draft, active: v })} />
              </div>
              <Button className="h-12 w-full rounded-full" disabled={busy} onClick={save}>
                {busy ? "Saving…" : "Save product"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
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
