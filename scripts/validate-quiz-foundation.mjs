import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path) => readFileSync(resolve(path), "utf8");
const migration = read("supabase/migrations/202609120005_quiz_assessment_foundation.sql");
const studentAction = read("app/quizzes/actions.ts");
const adminAction = read("app/admin/quizzes/actions.ts");
const quizPage = read("app/courses/[slug]/lessons/[lessonId]/quizzes/[quizId]/page.tsx");
const resultPage = read("app/courses/[slug]/lessons/[lessonId]/quizzes/[quizId]/attempts/[attemptId]/page.tsx");

const checks = [
  ["published quiz gate", migration, /Enrolled students can read published quizzes/],
  ["question feed hides answer key", migration, /returns table\s*\([\s\S]*question_id[\s\S]*options[\s\S]*points[\s\S]*sort_order[\s\S]*\)/],
  ["server-side grading function", migration, /function public\.submit_quiz_attempt/],
  ["idempotent submission constraint", migration, /quiz_attempts_submission_unique/],
  ["student and enrollment verification", migration, /p\.role = 'student'.*[\s\S]*e\.status in \('active', 'completed'\)/],
  ["quiz admin policy", migration, /Admins can manage quizzes/],
  ["question admin policy", migration, /Admins can manage quiz questions/],
  ["anonymous RPC access revoked", migration, /revoke all on function public\.submit_quiz_attempt\(uuid, jsonb, uuid\) from public, anon/],
  ["admin mutations require admin", adminAction, /requireAdmin/],
  ["student submission uses database RPC", studentAction, /rpc\("submit_quiz_attempt"/],
  ["student question page uses safe RPC", quizPage, /rpc\("get_quiz_questions"/],
  ["student page does not request correct_answer", quizPage, /^(?![\s\S]*correct_answer)[\s\S]*get_quiz_questions/],
  ["result ownership is scoped", resultPage, /eq\("student_id", profile\.id\)/],
];

const failures = checks.filter(([, source, pattern]) => !pattern.test(source));
if (failures.length) {
  for (const [label] of failures) console.error(`Missing: ${label}`);
  process.exit(1);
}
console.log(`Quiz foundation validation passed (${checks.length} checks).`);
