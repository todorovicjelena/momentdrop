import { sr } from "./sr";
import { en } from "./en";

export const locales = ["sr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "sr";
export const LOCALE_COOKIE = "momentdrop_locale";

// For Intl.DateTimeFormat/NumberFormat, which want a real BCP 47 tag, not our
// short app locale code.
export const intlLocale: Record<Locale, string> = { sr: "sr-Latn-RS", en: "en-US" };

// sr.ts is declared `as const` (so plain string properties are usable as
// literal types where handy); widen those literals back to `string` here so
// the shared Messages type describes the *shape*, not Serbian's exact words —
// otherwise en.ts could only ever "translate" to the same Serbian text.
type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly Widen<U>[]
    : T extends (...args: infer A) => infer R
      ? (...args: A) => R
      : T extends object
        ? { [K in keyof T]: Widen<T[K]> }
        : T;

export type Messages = Widen<typeof sr>;

// Explicit return type: forces en.ts to structurally match sr.ts exactly
// (same keys, same function signatures) — a missing/misshapen translation
// is a build error, not a silent runtime gap.
const dictionaries: Record<Locale, Messages> = { sr, en };

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale];
}
