"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";
import type { Database } from "./types";

let browserClient: SupabaseClient<Database> | undefined;

export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  const { url, anonKey } = getSupabaseConfig();
  browserClient ??= createBrowserClient<Database>(url, anonKey);
  return browserClient;
}
