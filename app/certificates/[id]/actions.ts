"use server";

import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function claimCertificate(data: FormData) {
  const certificateId = String(data.get("certificate_id") ?? "");
  const fullName = String(data.get("full_name") ?? "").trim();
  const email = String(data.get("email") ?? "").trim().toLowerCase();
  const path = `/certificates/${certificateId}`;
  await requireStudent(path);
  if (!uuidPattern.test(certificateId) || fullName.length < 2 || fullName.length > 120 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) redirect(`${path}?error=details`);
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("claim_certificate", { p_certificate_id: certificateId, p_full_name: fullName, p_email: email || null });
  if (error) redirect(`${path}?error=claim`);
  redirect(`${path}?notice=ready`);
}
