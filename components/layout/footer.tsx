import Link from "next/link";
import { GraduationCap } from "lucide-react";
export function Footer() {
  return <footer className="border-t border-slate-200 bg-white px-5 py-9 sm:px-8"><div className="mx-auto flex max-w-6xl flex-col gap-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between"><Link href="/" className="flex items-center gap-2 font-black text-slate-900"><GraduationCap className="h-5 w-5 text-blue-600" />SkillSpring</Link><p>Learning that turns effort into opportunity.</p><div className="flex gap-5 font-semibold"><Link href="/student">Student</Link><Link href="/admin">Admin</Link></div></div></footer>;
}
