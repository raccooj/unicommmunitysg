import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { requireMember } from "@/lib/session";
import { categoryLabel } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { CommentForm } from "./CommentForm";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PostPage({ params }: PageProps<"/posts/[id]">) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const { supabase, university } = await requireMember();

  const [postRes, commentsRes] = await Promise.all([
    supabase.from("posts").select("id, category, title, body, comment_count, created_at").eq("id", id).maybeSingle(),
    supabase.from("comments").select("id, is_op, body, created_at").eq("post_id", id).order("created_at", { ascending: true }),
  ]);
  if (postRes.error || commentsRes.error) throw new Error("Could not load this post.");
  // RLS hides posts from other universities, so they surface as not found.
  const post = postRes.data;
  if (!post) notFound();
  const comments = commentsRes.data ?? [];

  return (
    <>
      <Header university={university} />
      <main className="mx-auto w-full max-w-2xl px-4 py-5">
        <Link href="/feed" className="inline-flex h-11 items-center text-sm font-medium text-muted hover:text-ink">
          ← Back to feed
        </Link>
        <article className="rounded-2xl border border-line bg-white px-4 py-5">
          <span className="text-xs font-semibold uppercase tracking-wide text-accent">{categoryLabel(post.category)}</span>
          <h1 className="mt-1.5 text-[22px] font-extrabold leading-tight tracking-tight">{post.title}</h1>
          <p className="mt-1.5 text-xs text-muted">
            Anonymous · <time dateTime={post.created_at}>{timeAgo(post.created_at)}</time>
          </p>
          <div className="mt-4 whitespace-pre-wrap break-words text-[15px] leading-relaxed">{post.body}</div>
        </article>

        <section className="mt-6" aria-labelledby="comments-heading">
          <h2 id="comments-heading" className="mb-3 text-sm font-bold">
            {comments.length} {comments.length === 1 ? "comment" : "comments"}
          </h2>
          {comments.length === 0 ? (
            <p className="mb-4 rounded-xl border border-dashed border-line bg-white px-4 py-6 text-center text-sm text-muted">
              No comments yet. Start the discussion.
            </p>
          ) : (
            <ul className="mb-4 space-y-2">
              {comments.map((c, i) => (
                <li key={c.id} className="rounded-xl border border-line bg-white px-4 py-3">
                  <p className="text-xs font-semibold text-muted">
                    {c.is_op ? <span className="text-accent">Anonymous (author)</span> : `Anonymous ${i + 1}`}
                    <span className="font-normal"> · {timeAgo(c.created_at)}</span>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed">{c.body}</p>
                </li>
              ))}
            </ul>
          )}
          <CommentForm postId={post.id} />
        </section>
      </main>
    </>
  );
}
