"use client";

import { useActionState, useEffect, useRef } from "react";
import { createComment, type FormState } from "@/app/actions";
import { COMMENT_MAX } from "@/lib/constants";
import { FormAlert, SubmitButton } from "@/components/ui";

export function CommentForm({ postId }: { postId: string }) {
  const [state, action] = useActionState<FormState, FormData>(createComment, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.message) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-3" noValidate>
      <input type="hidden" name="post_id" value={postId} />
      <label className="block">
        <span className="sr-only">Comment</span>
        <textarea
          name="body"
          rows={3}
          maxLength={COMMENT_MAX}
          required
          placeholder="Add an anonymous comment"
          defaultValue={state?.fields?.body}
          className="w-full rounded-xl border border-line bg-white px-3.5 py-3 text-[16px] leading-relaxed outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </label>
      <FormAlert error={state?.error} />
      <SubmitButton pendingText="Posting…">Comment</SubmitButton>
    </form>
  );
}
