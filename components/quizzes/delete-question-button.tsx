"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function DeleteQuestionButton({ action, quizId, questionId }: { action: (data: FormData) => void | Promise<void>; quizId: string; questionId: string }) {
  return <AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" />Delete</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this question?</AlertDialogTitle><AlertDialogDescription>This permanently removes the question from the quiz. Existing attempt summaries remain unchanged.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep question</AlertDialogCancel><form action={action}><input type="hidden" name="quiz_id" value={quizId} /><input type="hidden" name="question_id" value={questionId} /><AlertDialogAction type="submit" className="bg-red-600 text-white hover:bg-red-700">Delete question</AlertDialogAction></form></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}
