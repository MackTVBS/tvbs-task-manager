import type { Metadata } from "next";
import "./globals.css";
import { getSession } from "@/lib/auth/session";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "TVBS Task Manager",
  description: "Client task tracking and reminders for TVBS.",
};

export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  const session = await getSession();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {session && <Nav session={session} />}
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
