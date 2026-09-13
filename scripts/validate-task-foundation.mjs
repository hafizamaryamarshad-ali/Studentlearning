import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path) => readFileSync(resolve(path), "utf8");
const statusMigration = read("supabase/migrations/202609120006_task_needs_revision_status.sql");
const migration = read("supabase/migrations/202609120007_practical_tasks_foundation.sql");
const studentAction = read("app/tasks/actions.ts");
const adminAction = read("app/admin/tasks/actions.ts");
const studentPage = read("app/tasks/[id]/page.tsx");

const checks = [
  ["needs revision status", statusMigration, /add value if not exists 'needs_revision'/],
  ["published enrolled task policy", migration, /Enrolled students can read published tasks/],
  ["course must be published", migration, /c\.status = 'published'/],
  ["student role is enforced", migration, /p\.role = 'student'/],
  ["student submit RPC", migration, /function public\.submit_task_work/],
  ["student identity comes from auth", migration, /v_student_id uuid := auth\.uid\(\)/],
  ["deadline enforced in database", migration, /TASK_DEADLINE_PASSED/],
  ["review RPC is admin-only", migration, /function public\.review_task_submission[\s\S]*public\.is_admin\(\)/],
  ["score bounded by task maximum", migration, /p_awarded_points > v_max_points/],
  ["approved task points are idempotent", migration, /points_task_submission_unique/],
  ["student has no direct submission mutation policy", migration, /Admins can update task submissions/],
  ["anonymous RPC access revoked", migration, /revoke all on function public\.submit_task_work\(uuid, text, text, uuid\) from public, anon/],
  ["student action uses trusted RPC", studentAction, /rpc\("submit_task_work"/],
  ["admin actions require admin", adminAction, /requireAdmin/],
  ["admin review uses trusted RPC", adminAction, /rpc\("review_task_submission"/],
  ["student route scopes submission ownership", studentPage, /eq\("student_id", profile\.id\)/],
  ["file submission UI intentionally absent", studentPage, /Files are not accepted in this phase/],
];

const failures = checks.filter(([, source, pattern]) => !pattern.test(source));
if (failures.length) {
  for (const [label] of failures) console.error(`Missing: ${label}`);
  process.exit(1);
}
console.log(`Practical task foundation validation passed (${checks.length} checks).`);
