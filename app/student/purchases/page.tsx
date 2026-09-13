import Link from "next/link";
import { CreditCard } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { requireStudent } from "@/lib/auth/session";
import { formatCoursePrice } from "@/lib/courses/format";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function StudentPurchasesPage() {
  const { profile } = await requireStudent("/student/purchases");
  const supabase = await createServerSupabaseClient();
  const [{ data: payments, error }, { data: courses }] = await Promise.all([
    supabase.from("payments").select("*").eq("student_id", profile.id).order("created_at", { ascending: false }),
    supabase.from("courses").select("*").eq("status", "published"),
  ]);
  const courseMap = new Map((courses ?? []).map((course) => [course.id, course]));
  return <DashboardShell eyebrow="Your account" title="Purchases" profile={profile}><p className="mb-6 max-w-2xl leading-7 text-slate-600">Track payment proofs and see when paid course access is approved. If a request is rejected, review the admin message and submit a corrected proof from the course page.</p>{error ? <Card className="border-red-200 bg-red-50 p-6 text-red-900">Purchases could not be loaded.</Card> : !payments?.length ? <Card className="p-10 text-center"><CreditCard className="mx-auto h-10 w-10 text-slate-400" /><h2 className="mt-4 text-xl font-extrabold">No purchases yet</h2><p className="mt-2 text-slate-600">Choose a paid course to submit your first payment proof.</p><Link href="/courses" className="mt-5 inline-flex font-extrabold text-blue-700 hover:underline">Browse courses →</Link></Card> : <div className="space-y-4">{payments.map((payment) => { const course = courseMap.get(payment.course_id); const tone = payment.status === "paid" ? "bg-emerald-100 text-emerald-800" : payment.status === "failed" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"; return <Card key={payment.id} className="p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-extrabold">{course?.title ?? "Course"}</h2><p className="mt-2 font-bold text-slate-600">{formatCoursePrice(Number(payment.amount), payment.currency)}</p></div><span className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${tone}`}>{payment.status === "failed" ? "rejected" : payment.status}</span></div>{payment.admin_message && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900"><p className="font-extrabold">Admin message</p><p className="mt-2 whitespace-pre-wrap leading-7">{payment.admin_message}</p></div>}{course && <Link href={`/courses/${course.slug}`} className="mt-5 inline-flex font-extrabold text-blue-700 hover:underline">Open course →</Link>}</Card>; })}</div>}</DashboardShell>;
}
