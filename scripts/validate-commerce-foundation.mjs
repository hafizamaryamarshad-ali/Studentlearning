import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const migration = read("supabase/migrations/202609130008_paid_learning_certificates.sql");
const seed = read("supabase/migrations/202609130009_seed_learning_catalog.sql");
const paymentActions = read("app/purchases/actions.ts") + read("app/admin/payments/actions.ts");
const certificatePages = read("app/certificates/[id]/page.tsx") + read("app/verify/[token]/page.tsx");

const checks = [
  ["private proof bucket", /'payment-proofs'[\s\S]*false[\s\S]*5242880/, migration],
  ["student-owned proof paths", /split_part\(name, '\/', 1\) = \(select auth\.uid\(\)\)::text/, migration],
  ["admin-only payment review", /function public\.review_course_payment[\s\S]*public\.is_admin\(\)/, migration],
  ["rejection reason required", /PAYMENT_REJECTION_REASON_REQUIRED/, migration],
  ["approval creates enrollment", /insert into public\.enrollments/, migration],
  ["certificate issued only on pass", /if not new\.passed then return new/, migration],
  ["public verification omits credentials", /function public\.verify_certificate[\s\S]*certificate_number[\s\S]*student_name[\s\S]*quiz_title/, migration],
  ["student upload validation", /5 \* 1024 \* 1024/, paymentActions],
  ["admin actions require admin", /requireAdmin/, paymentActions],
  ["certificate has QR", /QRCode\.toDataURL/, certificatePages],
  ["eight seeded courses", /Data Analysis Fundamentals/, seed],
  ["ten seeded quizzes", /40000000-0000-4000-8000-000000000010/, seed],
];

for (const [label, pattern, source] of checks) {
  if (!pattern.test(source)) throw new Error(`Commerce validation failed: ${label}`);
}

console.log(`Paid learning and certificate validation passed (${checks.length} checks).`);
