"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SubmissionStatus } from "@/lib/supabase/types";

const text = (data: FormData, key: string) => String(data.get(key) ?? "").trim();
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fail = (path: string, code: string): never => redirect(`${path}?error=${code}`);

function taskInput(data: FormData) {
  const title = text(data, "title");
  const description = text(data, "description");
  const courseId = text(data, "course_id");
  const moduleId = text(data, "module_id") || null;
  const lessonId = text(data, "lesson_id") || null;
  const submissionType = text(data, "submission_type");
  const points = Number(text(data, "points"));
  const deadlineValue = text(data, "deadline");
  const deadlineDate = deadlineValue ? new Date(deadlineValue) : null;
  if (!title || title.length > 180 || !description || description.length > 20000 || !uuidPattern.test(courseId)) return null;
  if (moduleId && !uuidPattern.test(moduleId) || lessonId && !uuidPattern.test(lessonId) || lessonId && !moduleId) return null;
  if (!['text', 'url'].includes(submissionType) || !Number.isInteger(points) || points < 0 || points > 10000) return null;
  if (deadlineDate && Number.isNaN(deadlineDate.getTime())) return null;
  return { title, description, course_id: courseId, module_id: moduleId, lesson_id: lessonId, submission_type: submissionType, points, deadline: deadlineDate?.toISOString() ?? null, resubmission_allowed: data.get("resubmission_allowed") === "on" };
}

async function scopeIsValid(courseId: string, moduleId: string | null, lessonId: string | null) {
  const supabase = await createServerSupabaseClient();
  const { data: course } = await supabase.from("courses").select("id").eq("id", courseId).maybeSingle();
  if (!course) return false;
  if (moduleId) {
    const { data: courseModule } = await supabase.from("course_modules").select("id").eq("id", moduleId).eq("course_id", courseId).maybeSingle();
    if (!courseModule) return false;
  }
  if (lessonId) {
    const { data: lesson } = await supabase.from("lessons").select("id").eq("id", lessonId).eq("module_id", moduleId!).maybeSingle();
    if (!lesson) return false;
  }
  return true;
}

export async function createTask(data: FormData) {
  await requireAdmin();
  const input = taskInput(data);
  if (input === null) return fail("/admin/tasks/new", "invalid");
  if (!await scopeIsValid(input.course_id, input.module_id, input.lesson_id)) return fail("/admin/tasks/new", "scope");
  const supabase = await createServerSupabaseClient();
  const { data: task, error } = await supabase.from("tasks").insert(input).select("*").single();
  if (error || !task) return fail("/admin/tasks/new", "save");
  revalidatePath("/admin/tasks");
  redirect(`/admin/tasks/${task.id}/edit?notice=created`);
}

export async function updateTask(data: FormData) {
  await requireAdmin();
  const id = text(data, "id");
  const path = `/admin/tasks/${id}/edit`;
  const input = taskInput(data);
  if (!uuidPattern.test(id) || input === null) return fail(path, "invalid");
  if (!await scopeIsValid(input.course_id, input.module_id, input.lesson_id)) return fail(path, "scope");
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("tasks").update(input).eq("id", id);
  if (error) return fail(path, "save");
  revalidatePath("/tasks"); revalidatePath("/admin/tasks"); revalidatePath(path);
  redirect(`${path}?notice=saved`);
}

export async function changeTaskPublishState(data: FormData) {
  await requireAdmin();
  const id = text(data, "id");
  const publish = text(data, "publish") === "true";
  const path = `/admin/tasks/${id}/edit`;
  if (!uuidPattern.test(id)) return fail("/admin/tasks", "invalid");
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("tasks").update({ is_published: publish }).eq("id", id);
  if (error) return fail(path, "publish");
  revalidatePath("/tasks"); revalidatePath("/admin/tasks"); revalidatePath(path);
  redirect(`${path}?notice=${publish ? "published" : "unpublished"}`);
}

export async function reviewSubmission(data: FormData) {
  await requireAdmin();
  const submissionId = text(data, "submission_id");
  const taskId = text(data, "task_id");
  const status = text(data, "status") as SubmissionStatus;
  const score = Number(text(data, "awarded_points"));
  const feedback = text(data, "feedback");
  const path = `/admin/tasks/${taskId}/submissions/${submissionId}`;
  const statuses: SubmissionStatus[] = ["under_review", "needs_revision", "approved", "rejected"];
  if (!uuidPattern.test(submissionId) || !uuidPattern.test(taskId) || !statuses.includes(status) || !Number.isInteger(score) || score < 0 || feedback.length > 10000) return fail(path, "invalid");
  if ((status === "needs_revision" || status === "rejected") && !feedback) return fail(path, "feedback");
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("review_task_submission", { p_submission_id: submissionId, p_status: status, p_awarded_points: score, p_feedback: feedback });
  if (error) return fail(path, error.message.includes("SCORE") ? "score" : "save");
  revalidatePath(`/admin/tasks/${taskId}/submissions`); revalidatePath(path); revalidatePath("/tasks");
  redirect(`${path}?notice=reviewed`);
}
