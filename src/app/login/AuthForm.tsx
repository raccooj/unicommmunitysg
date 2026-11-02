"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type FormState } from "@/app/actions";
import { FormAlert, SubmitButton } from "@/components/ui";

const input =
  "h-12 w-full rounded-xl border border-line bg-white px-3.5 text-[16px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

export function AuthForm({ initialError }: { initialError?: string }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginState, loginAction] = useActionState<FormState, FormData>(signIn, initialError ? { error: initialError } : undefined);
  const [signupState, signupAction] = useActionState<FormState, FormData>(signUp, undefined);
  const state = mode === "login" ? loginState : signupState;

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <div className="mb-5 grid grid-cols-2 rounded-xl bg-canvas p-1 text-sm font-semibold" role="tablist">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`h-10 rounded-lg ${mode === m ? "bg-white text-ink shadow-sm" : "text-muted"}`}
          >
            {m === "login" ? "Log in" : "Sign up"}
          </button>
        ))}
      </div>
      <form key={mode} action={mode === "login" ? loginAction : signupAction} className="space-y-4" noValidate>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Email</span>
          <input name="email" type="email" autoComplete="email" required defaultValue={state?.fields?.email} className={input} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={mode === "signup" ? 8 : undefined}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className={input}
          />
          {mode === "signup" && <span className="mt-1 block text-xs text-muted">At least 8 characters.</span>}
        </label>
        <FormAlert error={state?.error} message={state?.message} />
        <SubmitButton pendingText={mode === "login" ? "Logging in…" : "Creating account…"}>
          {mode === "login" ? "Log in" : "Create account"}
        </SubmitButton>
      </form>
    </div>
  );
}
