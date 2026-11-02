export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6" aria-busy="true" aria-label="Loading">
      <div className="h-6 w-48 animate-pulse rounded bg-black/10" />
      <div className="mt-6 space-y-2.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl border border-line bg-white" />
        ))}
      </div>
    </main>
  );
}
