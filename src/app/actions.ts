"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BODY_MAX, COMMENT_MAX, TITLE_MAX, isCategory, isUniversity } from "@/lib/constants";

export type FormState = { error?: string; message?: string; fields?: Record<string, string> } | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function str(form: FormData, key: string) {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const email = str(form, "email").toLowerCase();
  const password = (form.get("password") as string) ?? "";
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address.", fields: { email } };
  if (!password) return { error: "Enter your password.", fields: { email } };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const msg = /confirm/i.test(error.message)
      ? "Please confirm your email first — check your inbox."
      : "Incorrect email or password.";
    return { error: msg, fields: { email } };
  }
  redirect("/");
}

export async function signUp(_: FormState, form: FormData): Promise<FormState> {
  const email = str(form, "email").toLowerCase();
  const password = (form.get("password") as string) ?? "";
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address.", fields: { email } };
  if (password.length < 8) return { error: "Password must be at least 8 characters.", fields: { email } };

  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) return { error: error.message, fields: { email } };
  if (!data.session) {
    return { message: "Check your inbox to confirm your email, then log in.", fields: { email } };
  }
  redirect("/onboarding");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function selectUniversity(_: FormState, form: FormData): Promise<FormState> {
  const university = str(form, "university");
  if (!isUniversity(university)) return { error: "Choose one of the four universities." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("profiles").update({ university }).eq("id", user.id);
  if (error) return { error: "Could not save your university. Please try again." };
  redirect("/feed");
}

export async function createPost(_: FormState, form: FormData): Promise<FormState> {
  const category = str(form, "category");
  const title = str(form, "title");
  const body = str(form, "body");
  const fields = { category, title, body };

  if (!isCategory(category)) return { error: "Pick a category.", fields };
  if (!title) return { error: "Add a title.", fields };
  if (title.length > TITLE_MAX) return { error: `Title must be ${TITLE_MAX} characters or fewer.`, fields };
  if (!body) return { error: "Write something in the body.", fields };
  if (body.length > BODY_MAX) return { error: `Body must be ${BODY_MAX} characters or fewer.`, fields };

  const supabase = await createClient();
  // author_id and university are set by the database from the session.
  const { data, error } = await supabase
    .from("posts")
    .insert({ category, title, body })
    .select("id")
    .single();
  if (error || !data) return { error: "Could not publish your post. Please try again.", fields };

  revalidatePath("/feed");
  redirect(`/posts/${data.id}`);
}

export async function createComment(_: FormState, form: FormData): Promise<FormState> {
  const postId = str(form, "post_id");
  const body = str(form, "body");
  if (!body) return { error: "Write a comment first." };
  if (body.length > COMMENT_MAX) return { error: `Comment must be ${COMMENT_MAX} characters or fewer.`, fields: { body } };

  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({ post_id: postId, body });
  if (error) return { error: "Could not add your comment. Please try again.", fields: { body } };

  revalidatePath(`/posts/${postId}`);
  return { message: "Comment added." };
}
