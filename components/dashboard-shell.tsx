import Link from "next/link";
import { BookOpen, GraduationCap, Home, ShieldCheck, Trophy, Users, WalletCards } from "lucide-react";
import { ReactNode } from "react";
import type { Profile } from "@/lib/supabase/types";
import { LogoutButton } from "@/components/auth/logout-button";

export function DashboardShell({ title, eyebrow, children, profile, admin = false }: {
  title: string;
  eyebrow: string;
  children: ReactNode;
  profile: Profile;
  admin?: boolean;
}) {
  const initial = profile.full_name.trim().charAt(0).toUpperCase() || "S";
  const adminPlaceholders = [
    [Trophy, "Challenges"],
    [WalletCards, "Payments"], [ShieldCheck, "Withdrawals"],
  ] as const;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-17 max-w-[1440px] items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Link href="/" className="flex items-center gap-2 font-black"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white"><GraduationCap className="h-5 w-5" /></span>SkillSpring</Link>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block"><p className="text-sm font-extrabold">{profile.full_name}</p><p className="text-xs text-slate-500">{profile.email}</p></div>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 font-black text-blue-700" aria-hidden="true">{initial}</span>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1440px] md:grid-cols-[250px_1fr]">
        <aside className="hidden min-h-[calc(100vh-68px)] border-r border-slate-200 bg-white p-5 md:flex md:flex-col">
          <p className="px-3 text-xs font-extrabold uppercase tracking-widest text-slate-400">{admin ? "Admin workspace" : "Student space"}</p>
          <nav className="mt-4 flex-1 space-y-1" aria-label={admin ? "Admin navigation" : "Student navigation"}>
            <Link href={admin ? "/admin" : "/student"} className="flex items-center gap-3 rounded-xl bg-blue-50 px-3 py-3 text-sm font-bold text-blue-700"><Home className="h-5 w-5" />Dashboard</Link>
            {admin ? <><Link href="/admin/courses" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"><BookOpen className="h-5 w-5" />Courses</Link><Link href="/admin/students" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"><Users className="h-5 w-5" />Students</Link>{adminPlaceholders.map(([Icon, label]) => <span key={label} title="Coming later" className="flex cursor-not-allowed items-center justify-between rounded-xl px-3 py-3 text-sm font-bold text-slate-400"><span className="flex items-center gap-3"><Icon className="h-5 w-5" />{label}</span><small className="text-[10px] uppercase">Soon</small></span>)}</> : (
              <>
                <Link href="/courses" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"><BookOpen className="h-5 w-5" />Courses</Link>
                <Link href="/profile" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"><Users className="h-5 w-5" />Profile</Link>
              </>
            )}
          </nav>
          <div className="border-t border-slate-200 pt-3"><LogoutButton /></div>
        </aside>
        <main className="min-w-0 p-5 sm:p-8 lg:p-10">
          <div className="mx-auto max-w-5xl"><p className="text-sm font-extrabold uppercase tracking-[.16em] text-blue-600">{eyebrow}</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1><div className="mt-4 flex gap-3 overflow-x-auto pb-1 md:hidden"><Link href={admin ? "/admin" : "/student"} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white">Dashboard</Link><Link href={admin ? "/admin/courses" : "/courses"} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700">Courses</Link>{admin ? <Link href="/admin/students" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700">Students</Link> : <Link href="/profile" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700">Profile</Link>}<LogoutButton compact className="rounded-full bg-white" /></div><div className="mt-8">{children}</div></div>
        </main>
      </div>
    </div>
  );
}
