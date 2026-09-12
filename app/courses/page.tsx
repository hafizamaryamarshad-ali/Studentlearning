import { BookOpen } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CourseCard } from "@/components/courses/course-card";
import { DatabaseState } from "@/components/courses/database-state";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  let courses = null;
  let failed = false;
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const result = await supabase.from("courses").select("*").eq("status", "published").order("created_at", { ascending: false });
      courses = result.data;
      failed = Boolean(result.error);
    } catch { failed = true; }
  }

  return <div className="min-h-screen bg-slate-50"><Navbar /><main className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20"><p className="text-sm font-extrabold uppercase tracking-[.18em] text-blue-600">Course catalog</p><h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Learn practical skills at your pace.</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">Browse published courses, review the lesson plan, and enroll when you are ready.</p><div className="mt-12">{!isSupabaseConfigured() || failed ? <DatabaseState /> : courses?.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{courses.map((course)=><CourseCard key={course.id} course={course} />)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><BookOpen className="mx-auto h-10 w-10 text-slate-400" /><h2 className="mt-4 text-xl font-extrabold">No published courses yet</h2><p className="mt-2 text-slate-600">New learning opportunities will appear here after an administrator publishes them.</p></div>}</div></main><Footer /></div>;
}
