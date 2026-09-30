"use server";

import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";
import { getOrigin } from "@/lib/origin";
import { getT } from "@/lib/i18n/server";
import type { Messages } from "@/lib/i18n";

export type AuthState = { error?: string; checkEmail?: boolean } | undefined;

function mapError(error: AuthError, errors: Messages["auth"]["errors"]): string {
  switch (error.code) {
    case "invalid_credentials":
      return errors.invalidCredentials;
    case "email_not_confirmed":
      return errors.emailNotConfirmed;
    case "user_already_exists":
    case "email_exists":
      return errors.userExists;
    case "weak_password":
      return errors.weakPassword;
    case "email_address_invalid":
      return errors.invalidEmail;
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return errors.rateLimit;
    default:
      console.error("Supabase auth error:", error.code, error.message);
      return errors.generic;
  }
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const errors = (await getT()).auth.errors;
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: mapError(error, errors) };

  redirect(safeNext(formData.get("next")));
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const errors = (await getT()).auth.errors;
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name) return { error: errors.nameRequired };
  if (password.length < 8) return { error: errors.weakPassword };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Saved in auth.users.raw_user_meta_data; phase 2 copies it into profiles.
      data: { name },
      emailRedirectTo: `${await getOrigin()}/auth/callback?next=/dashboard`,
    },
  });
  if (error) return { error: mapError(error, errors) };

  // With email confirmation enabled there is no session yet.
  if (!data.session) return { checkEmail: true };

  redirect("/dashboard");
}

export async function loginWithGoogle(formData: FormData) {
  const next = safeNext(formData.get("next"));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await getOrigin()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error || !data.url) {
    console.error("Google OAuth error:", error?.message);
    redirect("/login?error=oauth");
  }
  redirect(data.url);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
