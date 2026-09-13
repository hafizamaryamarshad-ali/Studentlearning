import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import type { Course } from "@/lib/supabase/types";
import { formatCoursePrice } from "@/lib/courses/format";

export function CourseCard({ course }: { course: Course }) {
  return <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100/70"><div className="relative grid aspect-[16/9] place-items-center overflow-hidden bg-gradient-to-br from-blue-100 via-slate-50 to-teal-100">{course.thumbnail_url ? <div role="img" aria-label={`${course.title} thumbnail`} className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(course.thumbnail_url).slice(1, -1)})` }} /> : <BookOpen className="h-10 w-10 text-blue-600" />}<span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-sm font-extrabold text-blue-700 shadow-sm">{formatCoursePrice(Number(course.price), course.currency)}</span></div><div className="p-6"><h2 className="text-xl font-black tracking-tight text-slate-950">{course.title}</h2><p className="mt-3 line-clamp-3 leading-7 text-slate-600">{course.short_description}</p><Link href={`/courses/${course.slug}`} className="mt-6 inline-flex items-center gap-2 font-extrabold text-blue-700 hover:text-blue-800">{Number(course.price) > 0 ? "Purchase course" : "Enroll free"} <ArrowRight className="h-4 w-4" /></Link></div></article>;
}
