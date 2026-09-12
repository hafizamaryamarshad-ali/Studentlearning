import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { requireStudent } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
type SummaryItem = { question_id: string; question: string; selected_answer: string; correct_answer: string; correct: boolean; points: number; awarded_points: number };
function parseSummary(value: Json): SummaryItem[] { if (!Array.isArray(value)) return []; return value.flatMap((item) => { if (!item || Array.isArray(item) || typeof item !== "object") return []; const row = item as Record<string, Json | undefined>; return typeof row.question_id === "string" && typeof row.question === "string" && typeof row.selected_answer === "string" && typeof row.correct_answer === "string" && typeof row.correct === "boolean" && typeof row.points === "number" && typeof row.awarded_points === "number" ? [{ question_id: row.question_id, question: row.question, selected_answer: row.selected_answer, correct_answer: row.correct_answer, correct: row.correct, points: row.points, awarded_points: row.awarded_points }] : []; }); }

export default async function QuizResultPage({ params }: { params: Promise<{ slug: string; lessonId: string; quizId: string; attemptId: string }> }) {
  const { slug, lessonId, quizId, attemptId } = await params;
  const path = `/courses/${slug}/lessons/${lessonId}/quizzes/${quizId}/attempts/${attemptId}`;
  const { profile } = await requireStudent(path);
  const supabase = await createServerSupabaseClient();
  const [{ data: course }, { data: quiz }, { data: attempt }] = await Promise.all([
    supabase.from("courses").select("*").eq("slug", slug).eq("status", "published").maybeSingle(),
    supabase.from("quizzes").select("*").eq("id", quizId).eq("lesson_id", lessonId).eq("is_published", true).maybeSingle(),
    supabase.from("quiz_attempts").select("*").eq("id", attemptId).eq("quiz_id", quizId).eq("student_id", profile.id).maybeSingle(),
  ]);
  if (!course || !quiz || !attempt) redirect("/student");
  const summary = parseSummary(attempt.result_summary);
  return <DashboardShell eyebrow="Quiz result" title={quiz.title} profile={profile}><Card className={`border-2 p-7 sm:p-9 ${attempt.passed ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white ${attempt.passed ? "bg-emerald-600" : "bg-amber-500"}`}>{attempt.passed ? <CheckCircle2 className="h-7 w-7" /> : <XCircle className="h-7 w-7" />}</span><div><h2 className="text-2xl font-black">{attempt.passed ? "Quiz passed" : "Keep learning and try again"}</h2><p className="mt-1 text-slate-700">You scored {attempt.score} of {attempt.max_score} points ({attempt.percentage}%). Pass mark: {quiz.passing_score}%.</p></div></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><Metric label="Correct answers" value={`${attempt.correct_answers}/${attempt.total_questions}`} /><Metric label="Percentage" value={`${attempt.percentage}%`} /><Metric label="Outcome" value={attempt.passed ? "Passed" : "Not passed"} /></div></Card><section className="mt-8"><h2 className="text-2xl font-black">Answer review</h2><div className="mt-5 space-y-4">{summary.map((item, index) => <Card key={item.question_id} className="p-6"><div className="flex items-start gap-3">{item.correct ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />}<div><h3 className="font-extrabold">{index + 1}. {item.question}</h3><p className="mt-3 text-sm text-slate-600">Your answer: <span className="font-bold text-slate-900">{item.selected_answer}</span></p>{!item.correct && <p className="mt-1 text-sm text-slate-600">Correct answer: <span className="font-bold text-emerald-700">{item.correct_answer}</span></p>}<p className="mt-2 text-xs font-bold text-slate-500">{item.awarded_points}/{item.points} points</p></div></div></Card>)}</div></section><div className="mt-8 flex flex-wrap gap-3"><Link href={`/courses/${slug}/lessons/${lessonId}/quizzes/${quizId}`} className="inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-5 font-extrabold text-white hover:bg-blue-700">Try quiz again</Link><Link href={`/courses/${slug}/lessons/${lessonId}`} className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-5 font-extrabold text-slate-800 hover:bg-slate-50">Return to lesson</Link></div></DashboardShell>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-white/80 p-4"><p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>; }
