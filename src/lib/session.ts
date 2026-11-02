import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isUniversity, type UniversityCode } from "@/lib/constants";

/** Returns the signed-in user and their university, redirecting if either is missing. */
export async function requireMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("university")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw new Error("Could not load your profile.");
  if (!profile || !isUniversity(profile.university)) redirect("/onboarding");

  return { supabase, user, university: profile.university as UniversityCode };
}
