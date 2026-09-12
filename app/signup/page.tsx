import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { getCurrentAuth } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const auth = await getCurrentAuth();
  if (auth.user && auth.profile) redirect(auth.profile.role === "admin" ? "/admin" : "/student");

  return (
    <AuthShell eyebrow="Student signup" title="Create your learning account" description="Join as a student. Administrator access can only be assigned through a trusted admin process.">
      <SignupForm />
    </AuthShell>
  );
}
