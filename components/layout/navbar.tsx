import Link from "next/link";
import { GraduationCap, Menu } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";
import { getCurrentAuth } from "@/lib/auth/session";

function MobileMenu({ links, signedIn = false }: { links: Array<{ href: string; label: string }>; signedIn?: boolean }) {
  return <details className="relative md:hidden">
    <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-extrabold text-slate-700 [&::-webkit-details-marker]:hidden"><Menu className="h-5 w-5" />Menu</summary>
    <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/70">
      {links.map((link) => <Link key={link.href} href={link.href} className="block rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700">{link.label}</Link>)}
      {signedIn && <div className="mt-1 border-t border-slate-200 pt-1"><LogoutButton /></div>}
    </div>
  </details>;
}

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
            <div className="hidden md:block"><ButtonLink href="/signup">Sign Up</ButtonLink></div>
            <MobileMenu links={[{ href: "/", label: "Home" }, { href: "/courses", label: "Courses" }, { href: "/login", label: "Login" }, { href: "/signup", label: "Create account" }]} />
          </>
        ) : isAdmin ? (
          <>
            <div className="hidden items-center gap-6 text-sm font-bold text-slate-600 md:flex">
              <Link className="hover:text-blue-600" href="/admin">Dashboard</Link>
              <Link className="hover:text-blue-600" href="/admin/courses">Courses</Link>
              <Link className="hover:text-blue-600" href="/admin/quizzes">Quizzes</Link>
              <Link className="hover:text-blue-600" href="/admin/tasks">Tasks</Link>
              <Link className="hover:text-blue-600" href="/admin/payments">Payments</Link>
              <Link className="hover:text-blue-600" href="/admin/students">Students</Link>
            </div>
            <div className="hidden md:block"><LogoutButton compact /></div>
            <MobileMenu signedIn links={[{ href: "/admin", label: "Dashboard" }, { href: "/admin/courses", label: "Courses" }, { href: "/admin/quizzes", label: "Quizzes" }, { href: "/admin/tasks", label: "Tasks" }, { href: "/admin/payments", label: "Payments" }, { href: "/admin/students", label: "Students" }]} />
          </>
        ) : (
          <>
            <div className="hidden items-center gap-7 text-sm font-bold text-slate-600 md:flex">
              <Link className="hover:text-blue-600" href="/student">Dashboard</Link>
              <Link className="hover:text-blue-600" href="/courses">Courses</Link>
              <Link className="hover:text-blue-600" href="/quizzes">Quizzes</Link>
              <Link className="hover:text-blue-600" href="/tasks">Tasks</Link>
              <Link className="hover:text-blue-600" href="/certificates">Certificates</Link>
              <Link className="hover:text-blue-600" href="/profile">Profile</Link>
            </div>
            <div className="hidden md:block"><LogoutButton compact /></div>
            <MobileMenu signedIn links={[{ href: "/student", label: "Dashboard" }, { href: "/courses", label: "Courses" }, { href: "/quizzes", label: "Quizzes" }, { href: "/student/purchases", label: "Purchases" }, { href: "/certificates", label: "Certificates" }, { href: "/profile", label: "Profile" }]} />
          </>
        )}
      </nav>
    </header>
  );
}
