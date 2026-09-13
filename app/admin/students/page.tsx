import Link from "next/link";
import { Users } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage() {
  const { profile } = await requireAdmin("/admin/students");
  const supabase = await createServerSupabaseClient();
  const { data: students, error } = await supabase.from("profiles").select("*").eq("role", "student").order("created_at", { ascending: false });
  const studentIds = (students ?? []).map((student) => student.id);
  const enrollments = studentIds.length
    ? (await supabase.from("enrollments").select("*").in("student_id", studentIds)).data ?? []
    : [];

  return <DashboardShell admin eyebrow="Student management" title="Students" profile={profile}>
    <p className="mb-6 max-w-2xl leading-7 text-slate-600">Review learner accounts and enrollment activity. Role changes and account deletion remain restricted to trusted administrative processes.</p>
    {error ? <Card className="border-red-200 bg-red-50 p-6 text-red-900">Student records could not be loaded. Check the database connection and try again.</Card> : !students?.length ? <Card className="p-10 text-center"><Users className="mx-auto h-10 w-10 text-slate-400" /><h2 className="mt-4 text-xl font-extrabold">No students yet</h2><p className="mt-2 text-slate-600">Verified student accounts will appear here after signup.</p></Card> : <Card className="overflow-hidden p-0"><Table><TableHeader><TableRow><TableHead className="px-5">Student</TableHead><TableHead>Email</TableHead><TableHead>Enrollments</TableHead><TableHead>Joined</TableHead><TableHead className="pr-5">Manage</TableHead></TableRow></TableHeader><TableBody>{students.map((student) => <TableRow key={student.id}><TableCell className="px-5 font-extrabold">{student.full_name}</TableCell><TableCell>{student.email}</TableCell><TableCell>{enrollments.filter((enrollment) => enrollment.student_id === student.id).length}</TableCell><TableCell>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(student.created_at))}</TableCell><TableCell className="pr-5"><Link href={`/admin/students/${student.id}`} className="font-extrabold text-blue-700 hover:underline">Open</Link></TableCell></TableRow>)}</TableBody></Table></Card>}
  </DashboardShell>;
}
