import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";
import { getCurrentAuth } from "@/lib/auth/session";

const placeholderClass = "cursor-not-allowed text-slate-400";

export async function Navbar() {
  const { user, profile } = await getCurrentAuth();
  const isAdmin = profile?.role === "admin";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <nav className="mx-auto flex min-h-18 max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8" aria-label="Main navigation">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 text-xl font-black tracking-tight text-slate-950">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white"><GraduationCap className="h-6 w-6" /></span>
          SkillSpring
        </Link>

        {!user || !profile ? (
          <>
            <div className="hidden items-center gap-7 text-sm font-bold text-slate-600 md:flex">
              <Link className="hover:text-blue-600" href="/">Home</Link>
              <Link className="hover:text-blue-600" href="/courses">Courses</Link>
              <Link className="hover:text-blue-600" href="/login">Login</Link>
            </div>
            <ButtonLink href="/signup">Sign Up</ButtonLink>
          </>
        ) : isAdmin ? (
          <>
            <div className="hidden items-center gap-6 text-sm font-bold text-slate-600 md:flex">
              <Link className="hover:text-blue-600" href="/admin">Dashboard</Link>
              <Link className="hover:text-blue-600" href="/admin/courses">Courses</Link>
              {["Students", "Challenges", "Payments", "Withdrawals"].map((item) => <span key={item} className={placeholderClass} title="Coming later">{item}</span>)}
            </div>
            <LogoutButton compact />
          </>
        ) : (
          <>
            <div className="hidden items-center gap-7 text-sm font-bold text-slate-600 md:flex">
              <Link className="hover:text-blue-600" href="/student">Dashboard</Link>
              <Link className="hover:text-blue-600" href="/courses">Courses</Link>
              <Link className="hover:text-blue-600" href="/profile">Profile</Link>
            </div>
            <LogoutButton compact />
          </>
        )}
      </nav>
    </header>
  );
}
