import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { listClients } from "@/lib/db/queries";
import { deleteClientAction } from "@/lib/clients/actions";
import ClientForm from "@/components/ClientForm";

export default async function ClientsPage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  const clients = await listClients();

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 mb-1">Clients</h1>
      <p className="text-sm text-slate-500 mb-6">
        The clients you manage tasks for.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {clients.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-lg p-10 text-center text-sm text-slate-500">
              No clients yet.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
              {clients.map((c) => (
                <div
                  key={c.id}
                  className="p-4 flex items-start justify-between gap-4"
                >
                  <div>
                    <p className="font-medium text-slate-900">{c.name}</p>
                    {(c.contactName || c.contactEmail) && (
                      <p className="text-sm text-slate-500">
                        {c.contactName}
                        {c.contactName && c.contactEmail ? " · " : ""}
                        {c.contactEmail}
                      </p>
                    )}
                    {c.notes && (
                      <p className="text-sm text-slate-500 mt-1">{c.notes}</p>
                    )}
                  </div>
                  {user.role === "ADMIN" && (
                    <form action={deleteClientAction}>
                      <input type="hidden" name="clientId" value={c.id} />
                      <button
                        type="submit"
                        className="text-xs text-red-600 hover:underline whitespace-nowrap"
                      >
                        Delete
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {user.role === "ADMIN" && (
          <div>
            <ClientForm />
          </div>
        )}
      </div>
    </div>
  );
}
