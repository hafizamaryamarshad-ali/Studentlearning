"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function LogoutButton({ compact = false, className }: { compact?: boolean; className?: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function logout() {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut({ scope: "local" });
    } finally {
      router.replace("/login");
      router.refresh();
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={logout} disabled={loading} className={cn(
      "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition disabled:cursor-wait disabled:opacity-60",
      compact ? "px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-950" : "w-full px-3 py-3 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-950",
      className
    )}>
      <LogOut className="h-4 w-4" />{loading ? "Signing out…" : "Logout"}
    </button>
  );
}
