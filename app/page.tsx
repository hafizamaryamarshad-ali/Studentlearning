import Link from "next/link";
import { ArrowRight, Award, BookOpen, CheckCircle2, ShieldCheck, Sparkles, Target } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

const pathways = [
  { icon: BookOpen, step: "01", title: "Build Foundations", text: "Learn practical, career-ready skills through focused lessons and clear course pathways.", tone: "blue" },
  { icon: Target, step: "02", title: "Practice and Apply", text: "Strengthen your understanding with guided tasks, assessments, and real-world practice.", tone: "orange" },
  { icon: Award, step: "03", title: "Demonstrate Progress", text: "Track completed lessons and build credible evidence of what you can do.", tone: "green" },
];

const benefits = [
  { icon: BookOpen, title: "Structured Learning", text: "Move from modules to lessons in a clear sequence designed around genuine skill development." },
  { icon: ShieldCheck, title: "Trusted Achievements", text: "Your progress and future certificates can be tied to completed learning and verified assessment results." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <section className="relative overflow-hidden px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24">
          <div className="hero-grid absolute inset-0 -z-10" />
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.08fr_.92fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">
                <Sparkles className="h-4 w-4" /> Turn practical learning into real opportunity
              </div>
              <h1 className="max-w-3xl text-5xl font-black leading-[.98] tracking-[-.055em] text-slate-950 sm:text-6xl lg:text-7xl">
                Learn. Practice. <span className="text-blue-600">Progress.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                Build useful skills through structured courses, apply what you learn, and create a stronger path toward future opportunities.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/courses" size="lg">Explore Courses <ArrowRight className="h-5 w-5" /></ButtonLink>
                <ButtonLink href="#how-it-works" variant="secondary" size="lg">How It Works</ButtonLink>
              </div>
              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-600">
                {["Practical learning", "Performance-based progress", "Trusted achievements"].map((item) => (
                  <span key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{item}</span>
                ))}
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[500px]">
              <div className="absolute -inset-5 -z-10 rotate-3 rounded-[2.5rem] bg-blue-100" />
              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_30px_80px_rgba(30,64,175,.16)] sm:p-7">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-bold text-slate-500">YOUR LEARNING WEEK</p><p className="mt-1 text-xl font-extrabold text-slate-950">Keep the momentum going</p></div>
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700"><Award className="h-6 w-6" /></span>
                </div>
                <div className="mt-7 rounded-2xl bg-slate-950 p-6 text-white">
                  <div className="flex items-end justify-between"><div><p className="text-sm text-slate-300">Course progress</p><p className="mt-1 text-lg font-bold">Digital Skills Essentials</p></div><strong className="text-2xl">68%</strong></div>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full w-[68%] rounded-full bg-blue-400" /></div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[["8","Lessons"],["3","Modules"],["68%","Progress"]].map(([value,label]) => <div key={label} className="rounded-2xl bg-slate-50 p-4 text-center"><p className="text-xl font-black text-slate-950">{value}</p><p className="mt-1 text-xs font-bold text-slate-500">{label}</p></div>)}
                </div>
                <Link href="/student" className="mt-5 flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 p-4 font-bold text-blue-700 transition hover:bg-blue-100">
                  Preview student dashboard <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section id="how-it-works" className="bg-slate-950 px-5 py-20 text-white sm:px-8 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl"><p className="eyebrow text-blue-400">HOW IT WORKS</p><h2 className="section-title text-white">Build skills that lead somewhere.</h2><p className="section-copy text-slate-300">A clear path helps you focus on progress, not guesswork.</p></div>
            <div id="pathway" className="mt-12 grid gap-5 md:grid-cols-3">
              {pathways.map(({ icon: Icon, step, title, text, tone }) => (
                <Card key={title} className="group relative overflow-hidden border-white/10 bg-white/[.06] p-7 text-white backdrop-blur">
                  <span className="absolute right-5 top-3 text-6xl font-black text-white/[.06]">{step}</span>
                  <div className={`icon-box ${tone}`}><Icon className="h-6 w-6" /></div>
                  <h3 className="mt-6 text-xl font-extrabold">{title}</h3><p className="mt-3 leading-7 text-slate-300">{text}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
        <section className="px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-5 md:grid-cols-2">
              {benefits.map(({ icon: Icon, title, text }) => (
                <Card key={title} className="flex gap-5 p-7 sm:p-8"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white"><Icon className="h-6 w-6" /></div><div><h3 className="text-xl font-extrabold text-slate-950">{title}</h3><p className="mt-2 leading-7 text-slate-600">{text}</p></div></Card>
              ))}
            </div>
            <div className="mt-16 rounded-[2rem] bg-blue-600 px-7 py-10 text-white sm:px-12 sm:py-12 md:flex md:items-center md:justify-between">
              <div><p className="text-sm font-bold uppercase tracking-[.18em] text-blue-100">Start with one skill</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Choose a course and begin learning.</h2></div>
              <ButtonLink href="/courses" variant="light" size="lg" className="mt-7 md:mt-0">Explore Courses <ArrowRight className="h-5 w-5" /></ButtonLink>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
