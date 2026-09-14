import { Card } from "@/components/ui/card";
import { GuestSessionStarter } from "@/components/auth/guest-session-starter";
import { safeNextPath } from "@/lib/auth/messages";

export default async function LearnPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <main className="grid min-h-screen place-items-center bg-slate-50 px-5"><Card className="w-full max-w-md p-8"><GuestSessionStarter nextPath={safeNextPath(next) || "/courses"} /></Card></main>;
}
