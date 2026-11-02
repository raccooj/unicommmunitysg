import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isUniversity } from "@/lib/constants";
import { Header } from "@/components/Header";
import { UniversityForm } from "./UniversityForm";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("university").eq("id", user.id).maybeSingle();
  if (profile && isUniversity(profile.university)) redirect("/feed");

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-md px-4 py-8">
        <h1 className="text-2xl font-extrabold tracking-tight">Choose your university</h1>
        <p className="mt-2 mb-6 text-[15px] leading-relaxed text-muted">
          You&apos;ll see and post to this university&apos;s board only. This is self-declared, not verified, and can&apos;t be
          changed later.
        </p>
        <UniversityForm />
      </main>
    </>
  );
}
