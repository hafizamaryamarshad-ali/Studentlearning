"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const value = (data: FormData, key: string) => String(data.get(key) ?? "").trim();
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fail = (path: string, code: string): never => redirect(`${path}?error=${code}`);

function quizInput(data: FormData) {
  const title = value(data, "title");
  const description = value(data, "description");
  const lessonId = value(data, "lesson_id");
  const passingScore = Number(value(data, "passing_score"));
  if (!title || !uuidPattern.test(lessonId) || !Number.isInteger(passingScore) || passingScore < 0 || passingScore > 100) return null;
  return { title, description: description || null, lesson_id: lessonId, passing_score: passingScore };
}

function questionInput(data: FormData) {
  const question = value(data, "question");
  const options = ["option_0", "option_1", "option_2", "option_3", "option_4", "option_5"].map((key) => value(data, key)).filter(Boolean);
  const correctIndex = Number(value(data, "correct_index"));
  const points = Number(value(data, "points"));
  const sortOrder = Number(value(data, "sort_order"));
  if (!question || options.length < 2 || new Set(options.map((option) => option.toLowerCase())).size !== options.length) return null;
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) return null;
  if (!Number.isInteger(points) || points < 1 || !Number.isInteger(sortOrder) || sortOrder < 0) return null;
  return { question, options, correct_answer: options[correctIndex], points, sort_order: sortOrder };
}

export async function createQuiz(data: FormData) {
  await requireAdmin();
  const input = quizInput(data);
  if (input === null) return fail("/admin/quizzes/new", "invalid");
  const supabase = await createServerSupabaseClient();
  const { data: quiz, error } = await supabase.from("quizzes").insert(input).select("*").single();
  if (error || !quiz) return fail("/admin/quizzes/new", "save");
  revalidatePath("/admin/quizzes");
  redirect(`/admin/quizzes/${quiz.id}/edit?notice=created`);
}

export async function updateQuiz(data: FormData) {
  await requireAdmin();
  const id = value(data, "id");
  const path = `/admin/quizzes/${id}/edit`;
  const input = quizInput(data);
  if (!uuidPattern.test(id) || input === null) return fail(path, "invalid");
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("quizzes").update(input).eq("id", id);
  if (error) fail(path, "save");
  revalidatePath("/admin/quizzes");
  revalidatePath(path);
  redirect(`${path}?notice=saved`);
}

export async function changeQuizPublishState(data: FormData) {
  await requireAdmin();
  const id = value(data, "id");
  const publish = value(data, "publish") === "true";
  const path = `/admin/quizzes/${id}/edit`;
  if (!uuidPattern.test(id)) fail("/admin/quizzes", "invalid");
  const supabase = await createServerSupabaseClient();
  if (publish) {
    const { count, error: countError } = await supabase.from("quiz_questions").select("id", { count: "exact", head: true }).eq("quiz_id", id);
    if (countError || !count) fail(path, "empty");
  }
  const { error } = await supabase.from("quizzes").update({ is_published: publish }).eq("id", id);
  if (error) fail(path, "publish");
  revalidatePath("/admin/quizzes");
  revalidatePath(path);
  redirect(`${path}?notice=${publish ? "published" : "unpublished"}`);
}

export async function createQuestion(data: FormData) {
  await requireAdmin();
  const quizId = value(data, "quiz_id");
  const path = `/admin/quizzes/${quizId}/edit`;
  const input = questionInput(data);
  if (!uuidPattern.test(quizId) || input === null) return fail(path, "question-invalid");
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("quiz_questions").insert({ quiz_id: quizId, ...input });
  if (error) fail(path, error.code === "23505" ? "question-order" : "question-save");
  revalidatePath(path);
  redirect(`${path}?notice=question-created`);
}

export async function updateQuestion(data: FormData) {
  await requireAdmin();
  const quizId = value(data, "quiz_id");
  const questionId = value(data, "question_id");
  const path = `/admin/quizzes/${quizId}/edit`;
  const input = questionInput(data);
  if (!uuidPattern.test(quizId) || !uuidPattern.test(questionId) || input === null) return fail(path, "question-invalid");
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("quiz_questions").update(input).eq("id", questionId).eq("quiz_id", quizId);
  if (error) fail(path, error.code === "23505" ? "question-order" : "question-save");
  revalidatePath(path);
  redirect(`${path}?notice=question-saved`);
}

export async function deleteQuestion(data: FormData) {
  await requireAdmin();
  const quizId = value(data, "quiz_id");
  const questionId = value(data, "question_id");
  const path = `/admin/quizzes/${quizId}/edit`;
  if (!uuidPattern.test(quizId) || !uuidPattern.test(questionId)) fail(path, "question-delete");
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("quiz_questions").delete().eq("id", questionId).eq("quiz_id", quizId);
  if (error) fail(path, "question-delete");
  revalidatePath(path);
  redirect(`${path}?notice=question-deleted`);
}
