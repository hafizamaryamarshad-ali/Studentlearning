import Link from "next/link";
import { CalendarClock, ClipboardList } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { requireStudent } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDeadline, submissionStatusLabel, submissionStatusTone } from "@/lib/tasks/format";

export const dynamic = "force-dynamic";

export default async function StudentTasksPage() {
  const { profile } = await requireStudent("/tasks"); const supabase = await createServerSupabaseClient();
  const { data: tasks, error } = await supabase.from("tasks").select("*").eq("is_published", true).order("deadline", { ascending: true, nullsFirst: false });
  const taskIds = (tasks ?? []).map((task) => task.id); const courseIds = [...new Set((tasks ?? []).map((task) => task.course_id))];
  const [courses, submissions] = await Promise.all([courseIds.length ? supabase.from("courses").select("*").in("id", courseIds).then(({ data }) => data ?? []) : [], taskIds.length ? supabase.from("task_submissions").select("*").eq("student_id", profile.id).in("task_id", taskIds).then(({ data }) => data ?? []) : []]);
  const courseMap = new Map(courses.map((course) => [course.id, course]));
  return <DashboardShell eyebrow="Practice area" title="Practical tasks" profile={profile}><p className="mb-6 max-w-2xl leading-7 text-slate-600">Apply what you learn through written work and portfolio links. Your instructor reviews each submission.</p>{error ? <Card className="border-red-200 bg-red-50 p-6 text-red-900">Your tasks could not be loaded.</Card> : !tasks?.length ? <Card className="p-10 text-center"><ClipboardList className="mx-auto h-10 w-10 text-slate-400" /><h2 className="mt-4 text-xl font-extrabold">No tasks available</h2><p className="mt-2 text-slate-600">Published practice tasks from your enrolled courses will appear here.</p><Link href="/courses" className="mt-5 inline-flex font-extrabold text-blue-700 hover:underline">Browse courses →</Link></Card> : <div className="grid gap-5 lg:grid-cols-2">{tasks.map((task) => { const submission = submissions.find((item) => item.task_id === task.id); const expired = Boolean(task.deadline && new Date(task.deadline) < new Date()); const label = submission ? submissionStatusLabel[submission.status] : expired ? "Deadline passed" : "Not submitted"; const tone = submission ? submissionStatusTone(submission.status) : expired ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-700"; return <Card key={task.id} className="p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold text-blue-700">{courseMap.get(task.course_id)?.title ?? "Enrolled course"}</p><h2 className="mt-1 text-xl font-extrabold">{task.title}</h2></div><span className={`rounded-full px-3 py-1 text-xs font-extrabold ${tone}`}>{label}</span></div><p className="mt-3 line-clamp-3 leading-7 text-slate-600">{task.description}</p><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-slate-500"><span>{task.points} points</span><span className="flex items-center gap-1.5"><CalendarClock className="h-4 w-4" />{formatDeadline(task.deadline)}</span></div><Link href={`/tasks/${task.id}`} className="mt-5 inline-flex font-extrabold text-blue-700 hover:underline">{submission ? "View submission" : expired ? "View task" : "Open task"} →</Link></Card>; })}</div>}</DashboardShell>;
}
