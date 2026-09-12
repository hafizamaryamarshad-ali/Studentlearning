import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentAuth } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/auth/messages";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  const auth = await getCurrentAuth();
  if (auth.user && auth.profile) redirect(auth.profile.role === "admin" ? "/admin" : "/student");

  const params = await searchParams;
  const notices: Record<string, string> = {
    session: "Your session ended. Sign in again to continue.",
    configuration: "Authentication is ready in the code, but the Supabase project settings still need to be added.",
    callback: "We couldn’t confirm that email link. Please try signing in.",
  };

  return (
    <AuthShell eyebrow="Welcome back" title="Login to keep learning" description="Continue your courses, progress, and achievements from one secure account.">
      <LoginForm nextPath={safeNextPath(params.next)} notice={params.reason ? notices[params.reason] : undefined} />
    </AuthShell>
  );
}
