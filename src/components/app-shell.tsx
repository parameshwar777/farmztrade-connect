import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, Heart, MessageCircle, ShoppingBag } from "lucide-react";
import type { ReactNode } from "react";

import { BottomNav } from "@/components/bottom-nav";
import { BrandLockup } from "@/components/brand";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { fetchNotifications } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { pageTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";

const desktopLinks = [
  { to: "/home", label: "Home" },
  { to: "/search", label: "Browse Animals" },
  { to: "/feed", label: "Feed Store" },
  { to: "/sell", label: "Sell" },
  { to: "/chats", label: "Messages" },
];

export function AppShell({
  children,
  title,
  showBack = false,
  showBrandHeader = true,
  headerRight,
  className,
  bare = false,
}: {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  showBrandHeader?: boolean;
  headerRight?: ReactNode;
  className?: string;
  bare?: boolean;
}) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: notifications } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => fetchNotifications(user!.id),
    enabled: Boolean(user),
    staleTime: 30_000,
  });
  const unread = (notifications ?? []).filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      {!bare && (
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur-lg safe-top">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
            {showBack ? (
              <button
                onClick={() => navigate({ to: "/home" })}
                aria-label="Go back"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : null}

            {showBrandHeader && !title ? (
              <Link to="/home" className="min-w-0">
                <BrandLockup />
              </Link>
            ) : (
              <h1 className="min-w-0 flex-1 truncate font-display text-lg font-bold">{title}</h1>
            )}

            <nav className="ml-6 hidden flex-1 items-center gap-1 lg:flex">
              {desktopLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "rounded-full px-3 py-2 text-sm font-medium transition-colors",
                    pathname.startsWith(l.to)
                      ? "bg-primary-soft text-primary-deep"
                      : "text-muted-foreground hover:bg-secondary",
                  )}
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="ml-auto flex shrink-0 items-center gap-1">
              {headerRight}
              <IconLink to="/favorites" label="Favorites">
                <Heart className="h-5 w-5" />
              </IconLink>
              <IconLink to="/chats" label="Messages">
                <MessageCircle className="h-5 w-5" />
              </IconLink>
              <IconLink to="/feed-cart" label="Feed cart">
                <ShoppingBag className="h-5 w-5" />
              </IconLink>
              <IconLink to="/notifications" label="Notifications" badge={unread}>
                <Bell className="h-5 w-5" />
              </IconLink>
              <Link to={user ? "/profile" : "/auth"} aria-label="Profile" className="ml-1">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarImage src={profile?.avatar_url ?? undefined} alt="" />
                  <AvatarFallback className="bg-primary-soft text-xs font-semibold text-primary-deep">
                    {(profile?.full_name || "FZ").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </header>
      )}

      <motion.main
        variants={pageTransition}
        initial="hidden"
        animate="show"
        className={cn("mx-auto w-full max-w-6xl px-4 pb-28 pt-4 lg:pb-16", className)}
      >
        {children}
      </motion.main>

      <BottomNav />
    </div>
  );
}

function IconLink({
  to,
  label,
  children,
  badge = 0,
}: {
  to: string;
  label: string;
  children: ReactNode;
  badge?: number;
}) {
  return (
    <Button asChild variant="ghost" size="icon" className="relative h-10 w-10 rounded-full text-foreground/70">
      <Link to={to} aria-label={label}>
        {children}
        {badge > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground"
          >
            {badge > 9 ? "9+" : badge}
          </motion.span>
        )}
      </Link>
    </Button>
  );
}

export function TrustNote() {
  const { t } = useI18n();
  return (
    <p className="mt-8 rounded-2xl bg-secondary px-4 py-3 text-center text-xs leading-relaxed text-secondary-foreground">
      {t("trust.disclaimer")}
    </p>
  );
}
