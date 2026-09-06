import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect } from "react";

import { BrandMark, BrandWordmark } from "@/components/brand";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "FARMZTRADE — Buy & Sell Livestock in India" },
      {
        name: "description",
        content:
          "FARMZTRADE is a trusted livestock marketplace for cattle, goats, sheep, poultry and pets, plus a feed store for healthier animals.",
      },
      { property: "og:title", content: "FARMZTRADE — Buy & Sell Livestock in India" },
      {
        property: "og:description",
        content: "Trusted sellers, direct chat, fair offers and quality feed — all in one app.",
      },
    ],
  }),
  component: Splash,
});

const ONBOARD_KEY = "farmztrade.onboarded";

function Splash() {
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    const seen = window.localStorage.getItem(ONBOARD_KEY) === "1";
    const timer = window.setTimeout(() => {
      navigate({ to: seen ? "/home" : "/onboarding", replace: true });
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="grid min-h-screen place-items-center brand-gradient px-6 text-center safe-top safe-bottom">
      <div>
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className="mx-auto grid h-28 w-28 place-items-center rounded-4xl bg-primary-foreground/95 float-shadow"
        >
          <BrandMark className="h-20 w-20" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="mt-6"
        >
          <BrandWordmark size="xl" invert />
          <p className="mt-2 text-sm font-medium text-primary-foreground/85">{t("brand.tagline")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mx-auto mt-10 h-1 w-28 overflow-hidden rounded-full bg-primary-foreground/25"
        >
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="h-full w-full rounded-full bg-gold"
          />
        </motion.div>
      </div>
    </div>
  );
}
