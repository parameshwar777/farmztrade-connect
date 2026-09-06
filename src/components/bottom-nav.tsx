import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Home, PlusCircle, Search, User, Wheat } from "lucide-react";

import { useI18n, type TKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const items: { to: string; icon: typeof Home; label: TKey; center?: boolean }[] = [
  { to: "/home", icon: Home, label: "nav.home" },
  { to: "/search", icon: Search, label: "nav.search" },
  { to: "/sell", icon: PlusCircle, label: "nav.sell", center: true },
  { to: "/feed", icon: Wheat, label: "nav.feed" },
  { to: "/profile", icon: User, label: "nav.profile" },
];

export function BottomNav() {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card/95 backdrop-blur-lg safe-bottom lg:hidden">
      <ul className="mx-auto flex max-w-lg items-end justify-between px-2 pt-1.5">
        {items.map(({ to, icon: Icon, label, center }) => {
          const active = pathname === to || pathname.startsWith(`${to}/`);
          if (center) {
            return (
              <li key={to} className="flex-1">
                <Link to={to} className="flex flex-col items-center gap-1 -mt-6">
                  <motion.span
                    whileTap={{ scale: 0.92 }}
                    className="grid h-14 w-14 place-items-center rounded-full brand-gradient text-primary-foreground float-shadow"
                  >
                    <Icon className="h-7 w-7" />
                  </motion.span>
                  <span className="text-[10px] font-semibold text-primary">{t(label)}</span>
                </Link>
              </li>
            );
          }
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className="relative flex min-h-12 flex-col items-center justify-center gap-1 py-1.5"
                aria-current={active ? "page" : undefined}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-x-3 -top-0.5 h-0.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon
                  className={cn(
                    "h-[22px] w-[22px] transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {t(label)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
