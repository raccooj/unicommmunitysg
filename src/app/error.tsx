"use client";

import Link from "next/link";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted">{error.message || "Please try again."}</p>
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={reset} className="h-11 rounded-xl bg-accent px-5 text-sm font-semibold text-white">
          Try again
        </button>
        <Link href="/feed" className="inline-flex h-11 items-center rounded-xl border border-line px-5 text-sm font-semibold">
          Go to feed
        </Link>
      </div>
    </main>
  );
}
