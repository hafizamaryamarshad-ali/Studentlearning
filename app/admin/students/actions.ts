"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function updateStudentCourseAccess(data: FormData) {
  await requireAdmin("/admin/students");
  const studentId = String(data.get("student_id") ?? "");
  const enrollmentId = String(data.get("enrollment_id") ?? "");
  const status = String(data.get("status") ?? "");
  const path = `/admin/students/${studentId}`;
  if (!uuidPattern.test(studentId) || !uuidPattern.test(enrollmentId) || !["active", "cancelled"].includes(status)) redirect(`${path}?error=invalid`);
  const supabase = await createServerSupabaseClient();
  const { data: student } = await supabase.from("profiles").select("id").eq("id", studentId).eq("role", "student").maybeSingle();
  if (!student) redirect("/admin/students?error=missing");
  const { error } = await supabase.from("enrollments").update({ status: status as "active" | "cancelled" }).eq("id", enrollmentId).eq("student_id", studentId);
  if (error) redirect(`${path}?error=access`);
  revalidatePath(path);
  revalidatePath("/admin/students");
  redirect(`${path}?notice=access-updated`);
}
