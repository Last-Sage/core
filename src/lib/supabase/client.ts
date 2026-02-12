"use client";

import { createBrowserClient } from "@supabase/ssr";

function validateEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    // Only warn in browser, silently return empty during SSG
    if (typeof window !== "undefined") {
      console.warn("[Supabase] Missing credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
    }
    return { url: "", key: "" };
  }
  
  return { url, key };
}

export function createClient() {
  const { url, key } = validateEnv();
  if (!url || !key) {
    // Return a mock client that throws on use (only happens on client-side)
    return null as unknown as ReturnType<typeof createBrowserClient>;
  }
  return createBrowserClient(url, key);
}

// Singleton for client-side usage
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  // Don't throw during SSG/SSR - return null and let hooks handle it
  if (typeof window === "undefined") {
    return null as unknown as ReturnType<typeof createBrowserClient>;
  }
  
  if (!browserClient) {
    browserClient = createClient();
  }
  if (!browserClient) {
    throw new Error("Supabase client not configured. Check your environment variables.");
  }
  return browserClient;
}


