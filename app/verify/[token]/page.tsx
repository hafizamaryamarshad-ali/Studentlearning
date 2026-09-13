import Link from "next/link";
import { BadgeCheck, BadgeX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function VerifyCertificatePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("verify_certificate", { p_token: token });
  const certificate = data?.[0];
  return <div className="min-h-screen bg-slate-50"><Navbar /><main className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">{error || !certificate ? <Card className="border-red-200 p-8 text-center"><BadgeX className="mx-auto h-14 w-14 text-red-500" /><h1 className="mt-5 text-3xl font-black">Certificate not verified</h1><p className="mt-3 leading-7 text-slate-600">This verification code is invalid or the certificate is no longer active.</p></Card> : <Card className="border-emerald-200 p-8 text-center sm:p-12"><BadgeCheck className="mx-auto h-16 w-16 text-emerald-600" /><p className="mt-5 text-sm font-extrabold uppercase tracking-[.2em] text-emerald-700">Verified SkillSpring certificate</p><h1 className="mt-4 text-3xl font-black sm:text-4xl">{certificate.quiz_title}</h1><p className="mt-4 text-lg text-slate-600">Awarded to <strong className="text-slate-950">{certificate.student_name}</strong></p><dl className="mx-auto mt-8 grid max-w-xl gap-4 text-left sm:grid-cols-2"><Detail label="Course" value={certificate.course_title} /><Detail label="Score" value={`${certificate.score}/${certificate.max_score} (${certificate.percentage}%)`} /><Detail label="Certificate" value={certificate.certificate_number} /><Detail label="Issued" value={new Date(certificate.issued_at).toLocaleDateString("en-PK")} /></dl></Card>}<div className="mt-8 text-center"><Link href="/" className="font-extrabold text-blue-700 hover:underline">Return to SkillSpring</Link></div></main><Footer /></div>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-4"><dt className="text-sm font-bold text-slate-500">{label}</dt><dd className="mt-1 font-extrabold text-slate-950">{value}</dd></div>; }
