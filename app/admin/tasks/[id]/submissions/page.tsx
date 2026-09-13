import Link from "next/link";
import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { submissionStatusLabel, submissionStatusTone } from "@/lib/tasks/format";

export const dynamic = "force-dynamic";

export default async function TaskSubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const { profile } = await requireAdmin(`/admin/tasks/${id}/submissions`); const supabase = await createServerSupabaseClient();
  const [{ data: task }, { data: submissions, error }] = await Promise.all([supabase.from("tasks").select("*").eq("id", id).maybeSingle(), supabase.from("task_submissions").select("*").eq("task_id", id).order("submitted_at", { ascending: false })]);
  if (!task) redirect("/admin/tasks");
  const studentIds = (submissions ?? []).map((submission) => submission.student_id); const students = studentIds.length ? (await supabase.from("profiles").select("*").in("id", studentIds)).data ?? [] : []; const studentMap = new Map(students.map((student) => [student.id, student]));
  return <DashboardShell admin eyebrow="Submission review" title={task.title} profile={profile}><div className="mb-6 flex flex-wrap gap-4"><Link href={`/admin/tasks/${id}/edit`} className="font-extrabold text-blue-700 hover:underline">← Task details</Link><Link href="/admin/tasks" className="font-extrabold text-slate-600 hover:underline">All tasks</Link></div>{error ? <Card className="border-red-200 bg-red-50 p-6 text-red-900">Submissions could not be loaded.</Card> : !submissions?.length ? <Card className="p-10 text-center"><Inbox className="mx-auto h-10 w-10 text-slate-400" /><h2 className="mt-4 text-xl font-extrabold">No submissions yet</h2><p className="mt-2 text-slate-600">Student work will appear here after submission.</p></Card> : <Card className="overflow-hidden p-0"><Table><TableHeader><TableRow><TableHead className="px-5">Student</TableHead><TableHead>Status</TableHead><TableHead>Score</TableHead><TableHead>Submitted</TableHead><TableHead className="pr-5 text-right">Action</TableHead></TableRow></TableHeader><TableBody>{submissions.map((submission) => { const student = studentMap.get(submission.student_id); return <TableRow key={submission.id}><TableCell className="px-5"><strong className="block">{student?.full_name ?? "Student"}</strong><span className="text-sm text-slate-500">{student?.email ?? ""}</span></TableCell><TableCell><span className={`rounded-full px-3 py-1 text-xs font-extrabold ${submissionStatusTone(submission.status)}`}>{submissionStatusLabel[submission.status]}</span></TableCell><TableCell>{submission.awarded_points}/{task.points}</TableCell><TableCell>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(submission.submitted_at))}</TableCell><TableCell className="pr-5 text-right"><Link href={`/admin/tasks/${id}/submissions/${submission.id}`} className="font-extrabold text-blue-700 hover:underline">Open review</Link></TableCell></TableRow>; })}</TableBody></Table></Card>}</DashboardShell>;
}
