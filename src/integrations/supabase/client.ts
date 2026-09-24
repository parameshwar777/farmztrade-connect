import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { brokeredPreviewStorage } from "./previewAuthStorage";

const HARDCODED_URL = "https://gpyxobrenfgdbkctfpye.supabase.co";
const HARDCODED_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdweXhvYnJlbmZnZGJrY3RmcHllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MDAyMjMsImV4cCI6MjEwNDI3NjIyM30.EyM8q-VujyrPGVo_mJXU_XlM8RQqGv13z-6W405Jvd0";

const rawUrl = import.meta.env["VITE_SUPABASE_URL"] || "";
const SUPABASE_URL =
  !rawUrl || rawUrl.includes("lovable.cloud") || rawUrl.includes("placeholder")
    ? HARDCODED_URL
    : rawUrl;

const rawKey = import.meta.env["VITE_SUPABASE_ANON_KEY"] || import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || "";
const SUPABASE_ANON_KEY =
  !rawKey || rawKey.startsWith("sb_publishable") || rawKey.includes("placeholder")
    ? HARDCODED_KEY
    : rawKey;

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
      storage: brokeredPreviewStorage(),
      persistSession: true,
      autoRefreshToken: true,
      // IMPORTANT: Must be false on Capacitor — file:// URLs cause auth to hang
      detectSessionInUrl: !isNative,
    },
  },
);

