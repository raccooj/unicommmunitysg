import Link from "next/link";
import { Header } from "@/components/Header";
import { requireMember } from "@/lib/session";
import { CATEGORIES, categoryLabel, isCategory, universityName } from "@/lib/constants";
import { timeAgo } from "@/lib/format";

type PostRow = { id: string; category: string; title: string; body: string; comment_count: number; created_at: string };

export default async function FeedPage({ searchParams }: PageProps<"/feed">) {
  const { supabase, university } = await requireMember();
  const { category: raw } = await searchParams;
  const category = isCategory(raw) ? raw : undefined;

  // RLS limits rows to the viewer's university; the filter keeps intent explicit.
  let query = supabase
    .from("posts")
    .select("id, category, title, body, comment_count, created_at")
    .eq("university", university)
    .order("created_at", { ascending: false })
    .limit(50);
  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) throw new Error("Could not load posts.");
  const posts = (data ?? []) as PostRow[];

  const tab = (active: boolean) =>
    `inline-flex h-10 shrink-0 items-center rounded-full px-3 text-[13px] font-semibold ${
      active ? "bg-ink text-white" : "border border-line bg-white text-muted hover:text-ink"
    }`;

  return (
    <>
      <Header university={university} />
      <main className="mx-auto w-full max-w-2xl px-4 pb-28 pt-5">
        <h1 className="text-[22px] font-extrabold tracking-tight">{universityName(university)}</h1>
        <p className="text-sm text-muted">Anonymous student board · members self-declared</p>

        <nav className="-mx-4 mt-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" aria-label="Categories">
          <Link href="/feed" className={tab(!category)}>All</Link>
          {CATEGORIES.map((c) => (
            <Link key={c.value} href={`/feed?category=${c.value}`} className={tab(category === c.value)}>
              {c.label}
            </Link>
          ))}
        </nav>

        {posts.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
            <p className="font-semibold">No posts here yet</p>
            <p className="mt-1 text-sm text-muted">Be the first to start a conversation at {university}.</p>
            <Link href="/posts/new" className="mt-5 inline-flex h-11 items-center rounded-xl bg-accent px-5 text-sm font-semibold text-white">
              Write a post
            </Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {posts.map((p) => (
              <li key={p.id}>
                <Link href={`/posts/${p.id}`} className="block rounded-2xl border border-line bg-white px-4 py-3.5 transition hover:border-accent/40">
                  <span className="text-xs font-semibold uppercase tracking-wide text-accent">{categoryLabel(p.category)}</span>
                  <h2 className="mt-1 line-clamp-2 text-[16px] font-bold leading-snug">{p.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">{p.body}</p>
                  <div className="mt-2.5 flex items-center gap-3 text-xs text-muted">
                    <span>Anonymous</span>
                    <span aria-hidden>·</span>
                    <time dateTime={p.created_at}>{timeAgo(p.created_at)}</time>
                    <span className="ml-auto">
                      {p.comment_count} {p.comment_count === 1 ? "comment" : "comments"}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-2xl justify-end px-4">
          <Link
            href="/posts/new"
            className="pointer-events-auto inline-flex h-13 items-center gap-2 rounded-full bg-accent px-6 text-[15px] font-semibold text-white shadow-lg shadow-accent/30 hover:bg-accent-strong"
          >
            <span aria-hidden className="text-xl leading-none">+</span> Write a post
          </Link>
        </div>
      </div>
    </>
  );
}
