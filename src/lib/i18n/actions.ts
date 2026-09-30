"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { locales, LOCALE_COOKIE, type Locale } from "./index";

// Flips the language everywhere: the cookie LanguageToggle reads, plus a full
// re-render of every Server Component (revalidatePath) so the switch is instant.
export async function setLocale(locale: Locale) {
  if (!(locales as readonly string[]).includes(locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}
