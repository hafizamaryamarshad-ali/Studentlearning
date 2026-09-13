/* eslint-disable @next/next/no-assign-module-variable */
import Link from "next/link";
import { createTask } from "@/app/admin/tasks/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { TaskForm } from "@/components/tasks/task-form";
import { requireAdmin } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const errors: Record<string, string> = { invalid: "Check the required fields, score, deadline, and submission type.", scope: "The selected module or lesson does not belong to that course.", save: "The task could not be saved." };

export default async function NewTaskPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { profile } = await requireAdmin("/admin/tasks/new"); const { error } = await searchParams; const supabase = await createServerSupabaseClient();
  const [{ data: courses }, { data: modules }, { data: lessons }] = await Promise.all([supabase.from("courses").select("*").order("title"), supabase.from("course_modules").select("*").order("sort_order"), supabase.from("lessons").select("*").order("sort_order")]);
  const courseMap = new Map((courses ?? []).map((course) => [course.id, course])); const moduleMap = new Map((modules ?? []).map((module) => [module.id, module]));
  const moduleChoices = (modules ?? []).flatMap((module) => { const course = courseMap.get(module.course_id); return course ? [{ id: module.id, courseId: course.id, label: `${course.title} / ${module.title}` }] : []; });
  const lessonChoices = (lessons ?? []).flatMap((lesson) => { const module = moduleMap.get(lesson.module_id); const course = module ? courseMap.get(module.course_id) : undefined; return course && module ? [{ id: lesson.id, moduleId: module.id, label: `${course.title} / ${module.title} / ${lesson.title}` }] : []; });
  return <DashboardShell admin eyebrow="Practice management" title="Create a practical task" profile={profile}><Link href="/admin/tasks" className="mb-6 inline-flex font-extrabold text-blue-700 hover:underline">← All tasks</Link>{error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">{errors[error] ?? errors.save}</div>}{courses?.length ? <TaskForm action={createTask} courses={courses.map((course) => ({ id: course.id, title: course.title }))} modules={moduleChoices} lessons={lessonChoices} /> : <Card className="p-8"><h2 className="text-xl font-extrabold">Add a course first</h2><p className="mt-2 text-slate-600">Every practical task must belong to an existing course.</p><Link href="/admin/courses" className="mt-5 inline-flex font-extrabold text-blue-700 hover:underline">Manage courses →</Link></Card>}</DashboardShell>;
}
