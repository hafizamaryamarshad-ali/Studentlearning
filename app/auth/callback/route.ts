import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  if (!isSupabaseConfigured() || !code) {
    return NextResponse.redirect(new URL("/login?reason=callback", request.url));
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL("/login?reason=callback", request.url));
    return NextResponse.redirect(new URL("/student", request.url));
  } catch {
    return NextResponse.redirect(new URL("/login?reason=callback", request.url));
  }
}
