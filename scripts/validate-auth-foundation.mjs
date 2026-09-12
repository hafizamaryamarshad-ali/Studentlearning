import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path) => readFileSync(resolve(path), "utf8");
const signup = read("components/auth/signup-form.tsx");
const logout = read("components/auth/logout-button.tsx");
const session = read("lib/auth/session.ts");
const server = read("lib/supabase/server.ts");
const adminPage = read("app/admin/page.tsx");
const studentPage = read("app/student/page.tsx");
const authMigration = read("supabase/migrations/202609120002_auth_profile_trigger.sql");
const authSources = [signup, logout, session, server, adminPage, studentPage].join("\n");

const assertions = [
  [signup.includes("signUp"), "Student signup is missing"],
  [signup.includes("full_name: fullName"), "Signup must send the validated full name"],
  [!signup.includes("role:"), "Signup must not send a browser-supplied role"],
  [authMigration.includes("'student'::public.user_role"), "Database trigger must force student role"],
  [!authMigration.includes("raw_user_meta_data ->> 'role'"), "Database trigger must not trust role metadata"],
  [studentPage.includes("requireStudent()"), "Student dashboard lacks server protection"],
  [adminPage.includes("requireAdmin()"), "Admin dashboard lacks server role protection"],
  [session.includes('auth.profile.role !== "admin"'), "Admin authorization check is missing"],
  [server.includes("cookieStore.getAll()"), "Server cookie session handling is missing"],
  [logout.includes("supabase.auth.signOut"), "Logout is missing"],
  [!authSources.includes("localStorage"), "Authentication must not use localStorage directly"],
  [!authSources.includes("SUPABASE_SERVICE_ROLE_KEY"), "Client/server auth source must not use a service-role key"],
];

const failures = assertions.filter(([passed]) => !passed).map(([, message]) => message);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Validated signup role safety, cookie sessions, protected student/admin routes, and logout.");
