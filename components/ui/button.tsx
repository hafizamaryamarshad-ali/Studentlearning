import Link from "next/link";
import { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Props = ComponentProps<typeof Link> & { variant?: "primary" | "secondary" | "light"; size?: "md" | "lg" };
export function ButtonLink({ className, variant = "primary", size = "md", ...props }: Props) {
  return <Link className={cn("inline-flex items-center justify-center gap-2 rounded-xl font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300", size === "lg" ? "min-h-13 px-6 py-3.5 text-base" : "min-h-11 px-5 py-2.5 text-sm", variant === "primary" && "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700", variant === "secondary" && "border border-slate-300 bg-white text-slate-900 hover:bg-slate-100", variant === "light" && "bg-white text-blue-700 hover:bg-blue-50", className)} {...props} />;
}
