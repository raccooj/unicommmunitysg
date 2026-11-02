import Link from "next/link";
import { signOut } from "@/app/actions";
import { universityName } from "@/lib/constants";

export function Header({ university }: { university?: string }) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-3 px-4">
        <Link href={university ? "/feed" : "/"} className="flex min-w-0 items-center gap-2.5">
          <span className="text-[17px] font-extrabold tracking-tight">Campus SG</span>
          {university && (
            <span
              title={universityName(university)}
              className="rounded-md bg-accent px-2 py-0.5 text-xs font-bold tracking-wide text-white"
            >
              {university}
            </span>
          )}
        </Link>
        <form action={signOut}>
          <button type="submit" className="h-11 rounded-lg px-3 text-sm font-medium text-muted hover:bg-black/5 hover:text-ink">
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
