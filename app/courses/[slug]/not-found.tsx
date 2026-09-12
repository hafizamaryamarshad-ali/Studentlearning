import Link from "next/link";
import { BookX } from "lucide-react";
export default function CourseNotFound() { return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><div className="max-w-md text-center"><BookX className="mx-auto h-12 w-12 text-slate-400" /><h1 className="mt-5 text-3xl font-black">Course not found</h1><p className="mt-3 leading-7 text-slate-600">This course may be unavailable, archived, or still in draft.</p><Link href="/courses" className="mt-7 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-extrabold text-white">Browse courses</Link></div></main>; }
