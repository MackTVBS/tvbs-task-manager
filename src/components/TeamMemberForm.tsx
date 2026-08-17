"use client";

import { useActionState, useRef, useEffect } from "react";
import { createTeamMemberAction, type FormState } from "@/lib/team/actions";

export default function TeamMemberForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createTeamMemberAction,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-white border border-slate-200 rounded-lg p-6 space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Name
        </label>
        <input
          type="text"
          name="name"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Email
        </label>
        <input
          type="email"
          name="email"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Role
        </label>
        <select
          name="role"
          defaultValue="MEMBER"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
        >
          <option value="MEMBER">Team member</option>
          <option value="ADMIN">Admin</option>
        </select>
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
        {pending ? "Adding…" : "Add & send login details"}
      </button>
    </form>
  );
}
