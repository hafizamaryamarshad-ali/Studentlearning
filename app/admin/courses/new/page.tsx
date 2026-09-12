import Link from "next/link";
import { createCourse } from "@/app/admin/courses/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { CourseForm } from "@/components/courses/course-form";
import { requireAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = { invalid: "Complete every required field with a valid slug and non-negative price.", slug: "That course slug is already in use.", save: "The course could not be saved. Please try again." };

export default async function NewCoursePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { profile } = await requireAdmin("/admin/courses/new");
  const { error } = await searchParams;
  return <DashboardShell admin eyebrow="Course management" title="Create a course" profile={profile}><Link href="/admin/courses" className="mb-6 inline-flex font-extrabold text-blue-700 hover:underline">← All courses</Link>{error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">{errors[error] ?? errors.save}</div>}<CourseForm action={createCourse} /></DashboardShell>;
}
