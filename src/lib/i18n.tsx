import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * Minimal translation layer. Every user-facing string goes through t("key"),
 * so Telugu (or any other language) can be completed without touching UI code.
 */

export type Lang = "en" | "te";

const en = {
  "brand.name": "FARMZTRADE",
  "brand.tagline": "Better Care. Better Growth. Better Tomorrow.",
  "brand.short": "Buy. Sell. Grow.",
  "nav.home": "Home",
  "nav.search": "Search",
  "nav.feed": "Feed",
  "nav.sell": "Sell",
  "nav.profile": "Profile",
  "common.next": "Next",
  "common.skip": "Skip",
  "common.getStarted": "Get Started",
  "common.continue": "Continue",
  "common.back": "Back",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.retry": "Try again",
  "common.loading": "Loading…",
  "common.viewAll": "View all",
  "common.error": "Something went wrong. Please try again.",
  "common.optional": "Optional",
  "common.language": "Language",
  "onboard.1.title": "Buy & Sell Livestock Easily",
  "onboard.1.body": "Find genuine animals from verified sellers near you.",
  "onboard.2.title": "Connect Directly",
  "onboard.2.body": "Chat with sellers, make offers and arrange a meeting.",
  "onboard.3.title": "Everything Your Animals Need",
  "onboard.3.body": "Buy quality livestock and pet food from the FARMZTRADE Feed store.",
  "auth.welcome": "Welcome to FARMZTRADE",
  "auth.mobile": "Mobile Number",
  "auth.getOtp": "Get OTP",
  "auth.verifyTitle": "Verify your number",
  "auth.verifyOtp": "Verify OTP",
  "auth.resend": "Resend OTP",
  "auth.change": "Change Number",
  "auth.invalid": "That code doesn't look right. Please check and try again.",
  "auth.pending.title": "Your account is being verified",
  "auth.pending.body":
    "FARMZTRADE verifies every seller to help keep our marketplace trustworthy. You will be notified once approved.",
  "home.hero.title": "Find the right animal for your farm",
  "home.hero.body": "Trusted sellers. Better choices.",
  "home.buy": "Buy Animals",
  "home.sell": "Sell an Animal",
  "home.shop": "Shop Feed",
  "home.categories": "Browse by animal",
  "home.featured": "Featured Animals",
  "home.recent": "Recently Added",
  "home.popular": "Popular Near You",
  "home.sellers": "Verified Sellers",
  "search.placeholder": "Search animals, breeds, locations…",
  "search.filters": "Filters",
  "search.results": "Results",
  "empty.animals.title": "No animals found",
  "empty.animals.body": "Try changing your filters.",
  "empty.favorites.title": "No favorites yet",
  "empty.favorites.body": "Your favorites will appear here.",
  "empty.messages.title": "No messages yet",
  "empty.messages.body": "Start a conversation with a seller.",
  "empty.orders.title": "No orders yet",
  "empty.orders.body": "You haven't placed any feed orders yet.",
  "badge.verified": "Verified Seller",
  "badge.approved": "Admin Approved",
  "badge.popular": "Popular",
  "trust.disclaimer":
    "FARMZTRADE connects buyers and sellers. We do not take responsibility for transactions between parties.",
  "feed.title": "FARMZTRADE Feed",
  "feed.subtitle": "Quality nutrition for healthier animals.",
  "feed.addToCart": "Add to Cart",
  "feed.buyNow": "Buy Now",
  "feed.checkout": "Proceed to Checkout",
  "offer.make": "Make Offer",
  "offer.your": "Your Offer Price",
  "offer.send": "Send Offer",
  "chat.with": "Chat with Seller",
  "cart.interested": "Add to Interested",
};

/** Telugu strings; missing keys fall back to English automatically. */
const te: Partial<Record<keyof typeof en, string>> = {
  "brand.tagline": "మంచి సంరక్షణ. మంచి పెరుగుదల. మంచి భవిష్యత్తు.",
  "brand.short": "కొనండి. అమ్మండి. ఎదగండి.",
  "nav.home": "హోమ్",
  "nav.search": "వెతకండి",
  "nav.feed": "దాణా",
  "nav.sell": "అమ్మండి",
  "nav.profile": "ప్రొఫైల్",
  "common.next": "తరువాత",
  "common.skip": "దాటవేయి",
  "common.getStarted": "ప్రారంభించండి",
  "common.continue": "కొనసాగించు",
  "common.retry": "మళ్లీ ప్రయత్నించండి",
  "common.viewAll": "అన్నీ చూడండి",
  "common.language": "భాష",
  "onboard.1.title": "పశువులను సులభంగా కొనండి, అమ్మండి",
  "onboard.1.body": "మీ దగ్గరలోని నమ్మకమైన అమ్మకందారుల నుంచి జంతువులను కనుగొనండి.",
  "onboard.2.title": "నేరుగా మాట్లాడండి",
  "onboard.2.body": "అమ్మకందారుతో చాట్ చేయండి, ధర చెప్పండి, కలవడానికి ఏర్పాటు చేసుకోండి.",
  "onboard.3.title": "మీ జంతువులకు కావాల్సినవన్నీ",
  "onboard.3.body": "ఫార్మ్‌జ్‌ట్రేడ్ ఫీడ్ స్టోర్‌లో నాణ్యమైన దాణా కొనండి.",
  "auth.welcome": "ఫార్మ్‌జ్‌ట్రేడ్‌కు స్వాగతం",
  "auth.mobile": "మొబైల్ నంబర్",
  "auth.getOtp": "OTP పొందండి",
  "auth.verifyTitle": "మీ నంబర్‌ను ధృవీకరించండి",
  "auth.verifyOtp": "OTP ధృవీకరించండి",
  "auth.resend": "OTP మళ్లీ పంపండి",
  "auth.change": "నంబర్ మార్చండి",
  "auth.pending.title": "మీ ఖాతా ధృవీకరణలో ఉంది",
  "home.hero.title": "మీ పొలానికి సరైన జంతువును కనుగొనండి",
  "home.hero.body": "నమ్మకమైన అమ్మకందారులు. మంచి ఎంపికలు.",
  "home.buy": "జంతువులు కొనండి",
  "home.sell": "జంతువును అమ్మండి",
  "home.shop": "దాణా కొనండి",
  "home.categories": "జంతువు ప్రకారం చూడండి",
  "home.featured": "ప్రత్యేక జంతువులు",
  "search.placeholder": "జంతువులు, జాతులు, ప్రాంతాలు వెతకండి…",
  "badge.verified": "ధృవీకరించిన అమ్మకందారు",
  "feed.subtitle": "ఆరోగ్యకరమైన జంతువుల కోసం నాణ్యమైన పోషణ.",
  "feed.addToCart": "కార్ట్‌లో చేర్చండి",
  "offer.make": "ధర చెప్పండి",
  "chat.with": "అమ్మకందారుతో చాట్",
};

export type TKey = keyof typeof en;

const dictionaries: Record<Lang, Partial<Record<TKey, string>>> = { en, te };

type I18nValue = { lang: Lang; setLang: (l: Lang) => void; t: (key: TKey) => string };

const I18nContext = createContext<I18nValue>({ lang: "en", setLang: () => {}, t: (k) => en[k] });

const STORAGE_KEY = "farmztrade.lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "te" || saved === "en") setLangState(saved);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const t = useCallback((key: TKey) => dictionaries[lang][key] ?? en[key] ?? String(key), [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
