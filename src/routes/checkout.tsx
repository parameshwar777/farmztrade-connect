import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BanknoteArrowUp, CreditCard, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/auth-gate";
import { EmptyState, RowSkeleton } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { deliveryFeeFor, fetchFeedCart } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatINR, isValidIndianMobile } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Checkout — FARMZTRADE" },
      { name: "description", content: "Confirm your delivery address and place your feed order." },
      { property: "og:title", content: "Checkout — FARMZTRADE" },
      { property: "og:description", content: "Fast, simple checkout for your feed order." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Checkout />
    </RequireAuth>
  ),
});

function Checkout() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [method, setMethod] = useState<"cod" | "online">("cod");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    contact_name: "",
    contact_phone: "",
    address_line: "",
    city: "",
    district: "",
    state: "Andhra Pradesh",
    pincode: "",
  });

  useEffect(() => {
    if (!profile) return;
    setForm((f) => ({
      ...f,
      contact_name: profile.full_name ?? "",
      contact_phone: (profile.phone ?? "").replace("+91", ""),
      city: profile.city ?? "",
      district: profile.district ?? "",
      state: profile.state ?? "Andhra Pradesh",
      pincode: profile.pincode ?? "",
    }));
  }, [profile]);

  const cart = useQuery({
    queryKey: ["feed-cart", user?.id],
    queryFn: () => fetchFeedCart(user!.id),
    enabled: Boolean(user),
  });

  const items = cart.data ?? [];
  const subtotal = items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);
  const delivery = deliveryFeeFor(subtotal);
  const total = subtotal + delivery;

  async function placeOrder() {
    if (!user) return undefined;
    if (form.contact_name.trim().length < 3) return toast.error("Enter the name for delivery.");
    if (!isValidIndianMobile(form.contact_phone)) return toast.error("Enter a valid 10-digit mobile number.");
    if (form.address_line.trim().length < 10) return toast.error("Enter the full delivery address.");
    if (form.pincode.length !== 6) return toast.error("Enter a valid 6-digit PIN code.");

    setBusy(true);
    const orderNo = `FZ${Date.now().toString().slice(-8)}`;
    const { data: order, error } = await supabase
      .from("feed_orders")
      .insert({
        user_id: user.id,
        order_no: orderNo,
        contact_name: form.contact_name.trim(),
        contact_phone: `+91${form.contact_phone}`,
        address_line: form.address_line.trim(),
        city: form.city.trim() || null,
        district: form.district.trim() || null,
        state: form.state.trim() || null,
        pincode: form.pincode,
        subtotal,
        delivery_fee: delivery,
        total,
        payment_provider: "cod",
        payment_status: "pending",
        status: "payment_pending",
      })
      .select()
      .single();

    if (error || !order) {
      setBusy(false);
      toast.error("Could not place the order. Please try again.");
      return;
    }

    await supabase.from("feed_order_items").insert(
      items.map((i) => ({
        order_id: order.id,
        product_id: i.product.id,
        name: i.product.name,
        image_url: i.product.image_url,
        quantity: i.quantity,
        unit_price: Number(i.product.price),
      })),
    );
    await supabase.from("feed_cart").delete().eq("user_id", user.id);
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "order_placed",
      title: `Order ${orderNo} placed`,
      body: `Pay ${formatINR(total)} on delivery.`,
      link: "/orders",
    });

    setBusy(false);
    toast.success("Order placed. Pay on delivery.");
    navigate({ to: "/orders" });
  }

  if (cart.isLoading) {
    return (
      <AppShell title="Checkout" showBrandHeader={false} showBack>
        <RowSkeleton count={3} />
      </AppShell>
    );
  }

  if (!items.length) {
    return (
      <AppShell title="Checkout" showBrandHeader={false} showBack>
        <EmptyState title="Your cart is empty" body="Add feed to your cart before checking out." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Checkout" showBrandHeader={false} showBack>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        <section className="rounded-3xl bg-card p-5 card-shadow">
          <h2 className="font-display text-base font-bold">Delivery details</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cname">Full name</Label>
              <Input
                id="cname"
                className="h-12 rounded-2xl"
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cphone">Mobile number</Label>
              <div className="flex items-center gap-2 rounded-2xl border border-input px-4">
                <span className="text-sm font-semibold text-muted-foreground">+91</span>
                <Input
                  id="cphone"
                  inputMode="numeric"
                  maxLength={10}
                  className="h-12 border-0 px-0 focus-visible:ring-0"
                  value={form.contact_phone}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr">Address</Label>
              <Textarea
                id="addr"
                rows={3}
                className="rounded-2xl"
                placeholder="House / farm name, street, village"
                value={form.address_line}
                onChange={(e) => setForm({ ...form, address_line: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ccity">City / Town</Label>
                <Input
                  id="ccity"
                  className="h-12 rounded-2xl"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cdistrict">District</Label>
                <Input
                  id="cdistrict"
                  className="h-12 rounded-2xl"
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cstate">State</Label>
                <Input
                  id="cstate"
                  className="h-12 rounded-2xl"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpin">PIN code</Label>
                <Input
                  id="cpin"
                  inputMode="numeric"
                  maxLength={6}
                  className="h-12 rounded-2xl"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-card p-5 card-shadow">
          <h2 className="font-display text-base font-bold">Payment</h2>
          <div className="mt-3 space-y-2">
            <button
              onClick={() => setMethod("cod")}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left",
                method === "cod" ? "border-primary bg-primary-soft" : "border-border",
              )}
            >
              <BanknoteArrowUp className="h-5 w-5 text-primary" />
              <span>
                <span className="block text-sm font-semibold">Cash on delivery</span>
                <span className="block text-xs text-muted-foreground">Pay when your order arrives</span>
              </span>
            </button>
            <button
              onClick={() => {
                setMethod("online");
                toast.info("Online payments need a payment account connected first.");
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left opacity-70",
                method === "online" ? "border-primary" : "border-border",
              )}
            >
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <span>
                <span className="block text-sm font-semibold">Pay online (UPI / card)</span>
                <span className="block text-xs text-muted-foreground">
                  Not active yet — a payment account must be connected before real money can be taken.
                </span>
              </span>
            </button>
          </div>
        </section>

        <section className="rounded-3xl bg-card p-5 card-shadow">
          <h2 className="font-display text-base font-bold">Order summary</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="min-w-0 truncate">
                  {i.product.name} × {i.quantity}
                </span>
                <span className="shrink-0 font-medium">{formatINR(Number(i.product.price) * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span className="font-medium">{delivery === 0 ? "Free" : formatINR(delivery)}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="font-bold">Total</span>
              <span className="font-display text-lg font-extrabold text-primary">{formatINR(total)}</span>
            </div>
          </div>
        </section>

        <Button
          onClick={placeOrder}
          disabled={busy || method === "online"}
          className="h-13 w-full rounded-full text-base"
        >
          <Lock className="mr-1.5 h-4 w-4" />
          {busy ? "Placing order…" : `Place order • ${formatINR(total)}`}
        </Button>
        {method === "online" && (
          <p className="text-center text-xs text-muted-foreground">
            Choose cash on delivery to place this order now, or ask us to connect online payments.
          </p>
        )}
      </motion.div>
    </AppShell>
  );
}
