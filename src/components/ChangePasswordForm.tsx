"use client";

import { useActionState } from "react";
import { changePasswordAction, type FormState } from "@/lib/team/actions";

export default function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    changePasswordAction,
    null
  );

  return (
    <form
      action={formAction}
      className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 max-w-sm"
    >
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Current password
        </label>
        <input
          type="password"
          name="currentPassword"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          New password
        </label>
        <input
          type="password"
          name="newPassword"
          required
          minLength={8}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-green-700">{state.success}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-slate-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
