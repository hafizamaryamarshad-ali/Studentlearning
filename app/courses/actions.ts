"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStudent } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const value = (formData: FormData, key: string) => String(formData.get(key) ?? "");

export async function enrollInCourse(formData: FormData) {
  const slug = value(formData, "slug");
  const returnTo = `/courses/${encodeURIComponent(slug)}`;
  const { profile } = await requireStudent(returnTo);
  const supabase = await createServerSupabaseClient();
  const { data: course } = await supabase.from("courses").select("*").eq("slug", slug).eq("status", "published").maybeSingle();

  if (!course) redirect(`${returnTo}?error=unavailable`);
  if (Number(course.price) > 0) redirect(`${returnTo}?notice=payment-required`);

  const { error } = await supabase.from("enrollments").insert({
    student_id: profile.id,
    course_id: course.id,
    status: "active",
    progress_percentage: 0,
  });
  if (error?.code === "23505") redirect(`${returnTo}?notice=already-enrolled`);
  if (error) redirect(`${returnTo}?error=enrollment`);

  revalidatePath(returnTo);
  revalidatePath("/student");
  redirect(`${returnTo}?notice=enrolled`);
}

export async function markLessonComplete(formData: FormData) {
  const slug = value(formData, "slug");
  const lessonId = value(formData, "lessonId");
  const returnTo = `/courses/${encodeURIComponent(slug)}/lessons/${encodeURIComponent(lessonId)}`;
  const { profile } = await requireStudent(returnTo);
  const supabase = await createServerSupabaseClient();
  const { data: outlineLesson } = await supabase.from("course_outline").select("*").eq("course_slug", slug).eq("lesson_id", lessonId).maybeSingle();
  if (!outlineLesson) redirect(`${returnTo}?error=unavailable`);

  const { error } = await supabase.from("lesson_progress").upsert({
    student_id: profile.id,
    lesson_id: lessonId,
    completed: true,
    completed_at: new Date().toISOString(),
  }, { onConflict: "student_id,lesson_id" });

  if (error) redirect(`${returnTo}?error=progress`);
  revalidatePath(returnTo);
  revalidatePath(`/courses/${slug}`);
  revalidatePath("/student");
  redirect(`${returnTo}?notice=completed`);
}
