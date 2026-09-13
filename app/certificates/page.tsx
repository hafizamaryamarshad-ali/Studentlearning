import Link from "next/link";
import { Award } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { requireStudent } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CertificatesPage() {
  const { profile } = await requireStudent("/certificates");
  const supabase = await createServerSupabaseClient();
  const [{ data: certificates, error }, { data: courses }] = await Promise.all([
    supabase.from("certificates").select("*").eq("student_id", profile.id).order("issued_at", { ascending: false }),
    supabase.from("courses").select("*"),
  ]);
  const courseMap = new Map((courses ?? []).map((course) => [course.id, course]));
  return <DashboardShell eyebrow="Verified achievement" title="Certificates" profile={profile}><p className="mb-7 max-w-2xl leading-7 text-slate-600">A certificate is issued automatically when you pass an eligible quiz. Each certificate has a public QR verification link.</p>{error ? <Card className="border-red-200 bg-red-50 p-6 text-red-900">Certificates could not be loaded.</Card> : !certificates?.length ? <Card className="p-10 text-center"><Award className="mx-auto h-10 w-10 text-slate-400" /><h2 className="mt-4 text-xl font-extrabold">No certificates yet</h2><p className="mt-2 text-slate-600">Pass a course quiz to earn your first verified certificate.</p><Link href="/quizzes" className="mt-5 inline-flex font-extrabold text-blue-700 hover:underline">Browse quizzes →</Link></Card> : <div className="grid gap-5 sm:grid-cols-2">{certificates.map((certificate) => <Card key={certificate.id} className="p-6"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700"><Award className="h-6 w-6" /></span><p className="mt-5 text-sm font-extrabold uppercase tracking-wider text-blue-600">{courseMap.get(certificate.course_id)?.title ?? "SkillSpring"}</p><h2 className="mt-2 text-xl font-black">{certificate.quiz_title ?? "Quiz achievement"}</h2><p className="mt-3 text-slate-600">Score: {certificate.score ?? 0}/{certificate.max_score ?? 0} · {certificate.percentage ?? 0}%</p><Link href={`/certificates/${certificate.id}`} className="mt-5 inline-flex font-extrabold text-blue-700 hover:underline">View certificate →</Link></Card>)}</div>}</DashboardShell>;
}
