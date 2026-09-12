import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Circle, ClipboardCheck, ExternalLink } from "lucide-react";
import { markLessonComplete } from "@/app/courses/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { requireStudent } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LessonPage({ params, searchParams }: { params: Promise<{ slug: string; lessonId: string }>; searchParams: Promise<{ notice?: string; error?: string }> }) {
  const { slug, lessonId } = await params;
  const query = await searchParams;
  const { profile } = await requireStudent(`/courses/${slug}/lessons/${lessonId}`);
  const supabase = await createServerSupabaseClient();
  const { data: course } = await supabase.from("courses").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!course) redirect("/courses");
  const { data: modules } = await supabase.from("course_modules").select("*").eq("course_id", course.id).order("sort_order");
  const moduleIds = (modules ?? []).map((module) => module.id);
  if (!moduleIds.length) redirect(`/courses/${slug}?error=lesson-access`);
  const { data: lesson } = await supabase.from("lessons").select("*").eq("id", lessonId).in("module_id", moduleIds).maybeSingle();
  if (!lesson) redirect(`/courses/${slug}?error=lesson-access`);
  const [{ data: progress }, { data: quizzes }] = await Promise.all([
    supabase.from("lesson_progress").select("*").eq("student_id", profile.id).eq("lesson_id", lessonId).maybeSingle(),
    supabase.from("quizzes").select("*").eq("lesson_id", lessonId).eq("is_published", true).order("created_at"),
  ]);
  const quizIds = (quizzes ?? []).map((quiz) => quiz.id);
  const attempts = quizIds.length ? (await supabase.from("quiz_attempts").select("*").eq("student_id", profile.id).in("quiz_id", quizIds).order("attempted_at", { ascending: false })).data ?? [] : [];
  const completed = Boolean(progress?.completed);

  return <DashboardShell eyebrow={course.title} title={lesson.title} profile={profile}><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><Link href={`/courses/${slug}`} className="font-bold text-blue-700 hover:underline">← Course outline</Link><span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-extrabold ${completed ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>{completed ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}{completed ? "Completed" : "In progress"}</span></div>{query.notice === "completed" && <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">Lesson marked complete. Your course progress has been recalculated.</div>}{query.error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">{query.error === "quiz-access" ? "That assessment is not available." : "Progress could not be saved. Please try again."}</div>}<Card className="p-7 sm:p-10">{lesson.description && <p className="text-lg leading-8 text-slate-600">{lesson.description}</p>}<div className="prose-content mt-8 whitespace-pre-wrap leading-8 text-slate-800">{lesson.content || "Lesson content has not been added yet."}</div>{lesson.video_url && <a href={lesson.video_url} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 font-extrabold text-blue-700 hover:underline">Open lesson video <ExternalLink className="h-4 w-4" /></a>}<div className="mt-10 border-t border-slate-200 pt-7">{completed ? <p className="flex items-center gap-2 font-extrabold text-emerald-700"><CheckCircle2 className="h-5 w-5" />This lesson is complete.</p> : <form action={markLessonComplete}><input type="hidden" name="slug" value={slug} /><input type="hidden" name="lessonId" value={lessonId} /><button className="rounded-xl bg-blue-600 px-6 py-3 font-extrabold text-white hover:bg-blue-700">Mark lesson complete</button></form>}</div></Card>{quizzes?.length ? <section className="mt-8"><div className="flex items-center gap-3"><ClipboardCheck className="h-6 w-6 text-blue-600" /><div><h2 className="text-2xl font-black">Lesson assessments</h2><p className="text-slate-600">Check your understanding and review every result.</p></div></div><div className="mt-5 grid gap-4 sm:grid-cols-2">{quizzes.map((quiz) => { const latest = attempts.find((attempt) => attempt.quiz_id === quiz.id); return <Card key={quiz.id} className="p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-extrabold">{quiz.title}</h3><span className={`rounded-full px-3 py-1 text-xs font-extrabold ${latest?.passed ? "bg-emerald-100 text-emerald-800" : latest ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>{latest?.passed ? "PASSED" : latest ? "TRY AGAIN" : "AVAILABLE"}</span></div>{quiz.description && <p className="mt-2 line-clamp-2 text-slate-600">{quiz.description}</p>}<p className="mt-3 text-sm font-bold text-slate-500">Pass mark: {quiz.passing_score}%{latest ? ` · Latest: ${latest.percentage}%` : ""}</p><Link href={`/courses/${slug}/lessons/${lessonId}/quizzes/${quiz.id}`} className="mt-5 inline-flex font-extrabold text-blue-700 hover:underline">{latest ? "Review or retry" : "Start quiz"} →</Link></Card>; })}</div></section> : null}</DashboardShell>;
}
