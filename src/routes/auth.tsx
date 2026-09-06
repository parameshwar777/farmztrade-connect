import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Phone, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BrandLockup } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { sendOtp, useAuth, verifyOtp } from "@/lib/auth";
import { isValidIndianMobile, normalisePhone } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — FARMZTRADE" },
      { name: "description", content: "Sign in to FARMZTRADE with your mobile number and a one-time password." },
      { property: "og:title", content: "Sign in — FARMZTRADE" },
      { property: "og:description", content: "Verify your mobile number to buy, sell and chat on FARMZTRADE." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [stage, setStage] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (loading || !user) return;
    navigate({ to: profile?.profile_complete ? "/home" : "/profile-setup", replace: true });
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = window.setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearInterval(id);
  }, [seconds]);

  async function requestOtp() {
    if (!isValidIndianMobile(phone)) {
      toast.error("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setBusy(true);
    try {
      await sendOtp(normalisePhone(phone));
      setStage("otp");
      setSeconds(45);
      toast.success("OTP sent to your mobile number.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send the OTP. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitOtp(value: string) {
    setBusy(true);
    try {
      await verifyOtp(normalisePhone(phone), value);
      toast.success("Mobile number verified.");
    } catch {
      toast.error(t("auth.invalid"));
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 py-8 safe-top safe-bottom">
      <div className="flex items-center gap-3">
        {stage === "otp" ? (
          <button
            onClick={() => setStage("phone")}
            aria-label={t("common.back")}
            className="grid h-10 w-10 place-items-center rounded-full bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <Link to="/home" aria-label="Home" className="grid h-10 w-10 place-items-center rounded-full bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        )}
        <BrandLockup />
      </div>

      <div className="flex flex-1 flex-col justify-center">
        <AnimatePresence mode="wait">
          {stage === "phone" ? (
            <motion.div
              key="phone"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="mx-auto w-full max-w-sm"
            >
              <div className="grid h-14 w-14 place-items-center rounded-3xl soft-gradient text-primary">
                <Phone className="h-6 w-6" />
              </div>
              <h1 className="mt-5 font-display text-2xl font-extrabold">{t("auth.welcome")}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We'll send a one-time password to confirm it's really you. No passwords to remember.
              </p>

              <div className="mt-7 space-y-2">
                <Label htmlFor="phone">{t("auth.mobile")}</Label>
                <div className="flex items-center gap-2 rounded-2xl border border-input bg-card px-4">
                  <span className="text-sm font-semibold text-muted-foreground">+91</span>
                  <Input
                    id="phone"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="98765 43210"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    onKeyDown={(e) => e.key === "Enter" && requestOtp()}
                    className="h-13 border-0 bg-transparent px-0 text-lg font-semibold tracking-wide focus-visible:ring-0"
                  />
                </div>
              </div>

              <Button onClick={requestOtp} disabled={busy} className="mt-6 h-13 w-full rounded-full text-base">
                {busy ? t("common.loading") : t("auth.getOtp")}
              </Button>

              <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
                By continuing you agree that FARMZTRADE connects buyers and sellers and does not take responsibility for
                transactions between parties.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="mx-auto w-full max-w-sm"
            >
              <div className="grid h-14 w-14 place-items-center rounded-3xl soft-gradient text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h1 className="mt-5 font-display text-2xl font-extrabold">{t("auth.verifyTitle")}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter the 6-digit code sent to <span className="font-semibold text-foreground">+91 {phone}</span>
              </p>

              <div className="mt-7 flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={(v) => {
                    setCode(v);
                    if (v.length === 6) void submitOtp(v);
                  }}
                >
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} className="h-13 w-11 rounded-2xl border text-lg font-bold" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                onClick={() => submitOtp(code)}
                disabled={busy || code.length < 6}
                className="mt-6 h-13 w-full rounded-full text-base"
              >
                {busy ? t("common.loading") : t("auth.verifyOtp")}
              </Button>

              <div className="mt-4 flex items-center justify-between text-sm">
                <button
                  onClick={() => setStage("phone")}
                  className="font-medium text-muted-foreground underline-offset-4 hover:underline"
                >
                  {t("auth.change")}
                </button>
                <button
                  onClick={requestOtp}
                  disabled={seconds > 0 || busy}
                  className="font-semibold text-primary disabled:text-muted-foreground"
                >
                  {seconds > 0 ? `${t("auth.resend")} (${seconds}s)` : t("auth.resend")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
