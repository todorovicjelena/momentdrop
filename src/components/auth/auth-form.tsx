"use client";

import { useActionState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError, FormField } from "@/components/form-field";
import { login, signup, type AuthState } from "@/app/(auth)/actions";
import { GoogleButton } from "./google-button";
import { useT } from "@/components/i18n-provider";

// Turn on once the Google provider is configured in Supabase.
const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

type Props = {
  mode: "login" | "signup";
  next?: string;
  initialError?: string;
};

export function AuthForm({ mode, next, initialError }: Props) {
  const t = useT();
  const isSignup = mode === "signup";
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    isSignup ? signup : login,
    initialError ? { error: initialError } : undefined,
  );

  if (state?.checkEmail) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="grid size-16 place-items-center rounded-3xl bg-lilac">
          <MailCheck className="size-8" aria-hidden />
        </div>
        <h2 className="font-serif text-3xl">{t.auth.checkEmailTitle}</h2>
        <p className="text-muted-foreground">{t.auth.checkEmailText}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {GOOGLE_ENABLED && (
        <>
          <GoogleButton next={next} />
          <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t.auth.or}
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        {next && <input type="hidden" name="next" value={next} />}

        {isSignup && (
          <FormField id="name" label={t.auth.name}>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              placeholder={t.auth.namePlaceholder}
              required
            />
          </FormField>
        )}

        <FormField id="email" label={t.auth.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder={t.auth.emailPlaceholder}
            required
          />
        </FormField>

        <FormField id="password" label={t.auth.password} hint={isSignup ? t.auth.passwordHint : undefined}>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            minLength={isSignup ? 8 : undefined}
            required
          />
        </FormField>

        <FormError message={state?.error} />

        <Button type="submit" size="lg" className="mt-1 shadow-lg shadow-primary/25" disabled={pending}>
          {isSignup ? t.auth.signupButton : t.auth.loginButton}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {isSignup ? t.auth.haveAccount : t.auth.noAccount}{" "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-semibold text-foreground underline decoration-lilac decoration-2 underline-offset-4"
        >
          {isSignup ? t.nav.login : t.nav.signup}
        </Link>
      </p>
    </div>
  );
}
