import Link from "next/link";
import { ClipboardCheck, LockKeyhole } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { requireStudent } from "@/lib/auth/session";
import { formatCoursePrice } from "@/lib/courses/format";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function StudentQuizzesPage() {
  const { profile } = await requireStudent("/quizzes");
  const supabase = await createServerSupabaseClient();
  const [{ data: quizzes, error }, { data: outline }, { data: courses }, { data: enrollments }, { data: attempts }] = await Promise.all([
    supabase.from("quizzes").select("*").eq("is_published", true).order("created_at"),
    supabase.from("course_outline").select("*"),
    supabase.from("courses").select("*").eq("status", "published"),
    supabase.from("enrollments").select("*").eq("student_id", profile.id).in("status", ["active", "completed"]),
    supabase.from("quiz_attempts").select("*").eq("student_id", profile.id).order("attempted_at", { ascending: false }),
  ]);
  const lessonMap = new Map((outline ?? []).filter((row) => row.lesson_id).map((row) => [row.lesson_id as string, row]));
  const courseMap = new Map((courses ?? []).map((course) => [course.id, course]));
  const enrolled = new Set((enrollments ?? []).map((item) => item.course_id));
  return <DashboardShell eyebrow="Assessment catalog" title="Quizzes" profile={profile}><p className="mb-7 max-w-2xl leading-7 text-slate-600">Browse every published quiz. Purchase or enroll in its course to unlock the lesson and submit an attempt.</p>{error ? <Card className="border-red-200 bg-red-50 p-6 text-red-900">Quizzes could not be loaded.</Card> : !quizzes?.length ? <Card className="p-10 text-center"><ClipboardCheck className="mx-auto h-10 w-10 text-slate-400" /><h2 className="mt-4 text-xl font-extrabold">No published quizzes yet</h2></Card> : <div className="grid gap-5 sm:grid-cols-2">{quizzes.map((quiz) => { const row = lessonMap.get(quiz.lesson_id); const course = row ? courseMap.get(row.course_id) : undefined; const available = course ? enrolled.has(course.id) : false; const latest = attempts?.find((attempt) => attempt.quiz_id === quiz.id); const target = available && row && course ? `/courses/${course.slug}/lessons/${row.lesson_id}/quizzes/${quiz.id}` : course ? `/courses/${course.slug}` : "/courses"; return <Card key={quiz.id} className="flex flex-col p-6"><div className="flex items-start justify-between gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-100 text-blue-700"><ClipboardCheck className="h-5 w-5" /></span><span className={`rounded-full px-3 py-1 text-xs font-extrabold ${latest?.passed ? "bg-emerald-100 text-emerald-800" : available ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"}`}>{latest?.passed ? "PASSED" : available ? "AVAILABLE" : "COURSE REQUIRED"}</span></div><h2 className="mt-5 text-xl font-extrabold">{quiz.title}</h2><p className="mt-2 text-sm font-bold text-blue-700">{course?.title ?? "Course"}</p>{quiz.description && <p className="mt-3 flex-1 leading-7 text-slate-600">{quiz.description}</p>}<div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-5"><div><p className="text-sm font-extrabold">Pass mark {quiz.passing_score}%</p>{course && <p className="mt-1 text-sm text-slate-500">{formatCoursePrice(Number(course.price), course.currency)}</p>}</div><Link href={target} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 font-extrabold text-white hover:bg-blue-700">{available ? "Start quiz" : <><LockKeyhole className="h-4 w-4" />Purchase course</>}</Link></div></Card>; })}</div>}</DashboardShell>;
}
