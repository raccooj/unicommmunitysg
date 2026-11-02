"use client";

import { useActionState } from "react";
import { selectUniversity, type FormState } from "@/app/actions";
import { UNIVERSITIES } from "@/lib/constants";
import { FormAlert, SubmitButton } from "@/components/ui";

export function UniversityForm() {
  const [state, action] = useActionState<FormState, FormData>(selectUniversity, undefined);
  return (
    <form action={action} className="space-y-3">
      <fieldset className="space-y-3">
        <legend className="sr-only">University</legend>
        {UNIVERSITIES.map((u) => (
          <label
            key={u.code}
            className="flex min-h-16 cursor-pointer items-center gap-4 rounded-2xl border border-line bg-white px-4 py-3 has-[:checked]:border-accent has-[:checked]:bg-accent-soft"
          >
            <input type="radio" name="university" value={u.code} required className="size-5 accent-[var(--color-accent)]" />
            <span>
              <span className="block text-base font-bold">{u.code}</span>
              <span className="block text-sm text-muted">{u.name}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <FormAlert error={state?.error} />
      <div className="pt-2">
        <SubmitButton pendingText="Saving…">Continue</SubmitButton>
      </div>
    </form>
  );
}
