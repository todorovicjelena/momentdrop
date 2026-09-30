import "server-only";
import { cookies } from "next/headers";
import { defaultLocale, getMessages, locales, LOCALE_COOKIE, type Locale } from "./index";

// Server Components / Server Actions: read the language from the cookie
// LanguageToggle sets. No cookie yet (first visit) → Serbian.
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return (locales as readonly string[]).includes(value ?? "") ? (value as Locale) : defaultLocale;
}

export async function getT() {
  return getMessages(await getLocale());
}
