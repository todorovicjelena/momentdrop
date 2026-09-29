export const EVENT_TYPES = ["wedding", "christening", "birthday", "other"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export type EventRow = {
  id: string;
  slug: string;
  title: string;
  event_type: EventType;
  event_date: string | null;
  uploads_open: boolean;
  created_at: string;
};

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const SERBIAN: Record<string, string> = { č: "c", ć: "c", š: "s", ž: "z", đ: "dj" };

// "Ana & Marko 2027" → "ana-i-marko-2027"
export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[čćšžđ]/g, (ch) => SERBIAN[ch])
    .replace(/&/g, " i ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

// "Ana & Marko" → ["A", "M"], "Lena 18" → ["L"]
export function monogram(title: string): [string, string?] {
  const parts = title.split(/\s*(?:&|\bi\b|\+)\s*/i).map((p) => p.trim()).filter(Boolean);
  const first = parts[0]?.[0]?.toUpperCase() ?? "?";
  const second = parts.length > 1 ? parts[1][0]?.toUpperCase() : undefined;
  return [first, second];
}

export function formatEventDate(date: string | null) {
  if (!date) return null;
  // Dates are stored as YYYY-MM-DD; parse as local date to avoid timezone shifts.
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("sr-Latn-RS", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(y, m - 1, d),
  );
}

// Full event row as the owner sees it on the settings page.
export type EventSettings = EventRow & {
  welcome_message: string | null;
  logo_key: string | null;
  cover_key: string | null;
  background_key: string | null;
  primary_color: string;
  upload_deadline: string | null;
  pin_hash: string | null;
  guests_can_view: boolean;
};

export const BRAND_COLORS = ["#ff6a33", "#e2476b", "#9b7bd6", "#4d6bff", "#3f8f6a", "#1d1b24"] as const;
export const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

// Logo, cover & full-page background uploads (host only). Images are
// compressed in the browser first. Background replaces the default swirl
// decoration on the guest page — paid plans only, see BRANDING.paidOnly.
export const BRANDING = {
  kinds: ["logo", "cover", "background"] as const,
  paidOnly: ["background"] as const,
  mimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  maxBytes: 5 * 1024 * 1024,
  maxDimension: { logo: 600, cover: 2000, background: 2400 },
};
export type BrandingKind = (typeof BRANDING.kinds)[number];

export function brandingKeyPrefix(eventId: string) {
  return `events/${eventId}/branding/`;
}

// Events happen in Serbia, so <input type="datetime-local"> values are
// Belgrade wall-clock time. These convert to/from ISO (UTC) for the database
// and give the same result on the server and in the browser.
export const EVENT_TIMEZONE = "Europe/Belgrade";
const LOCAL_INPUT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

// "Today" as YYYY-MM-DD in Belgrade time — used as the min for date pickers
// (event date, upload deadline) so hosts can't pick a day that's already past.
export function todayLocal(timeZone = EVENT_TIMEZONE) {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
}

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return { y: get("year"), m: get("month"), d: get("day"), h: get("hour"), min: get("minute") };
}

export function isoToLocalInput(iso: string | null, timeZone = EVENT_TIMEZONE) {
  if (!iso) return "";
  const { y, m, d, h, min } = zonedParts(new Date(iso), timeZone);
  return `${y}-${m}-${d}T${h}:${min}`;
}

export function localInputToIso(local: string, timeZone = EVENT_TIMEZONE) {
  if (!LOCAL_INPUT.test(local)) return null;
  const [date, time] = local.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  const asUtc = Date.UTC(y, m - 1, d, h, min);
  // How far the zone is from UTC at that moment (handles summer time).
  const p = zonedParts(new Date(asUtc), timeZone);
  const offset = Date.UTC(+p.y, +p.m - 1, +p.d, +p.h, +p.min) - asUtc;
  return new Date(asUtc - offset).toISOString();
}

// Uploads close when the host switches them off, the deadline has passed, or
// the event's storage retention (tied to its plan) has expired.
export function isUploadClosed(
  event: { uploads_open: boolean; upload_deadline: string | null; storage_expires_at?: string | null },
  now = new Date(),
) {
  return (
    !event.uploads_open ||
    (event.upload_deadline !== null && new Date(event.upload_deadline) < now) ||
    (event.storage_expires_at != null && new Date(event.storage_expires_at) < now)
  );
}
