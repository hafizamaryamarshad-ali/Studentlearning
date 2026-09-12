import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldX } from "lucide-react";
import { getCurrentAuth } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function UnauthorizedPage() {
  const auth = await getCurrentAuth();
  if (!auth.user) redirect("/login?reason=session");
  if (auth.profile?.role === "admin") redirect("/admin");

  return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><section className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/60 sm:p-12"><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-600"><ShieldX className="h-8 w-8" /></span><p className="mt-6 text-sm font-extrabold uppercase tracking-[.18em] text-red-600">Access denied</p><h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">This area is for administrators.</h1><p className="mt-4 leading-7 text-slate-600">Your account is signed in as a student and does not have permission to open the admin dashboard.</p><Link href="/student" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-6 font-extrabold text-white hover:bg-blue-700">Return to student dashboard</Link></section></main>;
}
