import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).nav.login };
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const t = await getT();
  const { next, error } = await searchParams;

  return (
    <AuthShell title={t.auth.loginTitle} subtitle={t.auth.loginSubtitle}>
      <AuthForm
        mode="login"
        next={typeof next === "string" ? next : undefined}
        initialError={error ? t.auth.errors.callbackFailed : undefined}
      />
    </AuthShell>
  );
}
