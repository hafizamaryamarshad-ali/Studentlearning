import Link from "next/link";
import { BookOpen, Layers3, Pencil, Plus } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { formatCoursePrice } from "@/lib/courses/format";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  const { profile } = await requireAdmin("/admin/courses");
  const supabase = await createServerSupabaseClient();
  const { data: courses, error } = await supabase.from("courses").select("*").order("updated_at", { ascending: false });
  return <DashboardShell admin eyebrow="Course management" title="Courses" profile={profile}><div className="mb-6 flex flex-wrap items-center justify-between gap-4"><p className="max-w-2xl leading-7 text-slate-600">Every course is visible here. Set its fee and currency, organize lessons, then publish it for students.</p><Link href="/admin/courses/new" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 font-extrabold text-white hover:bg-blue-700"><Plus className="h-5 w-5" />New course</Link></div>{error ? <Card className="border-red-200 bg-red-50 p-6 text-red-900">Courses could not be loaded.</Card> : !courses?.length ? <Card className="p-10 text-center"><BookOpen className="mx-auto h-10 w-10 text-slate-400" /><h2 className="mt-4 text-xl font-extrabold">No courses yet</h2></Card> : <div className="space-y-4">{courses.map((course) => <Card key={course.id} className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-extrabold">{course.title}</h2><span className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${course.status === "published" ? "bg-emerald-100 text-emerald-800" : course.status === "archived" ? "bg-slate-200 text-slate-600" : "bg-amber-100 text-amber-800"}`}>{course.status}</span></div><p className="mt-2 line-clamp-2 text-slate-600">{course.short_description}</p><p className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-500"><Layers3 className="h-4 w-4" />{formatCoursePrice(Number(course.price), course.currency)}</p></div><Link href={`/admin/courses/${course.id}/edit`} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 font-extrabold text-slate-800 hover:bg-slate-50"><Pencil className="h-4 w-4" />Manage</Link></Card>)}</div>}</DashboardShell>;
}
