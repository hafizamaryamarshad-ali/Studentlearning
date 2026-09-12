"use server";

import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function submitQuiz(data: FormData) {
  const quizId = String(data.get("quiz_id") ?? "");
  const lessonId = String(data.get("lesson_id") ?? "");
  const slug = String(data.get("slug") ?? "");
  const token = String(data.get("submission_token") ?? "");
  const returnPath = `/courses/${encodeURIComponent(slug)}/lessons/${lessonId}/quizzes/${quizId}`;
  await requireStudent(returnPath);
  if (!uuidPattern.test(quizId) || !uuidPattern.test(lessonId) || !uuidPattern.test(token) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) redirect(`/courses?error=quiz`);

  const answers: Record<string, Json> = {};
  for (const [key, entry] of data.entries()) {
    if (key.startsWith("answer_") && uuidPattern.test(key.slice(7)) && typeof entry === "string") answers[key.slice(7)] = entry;
  }

  const supabase = await createServerSupabaseClient();
  const { data: result, error } = await supabase.rpc("submit_quiz_attempt", { p_quiz_id: quizId, p_answers: answers, p_submission_token: token });
  const attempt = result?.[0];
  if (error || !attempt) redirect(`${returnPath}?error=${error?.message.includes("answer") ? "answers" : "submit"}`);
  redirect(`${returnPath}/attempts/${attempt.attempt_id}`);
}
