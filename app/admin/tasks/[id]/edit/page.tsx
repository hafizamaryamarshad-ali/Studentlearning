/* eslint-disable @next/next/no-assign-module-variable */
import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, EyeOff, Inbox } from "lucide-react";
import { changeTaskPublishState, updateTask } from "@/app/admin/tasks/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { TaskForm } from "@/components/tasks/task-form";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const notices: Record<string, string> = { created: "Task created as a draft.", saved: "Task details saved.", published: "Task published for enrolled students.", unpublished: "Task returned to draft." };
const errors: Record<string, string> = { invalid: "Check the task details and try again.", scope: "The selected module or lesson does not belong to that course.", save: "Task details could not be saved.", publish: "The publish state could not be changed." };

export default async function EditTaskPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string; error?: string }> }) {
  const { id } = await params; const query = await searchParams; const { profile } = await requireAdmin(`/admin/tasks/${id}/edit`); const supabase = await createServerSupabaseClient();
  const [{ data: task }, { data: courses }, { data: modules }, { data: lessons }, { count }] = await Promise.all([supabase.from("tasks").select("*").eq("id", id).maybeSingle(), supabase.from("courses").select("*").order("title"), supabase.from("course_modules").select("*").order("sort_order"), supabase.from("lessons").select("*").order("sort_order"), supabase.from("task_submissions").select("id", { head: true, count: "exact" }).eq("task_id", id)]);
  if (!task) redirect("/admin/tasks?error=missing");
  const courseMap = new Map((courses ?? []).map((course) => [course.id, course])); const moduleMap = new Map((modules ?? []).map((module) => [module.id, module]));
  const moduleChoices = (modules ?? []).flatMap((module) => { const course = courseMap.get(module.course_id); return course ? [{ id: module.id, courseId: course.id, label: `${course.title} / ${module.title}` }] : []; });
  const lessonChoices = (lessons ?? []).flatMap((lesson) => { const module = moduleMap.get(lesson.module_id); const course = module ? courseMap.get(module.course_id) : undefined; return course && module ? [{ id: lesson.id, moduleId: module.id, label: `${course.title} / ${module.title} / ${lesson.title}` }] : []; });
  return <DashboardShell admin eyebrow="Practice management" title={task.title} profile={profile}><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><Link href="/admin/tasks" className="font-extrabold text-blue-700 hover:underline">← All tasks</Link><div className="flex flex-wrap gap-3"><Link href={`/admin/tasks/${task.id}/submissions`} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 font-extrabold text-slate-800 hover:bg-slate-50"><Inbox className="h-4 w-4" />Submissions ({count ?? 0})</Link><form action={changeTaskPublishState}><input type="hidden" name="id" value={task.id} /><input type="hidden" name="publish" value={String(!task.is_published)} /><Button type="submit" variant={task.is_published ? "outline" : "default"} className={`rounded-xl font-extrabold ${task.is_published ? "" : "bg-emerald-600 hover:bg-emerald-700"}`}>{task.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{task.is_published ? "Unpublish" : "Publish task"}</Button></form></div></div>{query.notice && notices[query.notice] && <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">{notices[query.notice]}</div>}{query.error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">{errors[query.error] ?? "That change could not be completed."}</div>}<div className="mb-6"><span className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${task.is_published ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{task.is_published ? "Published" : "Draft"}</span></div><TaskForm action={updateTask} task={task} courses={(courses ?? []).map((course) => ({ id: course.id, title: course.title }))} modules={moduleChoices} lessons={lessonChoices} /></DashboardShell>;
}
