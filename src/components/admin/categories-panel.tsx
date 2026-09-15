import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { logAdminAction } from "@/components/admin/shared";
import { SafeImage } from "@/components/media";
import { EmptyState, RowSkeleton } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

type Kind = "animal_categories" | "feed_categories";

type Row = {
  id: string;
  slug: string;
  name: string;
  image_url: string | null;
  sort_order: number;
  name_te?: string | null;
};

type Draft = {
  id?: string;
  name: string;
  name_te: string;
  slug: string;
  image_url: string;
  sort_order: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Add, rename, reorder and remove the category lists used across the app. */
export function CategoriesPanel({ adminId }: { adminId: string }) {
  const [kind, setKind] = useState<Kind>("animal_categories");
  return (
    <Tabs value={kind} onValueChange={(v) => setKind(v as Kind)}>
      <TabsList className="w-full rounded-full">
        <TabsTrigger value="animal_categories" className="flex-1 rounded-full">
          Animal types
        </TabsTrigger>
        <TabsTrigger value="feed_categories" className="flex-1 rounded-full">
          Feed types
        </TabsTrigger>
      </TabsList>
      <TabsContent value={kind} className="mt-4">
        <CategoryList kind={kind} adminId={adminId} />
      </TabsContent>
    </Tabs>
  );
}

function CategoryList({ kind, adminId }: { kind: Kind; adminId: string }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const isAnimal = kind === "animal_categories";

  const rows = useQuery({
    queryKey: ["admin-categories", kind],
    queryFn: async () => {
      const { data, error } = await supabase.from(kind).select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  function startNew() {
    setDraft({
      name: "",
      name_te: "",
      slug: "",
      image_url: "",
      sort_order: String((rows.data?.length ?? 0) + 1),
    });
  }

  function startEdit(row: Row) {
    setDraft({
      id: row.id,
      name: row.name,
      name_te: row.name_te ?? "",
      slug: row.slug,
      image_url: row.image_url ?? "",
      sort_order: String(row.sort_order),
    });
  }

  async function save() {
    if (!draft) return;
    const name = draft.name.trim();
    if (name.length < 2) return void toast.error("Enter a category name.");
    const slug = slugify(draft.slug || name);
    if (!slug) return void toast.error("Enter a valid short name.");

    const payload: Record<string, unknown> = {
      name,
      slug,
      image_url: draft.image_url.trim() || null,
      sort_order: Number(draft.sort_order) || 0,
    };
    if (isAnimal) payload["name_te"] = draft.name_te.trim() || null;

    setBusy(true);
    const res = draft.id
      ? await supabase.from(kind).update(payload).eq("id", draft.id)
      : await supabase.from(kind).insert(payload as never);
    setBusy(false);

    if (res.error) {
      toast.error(
        res.error.code === "23505" ? "That short name is already used." : "Could not save this category.",
      );
      return;
    }
    await logAdminAction(adminId, draft.id ? "category_updated" : "category_created", {
      table: kind,
      ...(draft.id ? { targetId: draft.id } : {}),
      note: name,
    });
    setDraft(null);
    await rows.refetch();
    toast.success(draft.id ? "Category updated." : "Category added.");
  }

  async function remove(row: Row) {
    setBusy(true);
    const { error } = await supabase.from(kind).delete().eq("id", row.id);
    setBusy(false);
    if (error) {
      toast.error("Could not delete. Animals or products still use this category.");
      return;
    }
    await logAdminAction(adminId, "category_deleted", { table: kind, targetId: row.id, note: row.name });
    await rows.refetch();
    toast.success("Category removed.");
  }

  return (
    <div className="space-y-3">
      <Button className="h-12 w-full rounded-full" onClick={startNew}>
        <Plus className="mr-1 h-4 w-4" /> Add {isAnimal ? "animal type" : "feed type"}
      </Button>

      {rows.isLoading ? (
        <RowSkeleton count={3} />
      ) : rows.data?.length ? (
        <ul className="space-y-3">
          {rows.data.map((row) => (
            <li key={row.id} className="flex items-center gap-3 rounded-3xl bg-card p-3 card-shadow">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl">
                <SafeImage path={row.image_url} alt={row.name} className="h-full w-full" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display font-bold">{row.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.slug} • position {row.sort_order}
                </p>
              </div>
              <Button size="sm" variant="secondary" className="rounded-full" onClick={() => startEdit(row)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="rounded-full"
                disabled={busy}
                onClick={() => remove(row)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<LayoutGrid className="h-7 w-7" />}
          title="No categories yet"
          body="Add the first one so people can browse."
        />
      )}

      <Dialog open={Boolean(draft)} onOpenChange={(v) => !v && setDraft(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">{draft?.id ? "Edit category" : "New category"}</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  className="h-12 rounded-2xl"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              {isAnimal && (
                <div className="space-y-1.5">
                  <Label>Telugu name</Label>
                  <Input
                    className="h-12 rounded-2xl"
                    value={draft.name_te}
                    onChange={(e) => setDraft({ ...draft, name_te: e.target.value })}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Short name (used in links)</Label>
                <Input
                  className="h-12 rounded-2xl"
                  placeholder="auto from name"
                  value={draft.slug}
                  onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                  disabled={Boolean(draft.id)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Photo link</Label>
                <Input
                  className="h-12 rounded-2xl"
                  placeholder="https://…"
                  value={draft.image_url}
                  onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Position</Label>
                <Input
                  inputMode="numeric"
                  className="h-12 rounded-2xl"
                  value={draft.sort_order}
                  onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })}
                />
              </div>
              <Button className="h-12 w-full rounded-full" disabled={busy} onClick={save}>
                {busy ? "Saving…" : "Save category"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
