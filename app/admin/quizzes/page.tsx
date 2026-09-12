/* eslint-disable @next/next/no-assign-module-variable */
import Link from "next/link";
import { ClipboardCheck, Pencil, Plus } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminQuizzesPage() {
  const { profile } = await requireAdmin("/admin/quizzes");
  const supabase = await createServerSupabaseClient();
  const [{ data: quizzes, error }, { data: lessons }, { data: modules }, { data: courses }] = await Promise.all([
    supabase.from("quizzes").select("*").order("updated_at", { ascending: false }),
    supabase.from("lessons").select("*"), supabase.from("course_modules").select("*"), supabase.from("courses").select("*"),
  ]);
  const lessonMap = new Map((lessons ?? []).map((item) => [item.id, item]));
  const moduleMap = new Map((modules ?? []).map((item) => [item.id, item]));
  const courseMap = new Map((courses ?? []).map((item) => [item.id, item]));

  return <DashboardShell admin eyebrow="Assessment management" title="Quizzes" profile={profile}>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><p className="max-w-2xl leading-7 text-slate-600">Build multiple-choice assessments, set the passing mark, and publish only when every question is ready.</p><Link href="/admin/quizzes/new" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 font-extrabold text-white hover:bg-blue-700"><Plus className="h-5 w-5" />New quiz</Link></div>
    {error ? <Card className="border-red-200 bg-red-50 p-6 text-red-900">Quizzes could not be loaded. Please try again.</Card> : !quizzes?.length ? <Card className="p-10 text-center"><ClipboardCheck className="mx-auto h-10 w-10 text-slate-400" /><h2 className="mt-4 text-xl font-extrabold">No quizzes yet</h2><p className="mt-2 text-slate-600">Create a draft quiz and attach it to an existing lesson.</p></Card> : <div className="space-y-4">{quizzes.map((quiz) => { const lesson = lessonMap.get(quiz.lesson_id); const module = lesson ? moduleMap.get(lesson.module_id) : undefined; const course = module ? courseMap.get(module.course_id) : undefined; return <Card key={quiz.id} className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-extrabold">{quiz.title}</h2><span className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${quiz.is_published ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{quiz.is_published ? "Published" : "Draft"}</span></div><p className="mt-2 text-slate-600">{course?.title ?? "Course unavailable"} · {lesson?.title ?? "Lesson unavailable"}</p><p className="mt-2 text-sm font-bold text-slate-500">Pass mark: {quiz.passing_score}%</p></div><Link href={`/admin/quizzes/${quiz.id}/edit`} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 font-extrabold text-slate-800 hover:bg-slate-50"><Pencil className="h-4 w-4" />Manage</Link></Card>; })}</div>}
  </DashboardShell>;
}
