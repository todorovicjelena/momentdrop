"use client";

import { createContext, useContext } from "react";
import { getMessages, type Locale, type Messages } from "@/lib/i18n";

const I18nContext = createContext<Locale | null>(null);

// Seeded once, server-side, in the root layout, with only the locale code —
// a plain string is serializable across the server→client boundary, but the
// full messages object isn't (it has functions, e.g. plurals), so each
// Client Component resolves its own messages from that string via getMessages().
export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <I18nContext.Provider value={locale}>{children}</I18nContext.Provider>;
}

export function useLocale(): Locale {
  const locale = useContext(I18nContext);
  if (!locale) throw new Error("useT()/useLocale() must be used within <I18nProvider>");
  return locale;
}

export function useT(): Messages {
  return getMessages(useLocale());
}
