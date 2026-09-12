import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Quiz } from "@/lib/supabase/types";

export type LessonChoice = { id: string; label: string };

export function QuizForm({ action, quiz, lessons }: { action: (data: FormData) => void | Promise<void>; quiz?: Quiz; lessons: LessonChoice[] }) {
  return <form action={action} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
    {quiz && <input type="hidden" name="id" value={quiz.id} />}
    <div className="space-y-2"><Label htmlFor="title">Quiz title</Label><Input id="title" name="title" defaultValue={quiz?.title} required maxLength={160} className="h-12 rounded-xl" /></div>
    <div className="space-y-2"><Label htmlFor="description">Instructions</Label><textarea id="description" name="description" defaultValue={quiz?.description ?? ""} rows={4} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></div>
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-2"><Label htmlFor="lesson_id">Course lesson</Label><select id="lesson_id" name="lesson_id" defaultValue={quiz?.lesson_id} required className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"><option value="">Select a lesson</option>{lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.label}</option>)}</select></div>
      <div className="space-y-2"><Label htmlFor="passing_score">Passing percentage</Label><Input id="passing_score" name="passing_score" type="number" min="0" max="100" step="1" defaultValue={quiz?.passing_score ?? 70} required className="h-12 rounded-xl" /></div>
    </div>
    <Button type="submit" size="lg" className="h-12 rounded-xl bg-blue-600 px-6 font-extrabold hover:bg-blue-700"><Save className="h-5 w-5" />{quiz ? "Save quiz details" : "Create draft quiz"}</Button>
  </form>;
}
