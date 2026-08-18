import Link from "next/link";
import { logoutAction } from "@/lib/auth/actions";
import type { SessionPayload } from "@/lib/auth/session";

export default function Nav({ session }: { session: SessionPayload }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-semibold text-slate-900">
            TVBS Task Manager
          </Link>
          <nav className="hidden sm:flex items-center gap-4 text-sm text-slate-600">
            <Link href="/dashboard" className="hover:text-slate-900">
              Tasks
            </Link>
            <Link href="/clients" className="hover:text-slate-900">
              Clients
            </Link>
            {session.role === "ADMIN" && (
              <Link href="/team" className="hover:text-slate-900">
                Team
              </Link>
            )}
            {session.role === "ADMIN" && (
              <Link href="/recurring" className="hover:text-slate-900">
                Recurring
              </Link>
            )}
            <Link href="/account" className="hover:text-slate-900">
              Account
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-500 hidden sm:inline">
            {session.name} · {session.role === "ADMIN" ? "Admin" : "Team member"}
          </span>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-slate-600 hover:text-slate-900 border border-slate-300 rounded-md px-3 py-1.5"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
