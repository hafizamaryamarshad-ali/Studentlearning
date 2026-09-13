"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CourseStatus } from "@/lib/supabase/types";

const text = (data: FormData, key: string) => String(data.get(key) ?? "").trim();
const statuses: CourseStatus[] = ["draft", "published", "archived"];
const fail = (path: string, code = "invalid"): never => redirect(`${path}?error=${code}`);

function courseInput(data: FormData) {
  const title = text(data, "title");
  const slug = text(data, "slug").toLowerCase();
  const shortDescription = text(data, "short_description");
  const description = text(data, "description");
  const thumbnailUrl = text(data, "thumbnail_url");
  const price = Number(text(data, "price"));
  const currency = text(data, "currency").toUpperCase();
  const status = text(data, "status") as CourseStatus;
  if (!title || !slug || !shortDescription || !description) return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !Number.isFinite(price) || price < 0 || !["PKR", "USD"].includes(currency) || !statuses.includes(status)) return null;
  return { title, slug, short_description: shortDescription, description, thumbnail_url: thumbnailUrl || null, price, currency, status };
}

export async function createCourse(data: FormData) {
  await requireAdmin();
  const input = courseInput(data);
  if (!input) return fail("/admin/courses/new");
  const supabase = await createServerSupabaseClient();
  const { data: course, error } = await supabase.from("courses").insert(input).select("*").single();
  if (error?.code === "23505") fail("/admin/courses/new", "slug");
  if (error || !course) return fail("/admin/courses/new", "save");
  revalidatePath("/courses");
  revalidatePath("/admin/courses");
  redirect(`/admin/courses/${course.id}/edit?notice=created`);
}

export async function updateCourse(data: FormData) {
  await requireAdmin();
  const id = text(data, "id");
  const input = courseInput(data);
  const path = `/admin/courses/${id}/edit`;
  if (!id || !input) return fail(path);
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("courses").update(input).eq("id", id);
  if (error?.code === "23505") fail(path, "slug");
  if (error) fail(path, "save");
  revalidatePath("/courses");
  revalidatePath(path);
  redirect(`${path}?notice=saved`);
}

export async function changeCourseStatus(data: FormData) {
  await requireAdmin();
  const id = text(data, "id");
  const status = text(data, "status") as CourseStatus;
  const path = `/admin/courses/${id}/edit`;
  if (!id || !statuses.includes(status)) fail(path);
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("courses").update({ status }).eq("id", id);
  if (error) fail(path, "status");
  revalidatePath("/courses");
  revalidatePath("/admin/courses");
  redirect(`${path}?notice=${status}`);
}

export async function createModule(data: FormData) {
  await requireAdmin();
  const courseId = text(data, "courseId");
  const title = text(data, "title");
  const description = text(data, "description");
  const sortOrder = Number(text(data, "sort_order"));
  const path = `/admin/courses/${courseId}/edit`;
  if (!courseId || !title || !Number.isInteger(sortOrder) || sortOrder < 0) fail(path, "module");
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("course_modules").insert({ course_id: courseId, title, description: description || null, sort_order: sortOrder });
  if (error) fail(path, error.code === "23505" ? "module-order" : "module");
  revalidatePath(path);
  redirect(`${path}?notice=module-created`);
}

export async function updateModule(data: FormData) {
  await requireAdmin();
  const courseId = text(data, "courseId");
  const id = text(data, "moduleId");
  const title = text(data, "title");
  const description = text(data, "description");
  const sortOrder = Number(text(data, "sort_order"));
  const path = `/admin/courses/${courseId}/edit`;
  if (!courseId || !id || !title || !Number.isInteger(sortOrder) || sortOrder < 0) fail(path, "module");
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("course_modules").update({ title, description: description || null, sort_order: sortOrder }).eq("id", id).eq("course_id", courseId);
  if (error) fail(path, error.code === "23505" ? "module-order" : "module");
  revalidatePath(path);
  redirect(`${path}?notice=module-saved`);
}

export async function createLesson(data: FormData) {
  await requireAdmin();
  const courseId = text(data, "courseId");
  const moduleId = text(data, "moduleId");
  const title = text(data, "title");
  const description = text(data, "description");
  const content = text(data, "content");
  const videoUrl = text(data, "video_url");
  const sortOrder = Number(text(data, "sort_order"));
  const path = `/admin/courses/${courseId}/edit`;
  if (!courseId || !moduleId || !title || !Number.isInteger(sortOrder) || sortOrder < 0) fail(path, "lesson");
  const supabase = await createServerSupabaseClient();
  const { data: module } = await supabase.from("course_modules").select("*").eq("id", moduleId).eq("course_id", courseId).maybeSingle();
  if (!module) fail(path, "lesson");
  const { error } = await supabase.from("lessons").insert({ module_id: moduleId, title, description: description || null, content: content || null, video_url: videoUrl || null, sort_order: sortOrder });
  if (error) fail(path, error.code === "23505" ? "lesson-order" : "lesson");
  revalidatePath(path);
  redirect(`${path}?notice=lesson-created`);
}

export async function updateLesson(data: FormData) {
  await requireAdmin();
  const courseId = text(data, "courseId");
  const moduleId = text(data, "moduleId");
  const lessonId = text(data, "lessonId");
  const title = text(data, "title");
  const description = text(data, "description");
  const content = text(data, "content");
  const videoUrl = text(data, "video_url");
  const sortOrder = Number(text(data, "sort_order"));
  const path = `/admin/courses/${courseId}/edit`;
  if (!courseId || !moduleId || !lessonId || !title || !Number.isInteger(sortOrder) || sortOrder < 0) fail(path, "lesson");
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("lessons").update({ title, description: description || null, content: content || null, video_url: videoUrl || null, sort_order: sortOrder }).eq("id", lessonId).eq("module_id", moduleId);
  if (error) fail(path, error.code === "23505" ? "lesson-order" : "lesson");
  revalidatePath(path);
  redirect(`${path}?notice=lesson-saved`);
}
