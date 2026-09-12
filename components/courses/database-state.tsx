import { DatabaseZap } from "lucide-react";
export function DatabaseState({ title = "Courses are not available yet.", message = "Connect the Supabase project and apply the migrations to load course data." }: { title?: string; message?: string }) {
  return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950"><DatabaseZap className="h-7 w-7 text-amber-700" /><h2 className="mt-4 text-xl font-extrabold">{title}</h2><p className="mt-2 leading-7 text-amber-900/80">{message}</p></div>;
}
