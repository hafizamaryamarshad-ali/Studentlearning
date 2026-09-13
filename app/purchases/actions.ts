"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const allowedFiles = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);

export async function submitCoursePayment(data: FormData) {
  const courseId = String(data.get("course_id") ?? "");
  const slug = String(data.get("slug") ?? "");
  const studentNote = String(data.get("student_note") ?? "").trim();
  const proof = data.get("proof");
  const returnTo = slugPattern.test(slug) ? `/courses/${slug}` : "/courses";
  const { profile } = await requireStudent(returnTo);

  if (!uuidPattern.test(courseId) || !slugPattern.test(slug) || studentNote.length > 1000 || !(proof instanceof File)) redirect(`${returnTo}?error=payment-invalid`);
  const extension = allowedFiles.get(proof.type);
  if (!extension || proof.size < 1 || proof.size > 5 * 1024 * 1024) redirect(`${returnTo}?error=payment-file`);

  const supabase = await createServerSupabaseClient();
  const path = `${profile.id}/${courseId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(path, proof, { contentType: proof.type, upsert: false });
  if (uploadError) redirect(`${returnTo}?error=payment-upload`);

  const { error } = await supabase.rpc("submit_course_payment", {
    p_course_id: courseId,
    p_proof_path: path,
    p_student_note: studentNote,
    p_submission_token: crypto.randomUUID(),
  });
  if (error) {
    await supabase.storage.from("payment-proofs").remove([path]);
    const code = error.message.includes("PENDING") ? "payment-pending" : error.message.includes("INSTRUCTIONS") ? "payment-settings" : "payment-submit";
    redirect(`${returnTo}?error=${code}`);
  }

  revalidatePath(returnTo);
  revalidatePath("/student");
  revalidatePath("/student/purchases");
  revalidatePath("/admin/payments");
  redirect(`${returnTo}?notice=payment-submitted`);
}
