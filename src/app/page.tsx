export const dynamic = "force-dynamic";


import { redirect } from "next/navigation";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { isUniversity } from "@/lib/constants";

export default async function Home({ searchParams }: PageProps<"/">) {
  // Confirmation links fall back to the Site URL root; hand the code to the callback.
  const { code } = await searchParams;
  if (typeof code === "string") redirect(`/auth/callback?code=${encodeURIComponent(code)}`);

  if (!supabaseConfigured()) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-2xl font-bold">Campus SG</h1>
        <p className="mt-3 text-muted">
          Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (see .env.example).
        </p>
      </main>
    );
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("university").eq("id", user.id).maybeSingle();
  redirect(profile && isUniversity(profile.university) ? "/feed" : "/onboarding");
}
