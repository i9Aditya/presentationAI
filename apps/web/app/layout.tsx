import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Productivity SaaS",
  description: "Prompt-to-PPT and document generation platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

