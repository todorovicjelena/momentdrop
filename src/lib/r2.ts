import "server-only";
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cloudflare R2 speaks the S3 API. The bucket is private: browsers upload
// with short-lived presigned PUT URLs and view files with presigned GET URLs.
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const Bucket = process.env.R2_BUCKET!;

// URL the browser can PUT exactly this file to (type and size are signed).
export function presignPut(key: string, contentType: string, size: number, expiresIn = 600) {
  return getSignedUrl(s3, new PutObjectCommand({ Bucket, Key: key, ContentType: contentType, ContentLength: size }), {
    expiresIn,
  });
}

// downloadName: makes the browser save the file (with that name) instead of opening it.
export function presignGet(key: string, expiresIn = 3600, downloadName?: string) {
  // Plain ASCII fallback for old browsers + UTF-8 version (č, ć, š…) for the rest.
  const ascii = downloadName?.normalize("NFD").replace(/[^\x20-\x7e]/g, "").replace(/["\\]/g, "");
  const disposition = downloadName
    ? `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`
    : undefined;
  return getSignedUrl(s3, new GetObjectCommand({ Bucket, Key: key, ResponseContentDisposition: disposition }), { expiresIn });
}

// Returns the object's size, or null if it doesn't exist (e.g. upload failed).
export async function objectSize(key: string) {
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket, Key: key }));
    return head.ContentLength ?? 0;
  } catch {
    return null;
  }
}

export async function deleteObject(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket, Key: key }));
}

// Whole-event cleanup can mean hundreds/thousands of keys — S3's batch delete
// takes up to 1000 per call, so chunk rather than firing one request per file.
export async function deleteObjects(keys: string[]) {
  for (let i = 0; i < keys.length; i += 1000) {
    const chunk = keys.slice(i, i + 1000);
    await s3.send(new DeleteObjectsCommand({ Bucket, Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true } }));
  }
}
