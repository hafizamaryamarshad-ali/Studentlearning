import { Mail, ShieldCheck, UserRound } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { requireStudent } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { profile } = await requireStudent("/profile");
  return <DashboardShell eyebrow="Your profile" title="Account details" profile={profile}><Card className="max-w-2xl p-6 sm:p-8"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-100 text-blue-700"><UserRound className="h-7 w-7" /></span><dl className="mt-7 grid gap-6 sm:grid-cols-2"><div><dt className="text-sm font-bold text-slate-500">Full name</dt><dd className="mt-1 text-lg font-extrabold text-slate-950">{profile.full_name}</dd></div><div><dt className="text-sm font-bold text-slate-500">Account role</dt><dd className="mt-1 flex items-center gap-2 text-lg font-extrabold capitalize text-slate-950"><ShieldCheck className="h-5 w-5 text-blue-600" />{profile.role}</dd></div><div className="sm:col-span-2"><dt className="text-sm font-bold text-slate-500">Email address</dt><dd className="mt-1 flex items-center gap-2 text-lg font-extrabold text-slate-950"><Mail className="h-5 w-5 text-blue-600" />{profile.email}</dd></div></dl><p className="mt-8 border-t border-slate-200 pt-6 text-sm leading-6 text-slate-500">Profile editing will be added in a later phase. Your role cannot be changed from the browser.</p></Card></DashboardShell>;
}
