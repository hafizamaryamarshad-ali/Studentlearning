import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { QuizQuestion } from "@/lib/supabase/types";

function optionValues(question?: QuizQuestion) {
  const raw = Array.isArray(question?.options) ? question.options.filter((item): item is string => typeof item === "string") : [];
  return Array.from({ length: 6 }, (_, index) => raw[index] ?? "");
}

export function QuestionForm({ action, quizId, question, nextOrder }: { action: (data: FormData) => void | Promise<void>; quizId: string; question?: QuizQuestion; nextOrder?: number }) {
  const options = optionValues(question);
  const correctIndex = Math.max(0, options.findIndex((option) => option === question?.correct_answer));
  return <form action={action} className="space-y-5">
    <input type="hidden" name="quiz_id" value={quizId} />{question && <input type="hidden" name="question_id" value={question.id} />}
    <div className="space-y-2"><Label htmlFor={`question-${question?.id ?? "new"}`}>Question</Label><textarea id={`question-${question?.id ?? "new"}`} name="question" defaultValue={question?.question} required rows={3} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></div>
    <div className="grid gap-4 sm:grid-cols-2">{options.map((option, index) => <div key={index} className="space-y-2"><Label htmlFor={`option-${question?.id ?? "new"}-${index}`}>Option {index + 1}{index < 2 ? " *" : ""}</Label><Input id={`option-${question?.id ?? "new"}-${index}`} name={`option_${index}`} defaultValue={option} required={index < 2} className="h-11 rounded-xl" /></div>)}</div>
    <div className="grid gap-4 sm:grid-cols-3"><div className="space-y-2"><Label htmlFor={`correct-${question?.id ?? "new"}`}>Correct option</Label><select id={`correct-${question?.id ?? "new"}`} name="correct_index" defaultValue={correctIndex} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3">{options.map((_, index) => <option key={index} value={index}>Option {index + 1}</option>)}</select></div><div className="space-y-2"><Label htmlFor={`points-${question?.id ?? "new"}`}>Points</Label><Input id={`points-${question?.id ?? "new"}`} name="points" type="number" min="1" step="1" defaultValue={question?.points ?? 1} required className="h-11 rounded-xl" /></div><div className="space-y-2"><Label htmlFor={`order-${question?.id ?? "new"}`}>Order</Label><Input id={`order-${question?.id ?? "new"}`} name="sort_order" type="number" min="0" step="1" defaultValue={question?.sort_order ?? nextOrder ?? 0} required className="h-11 rounded-xl" /></div></div>
    <Button type="submit" className="rounded-xl bg-blue-600 font-extrabold hover:bg-blue-700"><Save className="h-4 w-4" />{question ? "Save question" : "Add question"}</Button>
  </form>;
}
