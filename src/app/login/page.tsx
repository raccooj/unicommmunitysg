import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthForm } from "./AuthForm";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Campus SG</h1>
      <p className="mt-2 mb-6 text-[15px] leading-relaxed text-muted">
        Anonymous boards for students at NUS, NTU, SMU and SIM. Your email is never shown to other users.
      </p>
      <AuthForm initialError={error === "confirm" ? "We couldn't sign you in from that link. If you opened it in another browser, your email is still confirmed — log in below." : undefined} />
      <p className="mt-6 text-xs leading-relaxed text-muted">
        University membership is self-declared and is not verified. Campus SG is an independent project and is not affiliated
        with any university.
      </p>
    </main>
  );
}
