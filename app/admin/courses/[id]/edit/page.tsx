import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Plus } from "lucide-react";
import { changeCourseStatus, createLesson, createModule, updateCourse, updateLesson, updateModule } from "@/app/admin/courses/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { CourseForm } from "@/components/courses/course-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireAdmin } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Lesson } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
const notices: Record<string, string> = { created: "Course created as requested.", saved: "Course details saved.", published: "Course published and visible in the catalog.", draft: "Course returned to draft.", archived: "Course archived and hidden from the catalog.", "module-created": "Module added.", "module-saved": "Module saved.", "lesson-created": "Lesson added.", "lesson-saved": "Lesson saved." };
const errors: Record<string, string> = { invalid: "Check the course fields and try again.", slug: "That course slug is already in use.", save: "The course could not be saved.", status: "The course status could not be changed.", module: "The module could not be saved.", "module-order": "Each module needs a unique position in this course.", lesson: "The lesson could not be saved.", "lesson-order": "Each lesson needs a unique position in its module." };

export default async function EditCoursePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string; error?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const { profile } = await requireAdmin(`/admin/courses/${id}/edit`);
  const supabase = await createServerSupabaseClient();
  const { data: course } = await supabase.from("courses").select("*").eq("id", id).maybeSingle();
  if (!course) notFound();
  const { data: modules } = await supabase.from("course_modules").select("*").eq("course_id", id).order("sort_order");
  const moduleIds = (modules ?? []).map((module) => module.id);
  const lessons: Lesson[] = moduleIds.length ? (await supabase.from("lessons").select("*").in("module_id", moduleIds).order("sort_order")).data ?? [] : [];

  return <DashboardShell admin eyebrow="Course management" title={course.title} profile={profile}>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><Link href="/admin/courses" className="font-extrabold text-blue-700 hover:underline">← All courses</Link>{course.status === "published" && <Link href={`/courses/${course.slug}`} className="font-extrabold text-blue-700 hover:underline">View public page →</Link>}</div>
    {query.notice && <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">{notices[query.notice] ?? "Changes saved."}</div>}
    {query.error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">{errors[query.error] ?? "Something went wrong. Please try again."}</div>}
    <CourseForm action={updateCourse} course={course} />
    <Card className="mt-6 p-6"><h2 className="text-xl font-extrabold">Publishing</h2><p className="mt-2 text-sm leading-6 text-slate-600">Draft and archived courses stay hidden from students. Publishing makes the course page and free enrollment available.</p><div className="mt-5 flex flex-wrap gap-3">{(["draft", "published", "archived"] as const).map((status) => <form action={changeCourseStatus} key={status}><input type="hidden" name="id" value={course.id} /><input type="hidden" name="status" value={status} /><Button type="submit" variant={course.status === status ? "default" : "outline"} disabled={course.status === status} className="capitalize">{status}</Button></form>)}</div></Card>
    <section className="mt-10"><div><h2 className="text-2xl font-black">Course structure</h2><p className="mt-2 text-slate-600">Modules and lessons are shown to students in position order.</p></div>
      <details className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5"><summary className="cursor-pointer font-extrabold text-blue-900"><Plus className="mr-2 inline h-4 w-4" />Add module</summary><ModuleForm action={createModule} courseId={course.id} nextOrder={(modules?.length ?? 0) + 1} /></details>
      <div className="mt-5 space-y-5">{!modules?.length ? <Card className="p-8 text-center"><BookOpen className="mx-auto h-9 w-9 text-slate-400" /><p className="mt-3 font-extrabold">No modules yet</p></Card> : modules.map((module) => { const moduleLessons = lessons.filter((lesson) => lesson.module_id === module.id); return <Card className="p-6" key={module.id}><details><summary className="cursor-pointer text-lg font-extrabold">Module {module.sort_order}: {module.title} <span className="ml-2 text-sm font-semibold text-slate-500">({moduleLessons.length} lessons)</span></summary><ModuleForm action={updateModule} courseId={course.id} moduleId={module.id} title={module.title} description={module.description ?? ""} nextOrder={module.sort_order} /></details><div className="mt-5 space-y-3">{moduleLessons.map((lesson) => <details key={lesson.id} className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer font-bold">Lesson {lesson.sort_order}: {lesson.title}</summary><LessonForm action={updateLesson} courseId={course.id} moduleId={module.id} lesson={lesson} /></details>)}<details className="rounded-xl border border-dashed border-slate-300 p-4"><summary className="cursor-pointer font-bold text-blue-700"><Plus className="mr-2 inline h-4 w-4" />Add lesson</summary><LessonForm action={createLesson} courseId={course.id} moduleId={module.id} nextOrder={moduleLessons.length + 1} /></details></div></Card>; })}</div>
    </section>
  </DashboardShell>;
}

function ModuleForm({ action, courseId, moduleId, title = "", description = "", nextOrder }: { action: (data: FormData) => void | Promise<void>; courseId: string; moduleId?: string; title?: string; description?: string; nextOrder: number }) {
  return <form action={action} className="mt-5 grid gap-4 sm:grid-cols-[1fr_120px]"><input type="hidden" name="courseId" value={courseId} />{moduleId && <input type="hidden" name="moduleId" value={moduleId} />}<Field label="Module title" name="title" defaultValue={title} required /><Field label="Position" name="sort_order" type="number" min="0" defaultValue={nextOrder} required /><div className="space-y-2 sm:col-span-2"><Label htmlFor={`module-description-${moduleId ?? "new"}`}>Description</Label><textarea id={`module-description-${moduleId ?? "new"}`} name="description" defaultValue={description} rows={3} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3" /></div><Button type="submit" className="w-fit">{moduleId ? "Save module" : "Add module"}</Button></form>;
}

function LessonForm({ action, courseId, moduleId, lesson, nextOrder = 1 }: { action: (data: FormData) => void | Promise<void>; courseId: string; moduleId: string; lesson?: Lesson; nextOrder?: number }) {
  return <form action={action} className="mt-5 grid gap-4 sm:grid-cols-[1fr_120px]"><input type="hidden" name="courseId" value={courseId} /><input type="hidden" name="moduleId" value={moduleId} />{lesson && <input type="hidden" name="lessonId" value={lesson.id} />}<Field label="Lesson title" name="title" defaultValue={lesson?.title} required /><Field label="Position" name="sort_order" type="number" min="0" defaultValue={lesson?.sort_order ?? nextOrder} required /><Field label="Video URL (optional)" name="video_url" type="url" defaultValue={lesson?.video_url ?? ""} /><div className="space-y-2 sm:col-span-2"><Label>Description</Label><textarea name="description" defaultValue={lesson?.description ?? ""} rows={2} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3" /></div><div className="space-y-2 sm:col-span-2"><Label>Lesson content</Label><textarea name="content" defaultValue={lesson?.content ?? ""} rows={7} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3" /></div><Button type="submit" className="w-fit">{lesson ? "Save lesson" : "Add lesson"}</Button></form>;
}

function Field({ label, name, ...props }: { label: string; name: string } & React.ComponentProps<typeof Input>) { return <div className="space-y-2"><Label>{label}</Label><Input name={name} className="h-11 rounded-xl" {...props} /></div>; }
