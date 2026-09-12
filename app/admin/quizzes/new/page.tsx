/* eslint-disable @next/next/no-assign-module-variable */
import Link from "next/link";
import { createQuiz } from "@/app/admin/quizzes/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { QuizForm, type LessonChoice } from "@/components/quizzes/quiz-form";
import { requireAdmin } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const errors: Record<string, string> = { invalid: "Add a title, valid lesson, and a passing percentage from 0 to 100.", save: "The quiz could not be saved. Please try again." };

export default async function NewQuizPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { profile } = await requireAdmin("/admin/quizzes/new");
  const { error } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const [{ data: courses }, { data: modules }, { data: lessons }] = await Promise.all([supabase.from("courses").select("*"), supabase.from("course_modules").select("*").order("sort_order"), supabase.from("lessons").select("*").order("sort_order")]);
  const courseMap = new Map((courses ?? []).map((item) => [item.id, item]));
  const moduleMap = new Map((modules ?? []).map((item) => [item.id, item]));
  const choices: LessonChoice[] = (lessons ?? []).flatMap((lesson) => { const module = moduleMap.get(lesson.module_id); const course = module ? courseMap.get(module.course_id) : undefined; return course && module ? [{ id: lesson.id, label: `${course.title} / ${module.title} / ${lesson.title}` }] : []; });
  return <DashboardShell admin eyebrow="Assessment management" title="Create a quiz" profile={profile}><Link href="/admin/quizzes" className="mb-6 inline-flex font-extrabold text-blue-700 hover:underline">← All quizzes</Link>{error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">{errors[error] ?? errors.save}</div>}{choices.length ? <QuizForm action={createQuiz} lessons={choices} /> : <Card className="p-8"><h2 className="text-xl font-extrabold">Add a lesson first</h2><p className="mt-2 text-slate-600">A quiz must belong to an existing course lesson.</p><Link href="/admin/courses" className="mt-5 inline-flex font-extrabold text-blue-700 hover:underline">Manage courses →</Link></Card>}</DashboardShell>;
}
