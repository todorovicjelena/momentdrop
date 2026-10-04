// Guest upload rules — shared by the browser (early feedback) and the server (enforcement).

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif", "image/webp"] as const;
export const VIDEO_TYPES = ["video/mp4", "video/quicktime"] as const;
// Recorded in-browser via MediaRecorder — Chrome/Android give webm, Safari/iOS gives mp4.
export const AUDIO_TYPES = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/ogg"] as const;

export const UPLOAD_LIMITS = {
  maxImageBytes: 30 * 1024 * 1024, // after compression (HEIC/HEIF is converted to JPEG first)
  maxVideoBytes: 150 * 1024 * 1024,
  maxVideoSeconds: 60,
  maxAudioBytes: 20 * 1024 * 1024,
  maxAudioSeconds: 120, // 2-minute voice message, matches the Premium "audio guestbook" pitch
  maxFilesPerGuest: 50,
  imageMaxDimension: 2500,
  imageQuality: 0.8,
};

export const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
};

export type FileKind = "image" | "video" | "audio";

export function fileKind(mime: string): FileKind | null {
  if ((IMAGE_TYPES as readonly string[]).includes(mime)) return "image";
  if ((VIDEO_TYPES as readonly string[]).includes(mime)) return "video";
  if ((AUDIO_TYPES as readonly string[]).includes(mime)) return "audio";
  return null;
}

export function maxBytes(kind: FileKind) {
  if (kind === "image") return UPLOAD_LIMITS.maxImageBytes;
  if (kind === "video") return UPLOAD_LIMITS.maxVideoBytes;
  return UPLOAD_LIMITS.maxAudioBytes;
}

// Guests upload into events/<eventId>/<uuid>.<ext>; branding lives in a subfolder.
export function guestKeyPrefix(eventId: string) {
  return `events/${eventId}/`;
}

export const GUEST_NAME_MAX = 80;

export const toMb = (bytes: number) => Math.round((bytes / 1024 / 1024) * 10) / 10;
export const maxMb = (kind: FileKind) => Math.round(maxBytes(kind) / 1024 / 1024);
export const fileExtension = (name: string) => (name.includes(".") ? name.split(".").pop()!.toLowerCase() : "");
