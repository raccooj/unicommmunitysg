"use client";

import { useActionState } from "react";
import { createPost, type FormState } from "@/app/actions";
import { BODY_MAX, CATEGORIES, TITLE_MAX } from "@/lib/constants";
import { FormAlert, SubmitButton } from "@/components/ui";

const field =
  "w-full rounded-xl border border-line bg-white px-3.5 text-[16px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

export function PostForm() {
  const [state, action] = useActionState<FormState, FormData>(createPost, undefined);
  const f = state?.fields;
  return (
    <form action={action} className="space-y-4" noValidate>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Category</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c, i) => (
            <label
              key={c.value}
              className="inline-flex h-11 cursor-pointer items-center rounded-full border border-line bg-white px-4 text-sm font-semibold text-muted has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:checked]:text-accent-strong"
            >
              <input
                type="radio"
                name="category"
                value={c.value}
                defaultChecked={f ? f.category === c.value : i === 0}
                className="sr-only"
              />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Title</span>
        <input name="title" maxLength={TITLE_MAX} required defaultValue={f?.title} className={`${field} h-12`} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Body</span>
        <textarea name="body" rows={8} maxLength={BODY_MAX} required defaultValue={f?.body} className={`${field} py-3 leading-relaxed`} />
      </label>
      <p className="text-xs text-muted">Posted anonymously. Don&apos;t share personal details you wouldn&apos;t want public.</p>
      <FormAlert error={state?.error} />
      <SubmitButton pendingText="Publishing…">Publish</SubmitButton>
    </form>
  );
}
