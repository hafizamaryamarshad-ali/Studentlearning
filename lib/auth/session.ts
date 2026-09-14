import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/supabase/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AuthState = {
  configured: boolean;
  user: User | null;
  profile: Profile | null;
  profileMissing: boolean;
};

export const getCurrentAuth = cache(async (): Promise<AuthState> => {
  if (!isSupabaseConfigured()) {
    return { configured: false, user: null, profile: null, profileMissing: false };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { configured: true, user: null, profile: null, profileMissing: false };
    }

    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    return {
      configured: true,
      user,
      profile: profileError ? null : data,
      profileMissing: Boolean(profileError || !data),
    };
  } catch {
    return { configured: true, user: null, profile: null, profileMissing: false };
  }
});

async function requireProfile(returnTo: string) {
  const auth = await getCurrentAuth();
  if (!auth.configured) redirect("/login?reason=configuration");
  if (!auth.user) redirect(`/login?reason=session&next=${encodeURIComponent(returnTo)}`);
  if (!auth.profile || auth.profileMissing) redirect("/auth/profile-missing");
  return { user: auth.user, profile: auth.profile };
}

export async function requireStudent(returnTo = "/student") {
  const auth = await getCurrentAuth();
  if (!auth.configured) redirect("/login?reason=configuration");
  if (!auth.user) redirect(`/learn?next=${encodeURIComponent(returnTo)}`);
  if (!auth.profile || auth.profileMissing) redirect("/auth/profile-missing");
  if (auth.profile.role !== "student") redirect("/admin");
  return { user: auth.user, profile: auth.profile };
}

export async function requireAdmin(returnTo = "/admin") {
  const auth = await requireProfile(returnTo);
  if (auth.profile.role !== "admin") redirect("/unauthorized");
  return auth;
}
