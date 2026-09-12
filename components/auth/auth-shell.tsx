import Link from "next/link";
import { CheckCircle2, GraduationCap, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

export function AuthShell({ eyebrow, title, description, children }: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,.1)] sm:min-h-[calc(100vh-4rem)] lg:grid-cols-[.85fr_1.15fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="auth-grid absolute inset-0 opacity-30" />
          <Link href="/" className="relative flex items-center gap-2.5 text-xl font-black">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600"><GraduationCap className="h-6 w-6" /></span>
            SkillSpring
          </Link>
          <div className="relative">
            <p className="text-sm font-extrabold uppercase tracking-[.18em] text-blue-400">Your learning space</p>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight">One secure account for every step forward.</h2>
            <div className="mt-8 space-y-4 text-slate-300">
              {["Continue where you left off", "Keep achievements tied to you", "Access only the tools for your role"].map((item) => (
                <p key={item} className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-teal-400" />{item}</p>
              ))}
            </div>
          </div>
          <p className="relative flex items-center gap-2 text-sm text-slate-400"><ShieldCheck className="h-4 w-4" />Protected by Supabase Auth and database access rules</p>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-10 flex items-center gap-2.5 text-xl font-black text-slate-950 lg:hidden">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white"><GraduationCap className="h-6 w-6" /></span>
              SkillSpring
            </Link>
            <p className="text-sm font-extrabold uppercase tracking-[.18em] text-blue-600">{eyebrow}</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
            <p className="mt-3 leading-7 text-slate-600">{description}</p>
            <div className="mt-8">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
