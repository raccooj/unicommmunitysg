import Link from "next/link";
import { Header } from "@/components/Header";
import { requireMember } from "@/lib/session";
import { PostForm } from "./PostForm";

export default async function NewPostPage() {
  const { university } = await requireMember();
  return (
    <>
      <Header university={university} />
      <main className="mx-auto w-full max-w-2xl px-4 py-5">
        <Link href="/feed" className="inline-flex h-11 items-center text-sm font-medium text-muted hover:text-ink">
          ← Back to feed
        </Link>
        <h1 className="mb-5 text-[22px] font-extrabold tracking-tight">Write a post</h1>
        <PostForm />
      </main>
    </>
  );
}
