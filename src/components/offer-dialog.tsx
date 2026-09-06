import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createOffer, type ListingWithMeta } from "@/lib/api";
import { formatINR } from "@/lib/format";

export function OfferDialog({
  listing,
  buyerId,
  open,
  onOpenChange,
  onSent,
}: {
  listing: ListingWithMeta;
  buyerId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSent?: () => void;
}) {
  const listed = Number(listing.price);
  const [amount, setAmount] = useState(String(Math.round((listed * 0.9) / 500) * 500));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const value = Number(amount);
  const invalid = !Number.isFinite(value) || value <= 0 || value > listed * 3;

  async function submit() {
    if (invalid) {
      toast.error("Enter a realistic offer amount.");
      return;
    }
    setBusy(true);
    try {
      await createOffer({
        listing_id: listing.id,
        buyer_id: buyerId,
        seller_id: listing.seller_id,
        amount: value,
        message: message.trim() || undefined,
      });
      toast.success("Offer sent to the seller.");
      onOpenChange(false);
      onSent?.();
    } catch {
      toast.error("Could not send the offer. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Make an offer</DialogTitle>
          <DialogDescription>
            {listing.title} • listed at {formatINR(listed)}
            {listing.negotiable ? " • negotiable" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-2xl bg-secondary px-4 py-3 text-sm">
            <p className="font-medium">{listing.seller?.full_name ?? "Seller"}</p>
            <p className="text-muted-foreground">Listed price {formatINR(listed)}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Your Offer Price (₹)</Label>
            <Input
              id="amount"
              inputMode="numeric"
              className="h-12 rounded-2xl text-lg font-semibold"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="msg">Message to seller (optional)</Label>
            <Textarea
              id="msg"
              rows={3}
              maxLength={400}
              className="rounded-2xl"
              placeholder="I can pick up this week."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <Button onClick={submit} disabled={busy || invalid} className="h-12 w-full rounded-full">
            {busy ? "Sending…" : "Send Offer"}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">
            Offers are shared with the seller only. Payment happens directly between you and the seller.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
