"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getFriendlyAuthError, safeNextPath } from "@/lib/auth/messages";

export function LoginForm({ nextPath = "/student", notice }: { nextPath?: string; notice?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Enter both your email and password.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) {
        setError(getFriendlyAuthError(signInError.message, signInError.code));
        return;
      }
      const { data: profile } = data.user
        ? await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle()
        : { data: null };
      const destination = !profile
        ? "/auth/profile-missing"
        : profile.role === "admin"
          ? "/admin"
          : safeNextPath(nextPath);
      router.replace(destination);
      router.refresh();
    } catch {
      setError("Authentication is not configured yet. Add the Supabase project URL and anon key, then try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {notice && <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-800">{notice}</div>}
      {error && <div role="alert" className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />{error}</div>}
      <div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl bg-white" placeholder="you@example.com" required /></div>
      <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="password">Password</Label><span className="text-xs font-semibold text-slate-400">Case-sensitive</span></div><Input id="password" name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl bg-white" placeholder="Enter your password" required /></div>
      <Button type="submit" size="lg" className="h-12 w-full rounded-xl bg-blue-600 text-base font-extrabold hover:bg-blue-700" disabled={loading}>{loading && <LoaderCircle className="h-5 w-5 animate-spin" />}{loading ? "Signing in…" : "Login"}</Button>
      <p className="text-center text-sm text-slate-600">New to SkillSpring? <Link href="/signup" className="font-extrabold text-blue-700 hover:underline">Create an account</Link></p>
    </form>
  );
}
