import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarPlus, HandCoins, ImagePlus, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/auth-gate";
import { SafeImage } from "@/components/media";
import { OfferDialog } from "@/components/offer-dialog";
import { ErrorState, RowSkeleton } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { fetchListing, sendMessage, type Message } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { clockTime, formatINR } from "@/lib/format";
import { uploadFile, validateImage } from "@/lib/storage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chats/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Chat — FARMZTRADE" },
      { name: "description", content: "Message the seller, send an offer or arrange a visit to see the animal." },
      { property: "og:title", content: "Chat — FARMZTRADE" },
      { property: "og:description", content: "Negotiate directly and safely on FARMZTRADE." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <ChatRoom />
    </RequireAuth>
  ),
});

const QUICK_REPLIES = ["Is it still available?", "What is your final price?", "Can I visit this week?", "Send more photos"];

function ChatRoom() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [offerOpen, setOfferOpen] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [visit, setVisit] = useState({ date: "", time: "", place: "" });

  const conversation = useQuery({
    queryKey: ["conversation", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("conversations").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const listing = useQuery({
    queryKey: ["listing", conversation.data?.listing_id],
    queryFn: () => fetchListing(conversation.data!.listing_id),
    enabled: Boolean(conversation.data?.listing_id),
  });

  const messages = useQuery({
    queryKey: ["messages", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", id)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as Message[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`messages-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["messages", id] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.data?.length]);

  async function send(body: string) {
    const value = body.trim();
    if (!value || !user) return;
    setText("");
    try {
      await sendMessage({ conversation_id: id, sender_id: user.id, body: value });
      await messages.refetch();
    } catch {
      toast.error("Message could not be sent.");
    }
  }

  async function sendPhoto(file: File) {
    if (!user) return;
    const problem = validateImage(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    try {
      const path = await uploadFile("listing-photos", user.id, file);
      await sendMessage({ conversation_id: id, sender_id: user.id, image_url: path, kind: "image" });
      await messages.refetch();
    } catch {
      toast.error("Photo could not be sent.");
    }
  }

  async function arrangeVisit() {
    if (!visit.date || !user) {
      toast.error("Pick a date for the visit.");
      return;
    }
    const { error } = await supabase.from("meetings").insert({
      conversation_id: id,
      created_by: user.id,
      meet_date: visit.date,
      meet_time: visit.time || null,
      place: visit.place || null,
    });
    if (error) {
      toast.error("Could not save the visit.");
      return;
    }
    await sendMessage({
      conversation_id: id,
      sender_id: user.id,
      kind: "meeting",
      body: `Visit proposed for ${visit.date}${visit.time ? ` at ${visit.time}` : ""}`,
      payload: { date: visit.date, time: visit.time, place: visit.place },
    });
    setVisitOpen(false);
    setVisit({ date: "", time: "", place: "" });
    await messages.refetch();
    toast.success("Visit request sent.");
  }

  if (conversation.isLoading) {
    return (
      <AppShell title="Chat" showBrandHeader={false} showBack>
        <RowSkeleton count={4} />
      </AppShell>
    );
  }

  if (conversation.isError || !conversation.data) {
    return (
      <AppShell title="Chat" showBrandHeader={false} showBack>
        <ErrorState message="This conversation is not available." />
      </AppShell>
    );
  }

  const l = listing.data;

  return (
    <AppShell title="Chat" showBrandHeader={false} showBack className="pb-44">
      {l && (
        <Link to="/animals/$id" params={{ id: l.id }} className="flex items-center gap-3 rounded-3xl bg-card p-3 card-shadow">
          <div className="h-14 w-16 shrink-0 overflow-hidden rounded-2xl">
            <SafeImage path={l.animal_images[0]?.url} alt="" className="h-full w-full" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{l.title}</p>
            <p className="text-sm font-bold text-primary">{formatINR(Number(l.price))}</p>
          </div>
        </Link>
      )}

      <div className="mt-4 space-y-2">
        <AnimatePresence initial={false}>
          {(messages.data ?? []).map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[78%] rounded-3xl px-4 py-2.5 text-sm card-shadow",
                    mine ? "bg-primary text-primary-foreground" : "bg-card",
                    m.kind === "meeting" && "border border-gold/60",
                  )}
                >
                  {m.kind === "meeting" && (
                    <p className={cn("mb-1 text-[11px] font-bold uppercase", mine ? "text-primary-foreground/80" : "text-gold-foreground")}>
                      Visit request
                    </p>
                  )}
                  {m.image_url && (
                    <div className="mb-2 h-40 w-52 overflow-hidden rounded-2xl">
                      <SafeImage path={m.image_url} alt="Shared photo" className="h-full w-full" />
                    </div>
                  )}
                  {m.body && <p className="whitespace-pre-line leading-relaxed">{m.body}</p>}
                  <p className={cn("mt-1 text-[10px]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    {clockTime(m.created_at)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {!messages.data?.length && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Start the conversation — ask about health, age or a good time to visit.
        </p>
      )}

      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border/60 bg-card/95 backdrop-blur safe-bottom lg:bottom-0">
        <div className="mx-auto max-w-6xl px-4 py-2">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <Button size="sm" variant="secondary" className="shrink-0 rounded-full" onClick={() => setOfferOpen(true)}>
              <HandCoins className="mr-1 h-4 w-4" />
              Make offer
            </Button>
            <Button size="sm" variant="secondary" className="shrink-0 rounded-full" onClick={() => setVisitOpen(true)}>
              <CalendarPlus className="mr-1 h-4 w-4" />
              Arrange visit
            </Button>
            {QUICK_REPLIES.map((q) => (
              <Button key={q} size="sm" variant="secondary" className="shrink-0 rounded-full" onClick={() => void send(q)}>
                {q}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Send a photo"
              className="h-11 w-11 shrink-0 rounded-full"
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus className="h-5 w-5" />
            </Button>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void send(text)}
              placeholder="Write a message…"
              className="h-11 rounded-full"
            />
            <Button
              size="icon"
              aria-label="Send"
              className="h-11 w-11 shrink-0 rounded-full"
              onClick={() => void send(text)}
              disabled={!text.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void sendPhoto(file);
          e.target.value = "";
        }}
      />

      {l && user && <OfferDialog listing={l} buyerId={user.id} open={offerOpen} onOpenChange={setOfferOpen} />}

      <Dialog open={visitOpen} onOpenChange={setVisitOpen}>
        <DialogContent className="rounded-3xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Arrange a visit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                className="h-12 rounded-2xl"
                value={visit.date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setVisit({ ...visit, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                className="h-12 rounded-2xl"
                value={visit.time}
                onChange={(e) => setVisit({ ...visit, time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="place">Place</Label>
              <Input
                id="place"
                className="h-12 rounded-2xl"
                placeholder="Farm address or landmark"
                value={visit.place}
                onChange={(e) => setVisit({ ...visit, place: e.target.value })}
              />
            </div>
            <Button className="h-12 w-full rounded-full" onClick={arrangeVisit}>
              Send visit request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
