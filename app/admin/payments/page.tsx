import Link from "next/link";
import { CreditCard, Settings } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { formatCoursePrice } from "@/lib/courses/format";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  const { profile } = await requireAdmin("/admin/payments");
  const supabase = await createServerSupabaseClient();
  const [{ data: payments, error }, { data: courses }, { data: profiles }] = await Promise.all([
    supabase.from("payments").select("*").order("created_at", { ascending: false }),
    supabase.from("courses").select("*"),
    supabase.from("profiles").select("*"),
  ]);
  const courseMap = new Map((courses ?? []).map((course) => [course.id, course]));
  const studentMap = new Map((profiles ?? []).map((student) => [student.id, student]));

  return <DashboardShell admin eyebrow="Enrollment payments" title="Payment reviews" profile={profile}>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><p className="max-w-2xl leading-7 text-slate-600">Review student payment screenshots before granting paid course access. Rejections require a clear reason.</p><Link href="/admin/payments/settings" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 font-extrabold"><Settings className="h-4 w-4" />Payment details</Link></div>
    {notice && <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">Payment {notice} successfully.</div>}
    {error ? <Card className="border-red-200 bg-red-50 p-6 text-red-900">Payments could not be loaded.</Card> : !payments?.length ? <Card className="p-10 text-center"><CreditCard className="mx-auto h-10 w-10 text-slate-400" /><h2 className="mt-4 text-xl font-extrabold">No payment requests yet</h2><p className="mt-2 text-slate-600">New student proofs will appear here for review.</p></Card> : <div className="space-y-4">{payments.map((payment) => { const course = courseMap.get(payment.course_id); const student = studentMap.get(payment.student_id); return <Card key={payment.id} className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-3"><h2 className="text-lg font-extrabold">{course?.title ?? "Course unavailable"}</h2><Status value={payment.status} /></div><p className="mt-2 text-slate-600">{student?.full_name ?? "Student"} · {formatCoursePrice(Number(payment.amount), payment.currency)}</p><p className="mt-2 text-sm text-slate-500">Submitted {new Date(payment.created_at).toLocaleString("en-PK")}</p></div><Link href={`/admin/payments/${payment.id}`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 font-extrabold text-white hover:bg-blue-700">Review request</Link></Card>; })}</div>}
  </DashboardShell>;
}

function Status({ value }: { value: string }) { const tone = value === "paid" ? "bg-emerald-100 text-emerald-800" : value === "failed" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"; return <span className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${tone}`}>{value === "failed" ? "rejected" : value}</span>; }
