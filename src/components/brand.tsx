import { motion } from "framer-motion";

import logo from "@/assets/farmztrade-logo.png";
import { cn } from "@/lib/utils";

export function BrandMark({ className, animate = false }: { className?: string; animate?: boolean }) {
  const img = (
    <img
      src={logo}
      alt="FARMZTRADE"
      width={816}
      height={816}
      loading="eager"
      className={cn("h-9 w-9 object-contain", className)}
    />
  );
  if (!animate) return img;
  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0, rotate: -6 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 180, damping: 16 }}
    >
      {img}
    </motion.div>
  );
}

export function BrandWordmark({
  size = "md",
  invert = false,
  withTagline = false,
}: {
  size?: "sm" | "md" | "lg";
  invert?: boolean;
  withTagline?: boolean;
}) {
  const text = size === "lg" ? "text-3xl" : size === "sm" ? "text-base" : "text-xl";
  return (
    <div className="flex min-w-0 flex-col">
      <span
        className={cn(
          "font-display font-extrabold leading-none tracking-tight",
          text,
          invert ? "text-primary-foreground" : "text-primary",
        )}
      >
        FARMZ<span className={invert ? "text-gold" : "text-gold-foreground"}>TRADE</span>
      </span>
      {withTagline && (
        <span
          className={cn(
            "mt-1 text-[11px] font-medium leading-tight",
            invert ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          Better Care. Better Growth. Better Tomorrow.
        </span>
      )}
    </div>
  );
}

export function BrandLockup({ invert = false, withTagline = false }: { invert?: boolean; withTagline?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <BrandMark />
      <BrandWordmark invert={invert} withTagline={withTagline} />
    </div>
  );
}
