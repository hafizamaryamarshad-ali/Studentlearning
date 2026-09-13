"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const value = (data: FormData, key: string) => String(data.get(key) ?? "").trim();
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function savePaymentSettings(data: FormData) {
  const { profile } = await requireAdmin("/admin/payments/settings");
  const paymentMethod = value(data, "payment_method");
  const accountTitle = value(data, "account_title");
  const accountNumber = value(data, "account_number");
  const instructions = value(data, "instructions");
  const isActive = value(data, "is_active") === "on";
  if (paymentMethod.length < 2 || accountTitle.length < 2 || accountNumber.length < 4 || instructions.length > 2000) redirect("/admin/payments/settings?error=invalid");
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("payment_settings").upsert({ id: true, payment_method: paymentMethod, account_title: accountTitle, account_number: accountNumber, instructions: instructions || null, is_active: isActive, updated_by: profile.id });
  if (error) redirect("/admin/payments/settings?error=save");
  revalidatePath("/admin/payments/settings");
  revalidatePath("/courses");
  redirect("/admin/payments/settings?notice=saved");
}

export async function reviewCoursePayment(data: FormData) {
  await requireAdmin("/admin/payments");
  const paymentId = value(data, "payment_id");
  const decision = value(data, "decision");
  const message = value(data, "admin_message");
  if (!uuidPattern.test(paymentId) || !["approve", "reject"].includes(decision) || (decision === "reject" && !message)) redirect(`/admin/payments/${encodeURIComponent(paymentId)}?error=invalid`);
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("review_course_payment", { p_payment_id: paymentId, p_decision: decision as "approve" | "reject", p_admin_message: message });
  if (error) redirect(`/admin/payments/${paymentId}?error=review`);
  revalidatePath("/admin/payments");
  revalidatePath("/student");
  revalidatePath("/student/purchases");
  redirect(`/admin/payments?notice=${decision === "approve" ? "approved" : "rejected"}`);
}
