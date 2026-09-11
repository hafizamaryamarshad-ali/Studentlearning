import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SkillSpring", template: "%s | SkillSpring" },
  description: "Learn practical skills, prove what you know, and unlock opportunities through challenges, certificates, and rewards.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
