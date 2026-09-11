"use client";
import { ButtonLink } from "@/components/ui/button";
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><div className="max-w-md text-center"><p className="text-sm font-extrabold text-blue-600">SOMETHING WENT WRONG</p><h1 className="mt-3 text-3xl font-black">We couldn’t load this page.</h1><p className="mt-3 text-slate-600">Try again, or return to the home page.</p><div className="mt-7 flex justify-center gap-3"><button onClick={reset} className="min-h-11 rounded-xl bg-blue-600 px-5 font-bold text-white">Try again</button><ButtonLink href="/" variant="secondary">Home</ButtonLink></div></div></main>;
}
