import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardCheck, Clock3 } from "lucide-react";
import { submitQuiz } from "@/app/quizzes/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { requireStudent } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function QuizPage({ params, searchParams }: { params: Promise<{ slug: string; lessonId: string; quizId: string }>; searchParams: Promise<{ error?: string }> }) {
  const { slug, lessonId, quizId } = await params;
  const { error: formError } = await searchParams;
  const path = `/courses/${slug}/lessons/${lessonId}/quizzes/${quizId}`;
  const { profile } = await requireStudent(path);
  const supabase = await createServerSupabaseClient();
  const { data: course } = await supabase.from("courses").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!course) redirect("/courses");
  const [{ data: modules }, { data: enrollment }] = await Promise.all([
    supabase.from("course_modules").select("*").eq("course_id", course.id),
    supabase.from("enrollments").select("*").eq("student_id", profile.id).eq("course_id", course.id).in("status", ["active", "completed"]).maybeSingle(),
  ]);
  if (!enrollment) redirect(`/courses/${slug}?error=enrollment-required`);
  const moduleIds = (modules ?? []).map((module) => module.id);
  const { data: lesson } = moduleIds.length ? await supabase.from("lessons").select("*").eq("id", lessonId).in("module_id", moduleIds).maybeSingle() : { data: null };
  if (!lesson) redirect(`/courses/${slug}?error=quiz-access`);
  const { data: quiz } = await supabase.from("quizzes").select("*").eq("id", quizId).eq("lesson_id", lessonId).eq("is_published", true).maybeSingle();
  if (!quiz) redirect(`/courses/${slug}/lessons/${lessonId}?error=quiz-access`);
  const [{ data: questions, error: questionError }, { data: attempts }] = await Promise.all([
    supabase.rpc("get_quiz_questions", { p_quiz_id: quizId }),
    supabase.from("quiz_attempts").select("*").eq("student_id", profile.id).eq("quiz_id", quizId).order("attempted_at", { ascending: false }).limit(5),
  ]);
  const safeQuestions = (questions ?? []).map((question) => ({ ...question, options: Array.isArray(question.options) ? question.options.filter((option): option is string => typeof option === "string") : [] }));

  return <DashboardShell eyebrow={course.title} title={quiz.title} profile={profile}><Link href={`/courses/${slug}/lessons/${lessonId}`} className="mb-6 inline-flex font-extrabold text-blue-700 hover:underline">← Back to lesson</Link><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]"><div>{formError && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">{formError === "answers" ? "Answer every question before submitting." : "Your attempt could not be submitted. Please try again."}</div>}{questionError ? <Card className="border-red-200 bg-red-50 p-6 text-red-900">This assessment could not be loaded.</Card> : !safeQuestions.length ? <Card className="p-8 text-center"><ClipboardCheck className="mx-auto h-10 w-10 text-slate-400" /><h2 className="mt-4 text-xl font-extrabold">No questions available</h2><p className="mt-2 text-slate-600">This quiz is not ready for an attempt yet.</p></Card> : <form action={submitQuiz} className="space-y-5"><input type="hidden" name="quiz_id" value={quizId} /><input type="hidden" name="lesson_id" value={lessonId} /><input type="hidden" name="slug" value={slug} /><input type="hidden" name="submission_token" value={crypto.randomUUID()} />{safeQuestions.map((question, index) => <Card key={question.question_id} className="p-6 sm:p-8"><div className="flex items-start gap-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-100 font-black text-blue-700">{index + 1}</span><div className="min-w-0 flex-1"><h2 className="text-lg font-extrabold leading-7">{question.question}</h2><p className="mt-1 text-sm font-bold text-slate-500">{question.points} point{question.points === 1 ? "" : "s"}</p><fieldset className="mt-5 space-y-3"><legend className="sr-only">Choose an answer</legend>{question.options.map((option, optionIndex) => <label key={optionIndex} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 hover:border-blue-300 hover:bg-blue-50"><input type="radio" name={`answer_${question.question_id}`} value={option} required className="h-4 w-4 accent-blue-600" /><span>{option}</span></label>)}</fieldset></div></div></Card>)}<button type="submit" className="min-h-12 w-full rounded-xl bg-blue-600 px-6 font-extrabold text-white hover:bg-blue-700 sm:w-auto">Submit answers</button></form>}</div><aside><Card className="p-6"><h2 className="font-extrabold">Quiz details</h2>{quiz.description && <p className="mt-3 leading-7 text-slate-600">{quiz.description}</p>}<p className="mt-4 text-sm font-bold text-slate-500">Pass mark: {quiz.passing_score}%</p></Card><Card className="mt-5 p-6"><h2 className="flex items-center gap-2 font-extrabold"><Clock3 className="h-5 w-5 text-blue-600" />Recent attempts</h2>{attempts?.length ? <div className="mt-4 space-y-3">{attempts.map((attempt) => <Link key={attempt.id} href={`${path}/attempts/${attempt.id}`} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 hover:bg-slate-50"><span className="text-sm font-bold">{attempt.percentage}%</span><span className={`text-xs font-extrabold ${attempt.passed ? "text-emerald-700" : "text-amber-700"}`}>{attempt.passed ? "PASSED" : "TRY AGAIN"}</span></Link>)}</div> : <p className="mt-3 text-sm text-slate-600">No attempts yet.</p>}</Card></aside></div></DashboardShell>;
}
