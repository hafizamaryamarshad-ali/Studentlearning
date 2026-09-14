"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function GuestSessionStarter({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function start() {
      const supabase = getSupabaseBrowserClient();
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const result = await supabase.auth.signInAnonymously({
          options: { data: { full_name: "Guest Learner" } },
        });
        if (result.error) throw result.error;
        session = result.data.session;
      }
      if (!session) throw new Error("Guest session unavailable");
      const { error: accessError } = await supabase.rpc("open_learning_access");
      if (accessError) throw accessError;
      if (active) {
        router.replace(nextPath);
        router.refresh();
      }
    }
    start().catch(() => {
      if (active) setError("Learning access could not be opened. Please refresh and try again.");
    });
    return () => { active = false; };
  }, [nextPath, router]);

  return error ? <p className="text-center font-bold text-red-700">{error}</p> : <div className="flex items-center justify-center gap-3 font-bold text-slate-700"><LoaderCircle className="h-5 w-5 animate-spin text-blue-600" />Opening your learning space…</div>;
}
