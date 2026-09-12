import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SkillSpring", template: "%s | SkillSpring" },
  description: "Build practical skills through structured courses, guided lessons, and measurable progress.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
