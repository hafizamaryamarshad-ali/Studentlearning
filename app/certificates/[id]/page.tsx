import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { Award, BadgeCheck } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireStudent } from "@/lib/auth/session";
import { certificateVerificationUrl } from "@/lib/certificates/url";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile } = await requireStudent(`/certificates/${id}`);
  const supabase = await createServerSupabaseClient();
  const { data: certificate } = await supabase.from("certificates").select("*").eq("id", id).eq("student_id", profile.id).maybeSingle();
  if (!certificate) notFound();
  const { data: course } = await supabase.from("courses").select("*").eq("id", certificate.course_id).maybeSingle();
  const verifyUrl = certificateVerificationUrl(certificate.verification_token);
  const qr = await QRCode.toDataURL(verifyUrl, { width: 240, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } });
  return <DashboardShell eyebrow="Verified achievement" title="Certificate" profile={profile}><Link href="/certificates" className="font-extrabold text-blue-700 hover:underline">← Your certificates</Link><article className="relative mt-6 overflow-hidden rounded-3xl border-8 border-double border-blue-900 bg-white px-6 py-12 text-center shadow-xl sm:px-12"><div className="absolute inset-x-0 top-0 h-3 bg-gradient-to-r from-blue-700 via-teal-500 to-blue-700" /><Award className="mx-auto h-14 w-14 text-amber-500" /><p className="mt-5 text-sm font-extrabold uppercase tracking-[.25em] text-blue-700">SkillSpring Certificate of Achievement</p><h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">{certificate.quiz_title ?? "Quiz Achievement"}</h1><p className="mt-6 text-lg text-slate-600">Presented to</p><p className="mt-2 text-3xl font-black text-slate-950">{certificate.student_name ?? profile.full_name}</p><p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">for successfully completing the <strong>{course?.title ?? "SkillSpring course"}</strong> assessment with a score of <strong>{certificate.score ?? 0}/{certificate.max_score ?? 0} ({certificate.percentage ?? 0}%)</strong>.</p><div className="mx-auto mt-8 flex max-w-xl flex-col items-center justify-between gap-6 border-t border-slate-200 pt-8 sm:flex-row"><div className="text-left"><p className="flex items-center gap-2 font-extrabold text-emerald-700"><BadgeCheck className="h-5 w-5" />Verified achievement</p><p className="mt-2 text-sm text-slate-500">Certificate {certificate.certificate_number}</p><p className="mt-1 text-sm text-slate-500">Issued {new Date(certificate.issued_at).toLocaleDateString("en-PK")}</p></div><div><Image src={qr} alt="QR code for certificate verification" width={180} height={180} unoptimized className="rounded-xl border border-slate-200" /><p className="mt-2 text-xs font-bold text-slate-500">Scan to verify</p></div></div></article></DashboardShell>;
}
