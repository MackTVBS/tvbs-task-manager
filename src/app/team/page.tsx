import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { listUsers } from "@/lib/db/queries";
import { deleteTeamMemberAction } from "@/lib/team/actions";
import TeamMemberForm from "@/components/TeamMemberForm";

export default async function TeamPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/dashboard");

  const members = await listUsers();

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 mb-1">Team</h1>
      <p className="text-sm text-slate-500 mb-6">
        Team members receive an email with login details when added, and an
        email whenever a task is assigned to them.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
            {members.map((m) => (
              <div
                key={m.id}
                className="p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-medium text-slate-900">{m.name}</p>
                  <p className="text-sm text-slate-500">{m.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium bg-slate-100 text-slate-600 rounded-full px-2 py-1">
                    {m.role === "ADMIN" ? "Admin" : "Team member"}
                  </span>
                  {m.id !== admin.id && (
                    <form action={deleteTeamMemberAction}>
                      <input type="hidden" name="userId" value={m.id} />
                      <button
                        type="submit"
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <TeamMemberForm />
        </div>
      </div>
    </div>
  );
}
