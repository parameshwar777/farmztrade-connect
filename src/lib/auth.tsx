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

export async function sendOtp(phone: string) {
  return supabase.auth.signInWithOtp({ phone, options: { channel: "sms" } });
}

export async function verifyOtp(phone: string, token: string) {
  return supabase.auth.verifyOtp({ phone, token, type: "sms" });
}
