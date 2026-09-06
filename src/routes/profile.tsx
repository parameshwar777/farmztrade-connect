import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Bell,
  ChevronRight,
  Heart,
  LogOut,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Tag,
  Languages,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { TrustNote } from "@/components/badges";
import { Button } from "@/components/ui/button";
import { fetchNotifications } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { fadeUp, staggerList } from "@/lib/motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My account — FARMZTRADE" },
      { name: "description", content: "Manage your FARMZTRADE profile, listings, offers, orders and seller verification." },
      { property: "og:title", content: "My account — FARMZTRADE" },
      { property: "og:description", content: "Your FARMZTRADE account hub." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, isAdmin, isVerified, signOut, loading } = useAuth();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();

  const notifications = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => fetchNotifications(user!.id),
    enabled: Boolean(user),
  });
  const unread = (notifications.data ?? []).filter((n) => !n.read).length;

  if (!loading && !user) {
    return (
      <AppShell title="My account" showBrandHeader={false}>
        <div className="rounded-4xl soft-gradient p-6 text-center card-shadow">
          <Sparkles className="mx-auto h-8 w-8 text-primary" />
          <h1 className="mt-3 font-display text-xl font-extrabold text-primary-deep">Sign in to FARMZTRADE</h1>
          <p className="mt-1 text-sm text-primary-deep/80">
            Save favourites, chat with sellers, make offers and order feed.
          </p>
          <Button asChild className="mt-4 h-12 w-full rounded-full">
            <Link to="/auth">Sign in with mobile number</Link>
          </Button>
        </div>
        <div className="mt-5">
          <TrustNote />
        </div>
      </AppShell>
    );
  }

  const initials = (profile?.full_name ?? "F")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <AppShell title="My account" showBrandHeader={false}>
      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="flex items-center gap-4 rounded-4xl bg-card p-5 card-shadow"
      >
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full brand-gradient font-display text-xl font-extrabold text-primary-foreground">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-lg font-extrabold">{profile?.full_name ?? "FARMZTRADE user"}</h1>
          <p className="truncate text-sm text-muted-foreground">{profile?.phone}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {isVerified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-bold text-primary-deep">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified seller
              </span>
            )}
            {isAdmin && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gold/25 px-2.5 py-0.5 text-[11px] font-bold text-gold-foreground">
                <ShieldCheck className="h-3.5 w-3.5" /> Admin
              </span>
            )}
          </div>
        </div>
        <Button asChild size="sm" variant="secondary" className="shrink-0 rounded-full">
          <Link to="/profile-setup">Edit</Link>
        </Button>
      </motion.section>

      {!isVerified && (
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="mt-4 rounded-3xl soft-gradient p-5">
          <h2 className="font-display text-base font-bold text-primary-deep">Become a verified seller</h2>
          <p className="mt-1 text-sm text-primary-deep/80">
            Submit your farm details and ID once. After approval you can list animals for sale.
          </p>
          <Button asChild className="mt-3 h-11 rounded-full">
            <Link to="/verification">Start verification</Link>
          </Button>
        </motion.div>
      )}

      <motion.ul variants={staggerList} initial="hidden" animate="show" className="mt-5 space-y-2.5">
        <Item to="/my-listings" icon={Tag} label="My listings" />
        <Item to="/offers" icon={ClipboardList} label="My offers" />
        <Item to="/chats" icon={MessageCircle} label="Messages" />
        <Item to="/favorites" icon={Heart} label="Saved animals" />
        <Item to="/orders" icon={PackageCheck} label="Feed orders" />
        <Item to="/notifications" icon={Bell} label="Notifications" badge={unread || undefined} />
        {isAdmin && <Item to="/admin" icon={ShieldCheck} label="Admin panel" />}
      </motion.ul>

      <div className="mt-5 rounded-3xl bg-card p-5 card-shadow">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Languages className="h-4 w-4 text-primary" />
          {t("common.language")}
        </p>
        <div className="mt-3 flex gap-2">
          {(["en", "te"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={cn(
                "flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
                lang === l ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
              )}
            >
              {l === "en" ? "English" : "తెలుగు"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <TrustNote />
      </div>

      <Button
        variant="ghost"
        className="mt-5 h-12 w-full rounded-full text-destructive hover:bg-destructive/10"
        onClick={async () => {
          await signOut();
          toast.success("Signed out.");
          navigate({ to: "/home" });
        }}
      >
        <LogOut className="mr-1.5 h-4 w-4" />
        Sign out
      </Button>
    </AppShell>
  );
}

function Item({
  to,
  icon: Icon,
  label,
  badge,
}: {
  to: string;
  icon: typeof Tag;
  label: string;
  badge?: number;
}) {
  return (
    <motion.li variants={fadeUp}>
      <Link
        to={to}
        className="flex min-h-14 items-center gap-3 rounded-2xl bg-card px-4 py-3 card-shadow active:opacity-80"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-deep">
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{label}</span>
        {badge ? (
          <span className="shrink-0 rounded-full bg-destructive px-2 py-0.5 text-[11px] font-bold text-destructive-foreground">
            {badge}
          </span>
        ) : null}
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Link>
    </motion.li>
  );
}
