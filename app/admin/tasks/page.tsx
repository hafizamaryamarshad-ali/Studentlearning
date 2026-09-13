import Link from "next/link";
import { ClipboardList, Pencil, Plus } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDeadline } from "@/lib/tasks/format";

export const dynamic = "force-dynamic";

export default async function AdminTasksPage() {
  const { profile } = await requireAdmin("/admin/tasks");
  const supabase = await createServerSupabaseClient();
  const [{ data: tasks, error }, { data: courses }, { data: submissions }] = await Promise.all([supabase.from("tasks").select("*").order("updated_at", { ascending: false }), supabase.from("courses").select("*"), supabase.from("task_submissions").select("*")]);
  const courseMap = new Map((courses ?? []).map((course) => [course.id, course]));
  return <DashboardShell admin eyebrow="Practice management" title="Practical tasks" profile={profile}><div className="mb-6 flex flex-wrap items-center justify-between gap-4"><p className="max-w-2xl leading-7 text-slate-600">Create education-focused practice work and review each student submission securely.</p><Link href="/admin/tasks/new" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 font-extrabold text-white hover:bg-blue-700"><Plus className="h-5 w-5" />New task</Link></div>{error ? <Card className="border-red-200 bg-red-50 p-6 text-red-900">Tasks could not be loaded.</Card> : !tasks?.length ? <Card className="p-10 text-center"><ClipboardList className="mx-auto h-10 w-10 text-slate-400" /><h2 className="mt-4 text-xl font-extrabold">No practical tasks yet</h2><p className="mt-2 text-slate-600">Create a draft task and attach it to a published course.</p></Card> : <div className="space-y-4">{tasks.map((task) => { const count = submissions?.filter((submission) => submission.task_id === task.id).length ?? 0; return <Card key={task.id} className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-extrabold">{task.title}</h2><span className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${task.is_published ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{task.is_published ? "Published" : "Draft"}</span></div><p className="mt-2 text-slate-600">{courseMap.get(task.course_id)?.title ?? "Course unavailable"}</p><p className="mt-2 text-sm font-bold text-slate-500">{task.points} points · {count} submission{count === 1 ? "" : "s"} · {formatDeadline(task.deadline)}</p></div><div className="flex flex-wrap gap-3"><Link href={`/admin/tasks/${task.id}/submissions`} className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 font-extrabold text-slate-800 hover:bg-slate-50">Review ({count})</Link><Link href={`/admin/tasks/${task.id}/edit`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 font-extrabold text-white hover:bg-blue-700"><Pencil className="h-4 w-4" />Manage</Link></div></Card>; })}</div>}</DashboardShell>;
}
