/* eslint-disable @next/next/no-assign-module-variable */
import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, EyeOff, Plus } from "lucide-react";
import { changeQuizPublishState, createQuestion, deleteQuestion, updateQuestion, updateQuiz } from "@/app/admin/quizzes/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { DeleteQuestionButton } from "@/components/quizzes/delete-question-button";
import { QuestionForm } from "@/components/quizzes/question-form";
import { QuizForm, type LessonChoice } from "@/components/quizzes/quiz-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const messages: Record<string, string> = { created: "Quiz created as a draft. Add questions before publishing.", saved: "Quiz details saved.", published: "Quiz published for enrolled students.", unpublished: "Quiz returned to draft.", "question-created": "Question added.", "question-saved": "Question saved.", "question-deleted": "Question deleted." };
const errors: Record<string, string> = { invalid: "Check the quiz details and try again.", save: "Quiz details could not be saved.", empty: "Add at least one question before publishing.", publish: "The publish state could not be changed.", "question-invalid": "Each question needs 2–6 unique options, one valid correct option, positive points, and a non-negative order.", "question-order": "That question order is already in use for this quiz.", "question-save": "The question could not be saved.", "question-delete": "The question could not be deleted." };

export default async function EditQuizPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string; error?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const { profile } = await requireAdmin(`/admin/quizzes/${id}/edit`);
  const supabase = await createServerSupabaseClient();
  const [{ data: quiz }, { data: questions }, { data: courses }, { data: modules }, { data: lessons }] = await Promise.all([
    supabase.from("quizzes").select("*").eq("id", id).maybeSingle(), supabase.from("quiz_questions").select("*").eq("quiz_id", id).order("sort_order"), supabase.from("courses").select("*"), supabase.from("course_modules").select("*").order("sort_order"), supabase.from("lessons").select("*").order("sort_order"),
  ]);
  if (!quiz) redirect("/admin/quizzes?error=missing");
  const courseMap = new Map((courses ?? []).map((item) => [item.id, item]));
  const moduleMap = new Map((modules ?? []).map((item) => [item.id, item]));
  const choices: LessonChoice[] = (lessons ?? []).flatMap((lesson) => { const module = moduleMap.get(lesson.module_id); const course = module ? courseMap.get(module.course_id) : undefined; return course && module ? [{ id: lesson.id, label: `${course.title} / ${module.title} / ${lesson.title}` }] : []; });
  const nextOrder = (questions?.reduce((max, question) => Math.max(max, question.sort_order), -1) ?? -1) + 1;

  return <DashboardShell admin eyebrow="Assessment management" title={quiz.title} profile={profile}><div className="mb-6 flex flex-wrap items-center justify-between gap-4"><Link href="/admin/quizzes" className="font-extrabold text-blue-700 hover:underline">← All quizzes</Link><form action={changeQuizPublishState}><input type="hidden" name="id" value={quiz.id} /><input type="hidden" name="publish" value={String(!quiz.is_published)} /><Button type="submit" variant={quiz.is_published ? "outline" : "default"} className={`rounded-xl font-extrabold ${quiz.is_published ? "" : "bg-emerald-600 hover:bg-emerald-700"}`}>{quiz.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{quiz.is_published ? "Unpublish" : "Publish quiz"}</Button></form></div>{query.notice && messages[query.notice] && <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">{messages[query.notice]}</div>}{query.error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">{errors[query.error] ?? "That change could not be completed."}</div>}<div className="mb-8 flex flex-wrap items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${quiz.is_published ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{quiz.is_published ? "Published" : "Draft"}</span><span className="text-sm font-bold text-slate-500">{questions?.length ?? 0} question{questions?.length === 1 ? "" : "s"}</span></div><QuizForm action={updateQuiz} quiz={quiz} lessons={choices} />
    <section className="mt-10"><div className="flex items-center gap-3"><Plus className="h-6 w-6 text-blue-600" /><div><h2 className="text-2xl font-black">Questions</h2><p className="text-slate-600">Answers are stored securely and are never included in the student question feed.</p></div></div><Card className="mt-5 p-6 sm:p-8"><h3 className="mb-5 text-lg font-extrabold">Add a question</h3><QuestionForm action={createQuestion} quizId={quiz.id} nextOrder={nextOrder} /></Card><div className="mt-6 space-y-5">{questions?.map((question, index) => <Card key={question.id} className="p-6 sm:p-8"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h3 className="font-extrabold">Question {index + 1}</h3><DeleteQuestionButton action={deleteQuestion} quizId={quiz.id} questionId={question.id} /></div><QuestionForm action={updateQuestion} quizId={quiz.id} question={question} /></Card>)}</div></section>
  </DashboardShell>;
}
