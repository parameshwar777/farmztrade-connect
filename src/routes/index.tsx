import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import btsLogo from "@/assets/bts-farms-logo.jpeg.asset.json";
import splashArt from "@/assets/splash-farm.jpg";
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
  const [stage, setStage] = useState<"bts" | "brand">("bts");

  useEffect(() => {
    const toBrand = window.setTimeout(() => setStage("brand"), 550);
    return () => window.clearTimeout(toBrand);
  }, []);

  useEffect(() => {
    if (stage !== "brand") return;
    const seen = window.localStorage.getItem(ONBOARD_KEY) === "1";
    const timer = window.setTimeout(() => {
      navigate({ to: seen ? "/home" : "/onboarding", replace: true });
    }, 650);
    return () => window.clearTimeout(timer);
  }, [stage, navigate]);


  return (
    <AnimatePresence mode="wait">
      {stage === "bts" ? (
        <motion.div
          key="bts"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          className="grid min-h-screen place-items-center bg-background px-8 text-center safe-top safe-bottom"
        >
          <div>
            <motion.img
              src={btsLogo.url}
              alt="BTS Farms"
              width={1260}
              height={1260}
              loading="eager"
              initial={{ scale: 0.82, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 160, damping: 18 }}
              className="mx-auto h-56 w-56 object-contain"
            />
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
            >
              A BTS Farms initiative
            </motion.p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="brand"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex min-h-screen flex-col bg-background safe-top safe-bottom"
        >
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="pt-16 text-center"
          >
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-primary">
              FARMZ<span className="text-gold-foreground">TRADE</span>
            </h1>
            <p className="mt-2 text-base font-semibold text-primary-deep">Buy. Sell. Grow.</p>
          </motion.div>

          <motion.img
            src={splashArt}
            alt="Cattle, goat and hen in a green pasture"
            width={1024}
            height={768}
            loading="eager"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="mt-10 w-full flex-1 rounded-3xl object-cover px-0"
          />

          <div className="px-6 pb-12 pt-8 text-center">
            <p className="font-semibold text-foreground">Buy &amp; Sell Livestock Easily</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("brand.tagline")}</p>
            <div className="mx-auto mt-8 h-1 w-28 overflow-hidden rounded-full bg-primary-soft">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "0%" }}
                transition={{ duration: 1.6, ease: "easeInOut" }}
                className="h-full w-full rounded-full bg-primary"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
