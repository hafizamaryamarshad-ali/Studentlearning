import Link from "next/link";
import { BookOpen, ClipboardCheck, ClipboardList, CreditCard, Users } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const tools = [
  [BookOpen, "Courses", "Create, price, publish, and organize learning content.", "/admin/courses", "Manage courses", "bg-blue-600"],
  [ClipboardCheck, "Quizzes", "Build secure assessments and publish them for students.", "/admin/quizzes", "Manage quizzes", "bg-violet-600"],
  [CreditCard, "Payments", "Configure receiving details and review student payment proofs.", "/admin/payments", "Review payments", "bg-emerald-600"],
  [ClipboardList, "Practical tasks", "Publish practice work and review student submissions.", "/admin/tasks", "Manage tasks", "bg-orange-600"],
  [Users, "Students", "Review student profiles and enrollment activity.", "/admin/students", "View students", "bg-teal-600"],
] as const;

export default async function AdminDashboard() {
  const { profile } = await requireAdmin();
  return <DashboardShell admin eyebrow="Admin workspace" title="Manage learning" profile={profile}><div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-950"><p className="font-extrabold">Simple admin flow</p><p className="mt-1 text-sm leading-6 text-blue-800">Manage courses, quizzes and tasks, review payment proofs, and check every registered student from one place.</p></div><div className="mt-6 grid gap-4 sm:grid-cols-2">{tools.map(([Icon, title, text, href, label, tone]) => <Card key={title} className="p-6"><span className={`grid h-11 w-11 place-items-center rounded-xl text-white ${tone}`}><Icon className="h-5 w-5" /></span><h2 className="mt-5 text-xl font-extrabold">{title}</h2><p className="mt-2 leading-7 text-slate-600">{text}</p><Link href={href} className="mt-5 inline-flex font-extrabold text-blue-700 hover:underline">{label} →</Link></Card>)}</div></DashboardShell>;
}
