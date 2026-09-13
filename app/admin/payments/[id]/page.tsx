import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { reviewCoursePayment } from "@/app/admin/payments/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { requireAdmin } from "@/lib/auth/session";
import { formatCoursePrice } from "@/lib/courses/format";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PaymentReviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params; const query = await searchParams;
  const { profile } = await requireAdmin(`/admin/payments/${id}`);
  const supabase = await createServerSupabaseClient();
  const { data: payment } = await supabase.from("payments").select("*").eq("id", id).maybeSingle();
  if (!payment) notFound();
  const [{ data: course }, { data: student }, proof] = await Promise.all([
    supabase.from("courses").select("*").eq("id", payment.course_id).maybeSingle(),
    supabase.from("profiles").select("*").eq("id", payment.student_id).maybeSingle(),
    payment.proof_path ? supabase.storage.from("payment-proofs").createSignedUrl(payment.proof_path, 300) : Promise.resolve({ data: null }),
  ]);
  return <DashboardShell admin eyebrow="Payment verification" title={course?.title ?? "Payment request"} profile={profile}><Link href="/admin/payments" className="font-extrabold text-blue-700 hover:underline">← Payment reviews</Link>{query.error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">The review could not be saved. A rejection must include a reason.</div>}<div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"><Card className="overflow-hidden p-4">{proof.data?.signedUrl ? <Image src={proof.data.signedUrl} alt="Student payment proof" width={1200} height={1600} unoptimized className="mx-auto max-h-[680px] w-auto rounded-xl object-contain" /> : <div className="grid min-h-80 place-items-center text-slate-500">Payment proof is unavailable.</div>}</Card><div><Card className="p-6"><h2 className="text-xl font-extrabold">Request details</h2><dl className="mt-5 space-y-4 text-sm"><Row label="Student" value={student?.full_name ?? "Unavailable"} /><Row label="Course" value={course?.title ?? "Unavailable"} /><Row label="Amount" value={formatCoursePrice(Number(payment.amount), payment.currency)} /><Row label="Status" value={payment.status === "failed" ? "Rejected" : payment.status} /></dl>{payment.student_note && <div className="mt-5 rounded-xl bg-slate-50 p-4"><p className="text-sm font-extrabold">Student note</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{payment.student_note}</p></div>}</Card>{payment.status === "pending" ? <Card className="mt-5 p-6"><h2 className="text-xl font-extrabold">Decision</h2><form action={reviewCoursePayment} className="mt-5 space-y-4"><input type="hidden" name="payment_id" value={payment.id} /><div className="space-y-2"><Label htmlFor="admin_message">Message / rejection reason</Label><textarea id="admin_message" name="admin_message" maxLength={2000} rows={4} className="w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Required when rejecting. Optional approval note." /></div><div className="grid gap-3 sm:grid-cols-2"><Button name="decision" value="approve" className="bg-emerald-600 font-extrabold hover:bg-emerald-700">Approve payment</Button><Button name="decision" value="reject" variant="destructive" className="font-extrabold">Reject with reason</Button></div></form></Card> : <Card className="mt-5 p-6"><p className="font-extrabold">Review completed</p>{payment.admin_message && <p className="mt-2 leading-7 text-slate-600">{payment.admin_message}</p>}</Card>}</div></div></DashboardShell>;
}

function Row({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4 border-b border-slate-100 pb-3"><dt className="font-bold text-slate-500">{label}</dt><dd className="text-right font-extrabold capitalize text-slate-900">{value}</dd></div>; }
