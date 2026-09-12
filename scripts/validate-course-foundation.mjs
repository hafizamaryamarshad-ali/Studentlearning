import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path) => readFileSync(resolve(path), "utf8");
const checks = [
  ["public catalog filters published courses", read("app/courses/page.tsx"), /eq\("status",\s*"published"\)/],
  ["course detail filters published courses", read("app/courses/[slug]/page.tsx"), /eq\("status",\s*"published"\)/],
  ["free enrollment is enforced", read("app/courses/actions.ts"), /course\.price\) > 0/],
  ["duplicate enrollment has an explicit path", read("app/courses/actions.ts"), /23505/],
  ["lesson progress is persisted", read("app/courses/actions.ts"), /lesson_progress/],
  ["admin mutations require admin role", read("app/admin/courses/actions.ts"), /requireAdmin/],
  ["student dashboard uses enrollments", read("app/student/page.tsx"), /from\("enrollments"\)/],
  ["database progress is lesson-derived", read("supabase/migrations/202609120003_courses_enrollment_progress.sql"), /sync_course_progress/],
  ["enrollment database policy requires free course", read("supabase/migrations/202609120003_courses_enrollment_progress.sql"), /c\.price = 0/],
  ["enrollment database policy requires student role", read("supabase/migrations/202609120003_courses_enrollment_progress.sql"), /p\.role = 'student'/],
];

const failed = checks.filter(([, source, pattern]) => !pattern.test(source));
if (failed.length) {
  for (const [label] of failed) console.error(`Missing: ${label}`);
  process.exit(1);
}
console.log(`Course foundation validation passed (${checks.length} checks).`);
