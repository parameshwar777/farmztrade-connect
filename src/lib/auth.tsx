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
    const currentProf = prof as Profile | null;
    setProfile(currentProf ?? null);
    
    // Check admin by role OR by admin phone number 9440229378
    const hasAdminRole = Boolean(roles?.some((r) => r.role === "admin"));
    const isAdminPhone = Boolean(currentProf?.phone?.includes("9440229378"));
    setIsAdmin(hasAdminRole || isAdminPhone);
  }, []);

  const checkLocalAuth = useCallback(async () => {
    const savedUid = typeof window !== "undefined" ? localStorage.getItem("farmztrade_user_id") : null;
    if (savedUid) {
      const mockSession = {
        access_token: "local-session-token",
        token_type: "bearer",
        expires_in: 3600000,
        refresh_token: "mock-refresh",
        user: { id: savedUid, phone: "" } as unknown as User,
      } as Session;
      setSession(mockSession);
      await load(savedUid);
      setLoading(false);
      return true;
    }
    return false;
  }, [load]);

  useEffect(() => {
    let active = true;

    void checkLocalAuth().then((hasLocal) => {
      if (hasLocal || !active) return;
      supabase.auth.getSession().then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setLoading(false);
        void load(data.session?.user.id);
      });
    });

    const handleAuthChange = () => {
      void checkLocalAuth();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("farmztrade_auth_change", handleAuthChange);
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (!active) return;
      const savedUid = typeof window !== "undefined" ? localStorage.getItem("farmztrade_user_id") : null;
      if (!savedUid) {
        setSession(next);
        if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
          void load(next?.user.id);
          if (event === "SIGNED_OUT") {
            queryClient.clear();
          } else {
            void queryClient.invalidateQueries();
          }
        }
      }
    });

    return () => {
      active = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("farmztrade_auth_change", handleAuthChange);
      }
      sub.subscription.unsubscribe();
    };
  }, [checkLocalAuth, load, queryClient]);

  const refreshProfile = useCallback(async () => {
    const savedUid = typeof window !== "undefined" ? localStorage.getItem("farmztrade_user_id") : null;
    await load(savedUid || session?.user.id);
  }, [load, session?.user.id]);

  const signOut = useCallback(async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("farmztrade_user_id");
    }
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    setSession(null);
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

export const OTP_TEST_MODE = import.meta.env["VITE_OTP_TEST_MODE"] !== "false";
export const TEST_OTP = import.meta.env["VITE_TEST_OTP"] || "123456";

export async function sendOtp(phone: string) {
  if (OTP_TEST_MODE) return { data: null, error: null };
  return supabase.auth.signInWithOtp({ phone, options: { channel: "sms" } });
}

export async function verifyOtp(phone: string, token: string) {
  if (OTP_TEST_MODE) {
    if (token !== TEST_OTP) throw new Error("Invalid code. Use 123456");
    
    const digits = phone.replace(/\D/g, "").slice(-10);
    const isAdminNum = digits === "9440229378";
    
    // Find or create profile for this phone number directly in Supabase
    const { data: profiles } = await supabase.from("profiles").select("*");
    let match = profiles?.find((p) => p.phone && p.phone.replace(/\D/g, "").slice(-10) === digits);
    
    if (!match) {
      const newId = crypto.randomUUID();
      const { data: newProfile } = await supabase
        .from("profiles")
        .insert({
          id: newId,
          phone: phone,
          full_name: isAdminNum ? "Parameswar (Admin)" : "",
          city: isAdminNum ? "Hyderabad" : "",
          district: isAdminNum ? "Hyderabad" : "",
          state: "Andhra Pradesh",
          profile_complete: true,
        })
        .select()
        .maybeSingle();
        
      match = newProfile ?? ({ id: newId, phone, full_name: isAdminNum ? "Parameswar (Admin)" : "", profile_complete: true } as Profile);
      
      // Auto-assign roles
      await supabase.from("user_roles").insert({ user_id: newId, role: "user" });
      if (isAdminNum) {
        await supabase.from("user_roles").insert({ user_id: newId, role: "admin" });
      }
    } else {
      // Ensure admin profile has profile_complete: true
      if (isAdminNum || !match.profile_complete) {
        await supabase
          .from("profiles")
          .update({
            profile_complete: true,
            ...(isAdminNum && !match.full_name ? { full_name: "Parameswar (Admin)" } : {}),
          })
          .eq("id", match.id);
        match.profile_complete = true;
      }
      if (isAdminNum) {
        const { data: roles } = await supabase.from("user_roles").select("*").eq("user_id", match.id);
        if (!roles?.some((r) => r.role === "admin")) {
          await supabase.from("user_roles").insert({ user_id: match.id, role: "admin" });
        }
      }
    }
    
    if (match?.id && typeof window !== "undefined") {
      localStorage.setItem("farmztrade_user_id", match.id);
      window.dispatchEvent(new Event("farmztrade_auth_change"));
    }
    
    return { data: { user: { id: match?.id } }, error: null };
  }
  return supabase.auth.verifyOtp({ phone, token, type: "sms" });
}


