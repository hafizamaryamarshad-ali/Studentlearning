import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRoundX } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { getCurrentAuth } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function MissingProfilePage() {
  const auth = await getCurrentAuth();
  if (!auth.user) redirect("/login?reason=session");
  if (auth.profile) redirect(auth.profile.role === "admin" ? "/admin" : "/student");

  return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><section className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/60 sm:p-12"><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-amber-700"><UserRoundX className="h-8 w-8" /></span><p className="mt-6 text-sm font-extrabold uppercase tracking-[.18em] text-amber-700">Profile unavailable</p><h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Your account needs attention.</h1><p className="mt-4 leading-7 text-slate-600">You are signed in, but your student profile could not be loaded. Please ask an administrator to check your account before continuing.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 font-bold text-slate-800">Return home</Link><LogoutButton compact className="min-h-11 border border-slate-300 px-5" /></div></section></main>;
}
