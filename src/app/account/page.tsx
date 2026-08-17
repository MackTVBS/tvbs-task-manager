import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export default async function AccountPage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 mb-1">Account</h1>
      <p className="text-sm text-slate-500 mb-6">
        Signed in as {user.name} ({user.email})
      </p>
      <ChangePasswordForm />
    </div>
  );
}
