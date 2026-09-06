import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { HandCoins, MessagesSquare, Wheat } from "lucide-react";
import { useState } from "react";

import { BrandWordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { useI18n, type TKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Getting started — FARMZTRADE" },
      { name: "description", content: "See how FARMZTRADE helps you buy, sell and care for livestock." },
      { property: "og:title", content: "Getting started — FARMZTRADE" },
      { property: "og:description", content: "Buy and sell livestock, chat with sellers and shop quality feed." },
    ],
  }),
  component: Onboarding,
});

const slides: { icon: typeof HandCoins; title: TKey; body: TKey }[] = [
  { icon: HandCoins, title: "onboard.1.title", body: "onboard.1.body" },
  { icon: MessagesSquare, title: "onboard.2.title", body: "onboard.2.body" },
  { icon: Wheat, title: "onboard.3.title", body: "onboard.3.body" },
];

function Onboarding() {
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const slide = slides[step];
  const Icon = slide.icon;

  function finish() {
    window.localStorage.setItem("farmztrade.onboarded", "1");
    navigate({ to: "/home", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 py-8 safe-top safe-bottom">
      <div className="flex items-center justify-between">
        <BrandWordmark size="sm" />
        <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
          {(["en", "te"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {l === "en" ? "English" : "తెలుగు"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="max-w-sm"
          >
            <div className="mx-auto grid h-40 w-40 place-items-center rounded-4xl soft-gradient text-primary card-shadow">
              <Icon className="h-16 w-16" strokeWidth={1.6} />
            </div>
            <h1 className="mt-8 font-display text-2xl font-extrabold leading-snug">{t(slide.title)}</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{t(slide.body)}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 flex items-center gap-2">
          {slides.map((s, i) => (
            <span
              key={s.title}
              className={cn(
                "h-2 rounded-full transition-all",
                i === step ? "w-7 bg-primary" : "w-2 bg-border",
              )}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Button
          className="h-13 w-full rounded-full text-base"
          onClick={() => (step === slides.length - 1 ? finish() : setStep(step + 1))}
        >
          {step === slides.length - 1 ? t("common.getStarted") : t("common.next")}
        </Button>
        <Button variant="ghost" className="h-11 w-full rounded-full text-muted-foreground" onClick={finish}>
          {t("common.skip")}
        </Button>
      </div>
    </div>
  );
}
