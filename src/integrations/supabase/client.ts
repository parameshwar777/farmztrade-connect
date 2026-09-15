import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL =
  import.meta.env["VITE_SUPABASE_URL"] ||
  (typeof process !== "undefined" && process.env ? process.env["SUPABASE_URL"] : undefined);

const SUPABASE_ANON_KEY =
  import.meta.env["VITE_SUPABASE_ANON_KEY"] ||
  import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
  (typeof process !== "undefined" && process.env ? process.env["SUPABASE_ANON_KEY"] : undefined);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.",
  );
}

// Detect if running inside Capacitor (Android/iOS native)
const isNative =
  typeof window !== "undefined" &&
  (window.location.protocol === "capacitor:" ||
    window.location.protocol === "ionic:");

export const supabase = createClient<Database>(
  SUPABASE_URL || "https://placeholder.supabase.co",
  SUPABASE_ANON_KEY || "placeholder-key",
  {
    auth: {
      storage: typeof window !== "undefined" ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
      // IMPORTANT: Must be false on Capacitor — file:// URLs cause auth to hang
      detectSessionInUrl: !isNative,
    },
  },
);

