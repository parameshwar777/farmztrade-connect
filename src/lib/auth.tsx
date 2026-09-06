import { useQueryClient } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/lib/api";

type AuthValue = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isVerified: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue>({
  loading: true,
  session: null,
  user: null,
  profile: null,
  isAdmin: false,
  isVerified: false,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (uid: string | undefined) => {
    if (!uid) {
      setProfile(null);
      setIsAdmin(false);
      return;
    }
    const [{ data: prof }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    setProfile((prof as Profile) ?? null);
    setIsAdmin(Boolean(roles?.some((r) => r.role === "admin")));
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await load(data.session?.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (!active) return;
      setSession(next);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void load(next?.user.id);
        if (event === "SIGNED_OUT") {
          queryClient.clear();
        } else {
          void queryClient.invalidateQueries();
        }
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [load, queryClient]);

  const refreshProfile = useCallback(async () => {
    await load(session?.user.id);
  }, [load, session?.user.id]);

  const signOut = useCallback(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    setProfile(null);
    setIsAdmin(false);
  }, [queryClient]);

  const value = useMemo<AuthValue>(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      profile,
      isAdmin,
      isVerified: profile?.verification === "approved",
      refreshProfile,
      signOut,
    }),
    [loading, session, profile, isAdmin, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

/* ---------- OTP helpers ---------- */

/**
 * TESTING BYPASS: while true, no real SMS is sent and the OTP is always 123456.
 * Set to false to switch back to real phone OTP.
 */
export const OTP_TEST_MODE = true;
export const TEST_OTP = "123456";

function testCredentials(phone: string) {
  const digits = phone.replace(/\D/g, "").slice(-10);
  return {
    email: `p${digits}@farmztrade.test`,
    password: `Farmztrade!${digits}`,
  };
}

export async function sendOtp(phone: string) {
  if (OTP_TEST_MODE) return { data: null, error: null };
  return supabase.auth.signInWithOtp({ phone, options: { channel: "sms" } });
}

export async function verifyOtp(phone: string, token: string) {
  if (OTP_TEST_MODE) {
    if (token !== TEST_OTP) throw new Error("Invalid code");
    const { email, password } = testCredentials(phone);
    const signIn = await supabase.auth.signInWithPassword({ email, password });
    if (!signIn.error) return signIn;
    const signUp = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: "", phone } },
    });
    if (signUp.error) throw signUp.error;
    if (!signUp.data.session) {
      const retry = await supabase.auth.signInWithPassword({ email, password });
      if (retry.error) throw retry.error;
      return retry;
    }
    return signUp;
  }
  return supabase.auth.verifyOtp({ phone, token, type: "sms" });
}
