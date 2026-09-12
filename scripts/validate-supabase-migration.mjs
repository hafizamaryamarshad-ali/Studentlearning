import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const migrationsDirectory = resolve("supabase/migrations");
const migrationFiles = readdirSync(migrationsDirectory)
  .filter((file) => file.endsWith(".sql"))
  .sort();
const migrations = migrationFiles.map((file) => readFileSync(resolve(migrationsDirectory, file), "utf8"));
const sql = migrations.join("\n");

const expectedTables = [
  "profiles", "courses", "course_modules", "lessons", "enrollments",
  "payments", "quizzes", "quiz_questions", "quiz_attempts", "tasks",
  "task_submissions", "points", "challenges", "challenge_participants",
  "rewards", "referrals", "wallets", "wallet_transactions",
  "withdrawal_requests", "certificates", "notifications",
  "lesson_progress",
];

const assertions = [
  [migrations.every((migration) => /^begin;[\s\S]*commit;\s*$/i.test(migration.trim())), "Every migration must be wrapped in begin/commit"],
  [(sql.match(/create table public\./gi) ?? []).length === expectedTables.length, "Unexpected table count"],
  [sql.includes("unique (student_id, course_id)"), "Missing unique enrollment constraint"],
  [sql.includes("unique (challenge_id, student_id)"), "Missing unique challenge participation constraint"],
  [sql.includes("unique (quiz_id, sort_order)"), "Missing unique quiz ordering constraint"],
  [sql.includes("quiz_questions intentionally has no client SELECT policy"), "Missing protected quiz-answer policy note"],
  [!sql.includes("SUPABASE_SERVICE_ROLE_KEY"), "Migration must not contain service-role credentials"],
  [sql.includes("new.raw_user_meta_data ->> 'full_name'"), "Missing secure signup profile trigger"],
  [sql.includes("'student'::public.user_role"), "Signup trigger must force the student role"],
  [!sql.includes("new.raw_user_meta_data ->> 'role'"), "Signup trigger must not trust role metadata"],
  [sql.includes("unique (student_id, lesson_id)"), "Missing unique lesson progress constraint"],
  [sql.includes("Students can enroll in free published courses"), "Missing safe free-enrollment policy"],
  [sql.includes("and c.price = 0"), "Paid courses must not use direct enrollment"],
  [sql.includes("create or replace function public.is_admin()"), "Missing server-enforced admin helper"],
  [sql.includes("create policy \"Admins can manage courses\""), "Missing admin course policy"],
  [sql.includes("create or replace function public.sync_course_progress()"), "Missing progress calculation trigger"],
];

for (const table of expectedTables) {
  assertions.push([
    new RegExp(`create table public\\.${table}\\s*\\(`, "i").test(sql),
    `Missing table: ${table}`,
  ]);
  assertions.push([
    new RegExp(`alter table public\\.${table} enable row level security;`, "i").test(sql),
    `RLS is not enabled for: ${table}`,
  ]);
}

const withoutComments = sql
  .replace(/--.*$/gm, "")
  .replace(/'(?:''|[^'])*'/g, "''");
const opens = (withoutComments.match(/\(/g) ?? []).length;
const closes = (withoutComments.match(/\)/g) ?? []).length;
assertions.push([opens === closes, "Unbalanced SQL parentheses"]);

const failures = assertions.filter(([passed]) => !passed).map(([, message]) => message);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Validated ${migrationFiles.length} migrations, ${expectedTables.length} tables, RLS coverage, auth role safety, and SQL structure.`);
