"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getFriendlyAuthError } from "@/lib/auth/messages";

const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();
    if (!fullName || !email || !form.password || !form.confirmPassword) return setError("Complete every field to create your account.");
    if (fullName.length > 120) return setError("Your full name must be 120 characters or fewer.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email address.");
    if (!strongPassword.test(form.password)) return setError("Use at least 8 characters with an uppercase letter, lowercase letter, and number.");
    if (form.password !== form.confirmPassword) return setError("The passwords do not match.");

    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (signUpError) {
        setError(getFriendlyAuthError(signUpError.message, signUpError.code));
        return;
      }
      if (data.user?.identities?.length === 0) {
        setError("An account with this email already exists. Try signing in instead.");
        return;
      }
      if (data.session) {
        router.replace("/student");
        router.refresh();
        return;
      }
      setSuccess("Check your email to confirm your account, then return here to sign in.");
      setForm({ fullName: "", email: "", password: "", confirmPassword: "" });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "";
      setError(
        message === "SUPABASE_NOT_CONFIGURED"
          ? "Authentication is not configured yet. Add the Supabase project URL and public key, then try again."
          : getFriendlyAuthError(message),
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900"><CheckCircle2 className="h-7 w-7 text-emerald-600" /><h2 className="mt-4 text-xl font-extrabold">Confirm your email</h2><p className="mt-2 leading-7">{success}</p><Link href="/login" className="mt-5 inline-flex font-extrabold text-emerald-800 hover:underline">Go to login</Link></div>;
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && <div role="alert" className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />{error}</div>}
      <div className="space-y-2"><Label htmlFor="fullName">Full name</Label><Input id="fullName" name="fullName" autoComplete="name" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} className="h-12 rounded-xl bg-white" placeholder="Your full name" required /></div>
      <div className="space-y-2"><Label htmlFor="signupEmail">Email address</Label><Input id="signupEmail" name="email" type="email" autoComplete="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="h-12 rounded-xl bg-white" placeholder="you@example.com" required /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="signupPassword">Password</Label><Input id="signupPassword" name="password" type="password" autoComplete="new-password" value={form.password} onChange={(e) => update("password", e.target.value)} className="h-12 rounded-xl bg-white" required /></div>
        <div className="space-y-2"><Label htmlFor="confirmPassword">Confirm password</Label><Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} className="h-12 rounded-xl bg-white" required /></div>
      </div>
      <p className="text-xs leading-5 text-slate-500">Use 8+ characters with uppercase, lowercase, and a number.</p>
      <Button type="submit" size="lg" className="h-12 w-full rounded-xl bg-blue-600 text-base font-extrabold hover:bg-blue-700" disabled={loading}>{loading && <LoaderCircle className="h-5 w-5 animate-spin" />}{loading ? "Creating account…" : "Create student account"}</Button>
      <p className="text-center text-sm text-slate-600">Already registered? <Link href="/login" className="font-extrabold text-blue-700 hover:underline">Login</Link></p>
    </form>
  );
}
