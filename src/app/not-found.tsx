import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-xl font-bold">Not found</h1>
      <p className="mt-2 text-sm text-muted">This page doesn&apos;t exist or isn&apos;t available to your university.</p>
      <Link href="/feed" className="mt-6 inline-flex h-11 items-center rounded-xl bg-accent px-5 text-sm font-semibold text-white">
        Back to feed
      </Link>
    </main>
  );
}
