import Link from "next/link";
import { notFound } from "next/navigation";
import { updateStudentCourseAccess } from "@/app/admin/students/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function StudentDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string; error?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const { profile } = await requireAdmin(`/admin/students/${id}`);
  const supabase = await createServerSupabaseClient();
  const { data: student } = await supabase.from("profiles").select("*").eq("id", id).eq("role", "student").maybeSingle();
  if (!student) notFound();
  const [{ data: enrollments }, { data: courses }, { data: payments }, { data: attempts }, { data: submissions }, { data: certificates }] = await Promise.all([
    supabase.from("enrollments").select("*").eq("student_id", id).order("enrolled_at", { ascending: false }),
    supabase.from("courses").select("*"),
    supabase.from("payments").select("*").eq("student_id", id).order("created_at", { ascending: false }),
    supabase.from("quiz_attempts").select("*").eq("student_id", id),
    supabase.from("task_submissions").select("*").eq("student_id", id),
    supabase.from("certificates").select("*").eq("student_id", id),
  ]);
  const courseMap = new Map((courses ?? []).map((course) => [course.id, course]));
  return <DashboardShell admin eyebrow="Student management" title={student.full_name} profile={profile}>
    <Link href="/admin/students" className="font-extrabold text-blue-700 hover:underline">← All students</Link>
    {query.notice && <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">Student course access updated.</div>}
    {query.error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">That change could not be completed.</div>}
    <div className="mt-6 grid gap-4 sm:grid-cols-4"><Stat label="Courses" value={enrollments?.length ?? 0} /><Stat label="Payments" value={payments?.length ?? 0} /><Stat label="Quiz attempts" value={attempts?.length ?? 0} /><Stat label="Certificates" value={certificates?.length ?? 0} /></div>
    <Card className="mt-6 p-6"><p className="text-sm font-bold text-slate-500">REGISTERED ACCOUNT</p><p className="mt-2 font-extrabold">{student.email}</p><p className="mt-1 text-sm text-slate-500">Joined {new Date(student.created_at).toLocaleDateString("en-PK")}</p></Card>
    <section className="mt-8"><h2 className="text-2xl font-black">Course access</h2><p className="mt-2 text-slate-600">Payment approval normally activates access. You can pause or restore an existing enrollment here without changing login details.</p><div className="mt-5 space-y-4">{!enrollments?.length ? <Card className="p-7 text-slate-600">No course enrollment yet.</Card> : enrollments.map((enrollment) => <Card key={enrollment.id} className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-extrabold">{courseMap.get(enrollment.course_id)?.title ?? "Course"}</h3><p className="mt-1 text-sm text-slate-500">{enrollment.progress_percentage}% complete · <span className="capitalize">{enrollment.status}</span></p></div>{enrollment.status !== "completed" && <form action={updateStudentCourseAccess}><input type="hidden" name="student_id" value={student.id} /><input type="hidden" name="enrollment_id" value={enrollment.id} /><input type="hidden" name="status" value={enrollment.status === "cancelled" ? "active" : "cancelled"} /><Button type="submit" variant={enrollment.status === "cancelled" ? "default" : "outline"}>{enrollment.status === "cancelled" ? "Restore access" : "Pause access"}</Button></form>}</Card>)}</div></section>
    <section className="mt-8"><h2 className="text-2xl font-black">Practical work</h2><Card className="mt-5 p-6"><p className="font-extrabold">{submissions?.length ?? 0} submission{(submissions?.length ?? 0) === 1 ? "" : "s"}</p><p className="mt-2 text-sm text-slate-600">Review individual submissions from the Practical tasks area.</p><Link href="/admin/tasks" className="mt-4 inline-flex font-extrabold text-blue-700 hover:underline">Open task reviews →</Link></Card></section>
  </DashboardShell>;
}

function Stat({ label, value }: { label: string; value: number }) { return <Card className="p-5"><p className="text-3xl font-black">{value}</p><p className="mt-1 text-sm font-bold text-slate-500">{label}</p></Card>; }
