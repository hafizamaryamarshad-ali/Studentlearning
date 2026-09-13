"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function submitTaskWork(data: FormData) {
  const taskId = String(data.get("task_id") ?? "");
  const token = String(data.get("submission_token") ?? "");
  const path = `/tasks/${taskId}`;
  await requireStudent(path);
  if (!uuidPattern.test(taskId) || !uuidPattern.test(token)) redirect("/tasks?error=invalid");
  const submissionText = String(data.get("submission_text") ?? "").trim();
  const submissionUrl = String(data.get("submission_url") ?? "").trim();
  if (submissionText.length > 20000 || submissionUrl.length > 2048) redirect(`${path}?error=invalid`);
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("submit_task_work", { p_task_id: taskId, p_submission_text: submissionText, p_submission_url: submissionUrl, p_submission_token: token });
  if (error) {
    const code = error.message.includes("DEADLINE") ? "deadline" : error.message.includes("RESUBMISSION") ? "locked" : error.message.includes("URL") ? "url" : error.message.includes("REQUIRED") ? "required" : "submit";
    redirect(`${path}?error=${code}`);
  }
  revalidatePath(path); revalidatePath("/tasks"); revalidatePath("/student");
  redirect(`${path}?notice=submitted`);
}
