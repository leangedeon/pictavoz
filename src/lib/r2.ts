import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { randomUUID } from "crypto";
import { buildPublicObjectUrl, extractR2ObjectKey } from "@/lib/r2-url";

/** Max width/height for uploaded pictogram images (px), aspect ratio preserved. */
const PICTOGRAM_IMAGE_MAX_PX = 120;

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  const missing = [
    !accountId && "R2_ACCOUNT_ID",
    !accessKeyId && "R2_ACCESS_KEY_ID",
    !secretAccessKey && "R2_SECRET_ACCESS_KEY",
    !bucket && "R2_BUCKET_NAME",
    !publicUrl && "R2_PUBLIC_URL",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(`Missing R2 env vars: ${missing.join(", ")}`);
  }

  const endpoint =
    process.env.R2_ENDPOINT?.trim() ||
    `https://${accountId}.r2.cloudflarestorage.com`;

  return {
    bucket: bucket!,
    publicUrl: publicUrl!.replace(/\/$/, ""),
    endpoint,
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
  };
}

function getR2Client() {
  const config = getR2Config();
  return new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

function formatR2Error(error: unknown, bucket: string): Error {
  const name =
    error && typeof error === "object" && "name" in error
      ? String(error.name)
      : "";
  const message =
    error instanceof Error ? error.message : "Upload failed";

  if (name === "NoSuchBucket" || message.includes("bucket does not exist")) {
    return new Error(
      `R2 bucket "${bucket}" does not exist. Create it in Cloudflare Dashboard → R2 → Create bucket (name must match R2_BUCKET_NAME).`
    );
  }

  return error instanceof Error ? error : new Error(message);
}

export async function optimizePictogramImage(buffer: Buffer): Promise<Buffer> {
  const { data } = await sharp(buffer)
    .rotate()
    .resize(PICTOGRAM_IMAGE_MAX_PX, PICTOGRAM_IMAGE_MAX_PX, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82, effort: 6 })
    .toUint8Array();

  return Buffer.from(data);
}

export async function optimizeAndUploadImage(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const config = getR2Config();
  const optimized = await optimizePictogramImage(buffer);

  const key = `pictograms/${randomUUID()}-${filename.replace(/\.[^.]+$/, "")}.webp`;

  const client = getR2Client();

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: optimized,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000",
      })
    );
  } catch (error) {
    throw formatR2Error(error, config.bucket);
  }

  return buildPublicObjectUrl(key);
}

export async function deleteR2ObjectByUrl(
  url: string | null | undefined
): Promise<void> {
  const key = extractR2ObjectKey(url);
  if (!key) return;

  const config = getR2Config();
  const client = getR2Client();

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: key,
      })
    );
  } catch (error) {
    console.error("Failed to delete R2 object:", key, error);
  }
}

async function deleteR2ObjectByKey(key: string): Promise<void> {
  const config = getR2Config();
  const client = getR2Client();

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: key,
      })
    );
  } catch (error) {
    console.error("Failed to delete R2 object:", key, error);
  }
}

export async function deleteR2ObjectsByUrls(
  urls: Array<string | null | undefined>
): Promise<void> {
  const keys = new Set<string>();
  for (const url of urls) {
    const key = extractR2ObjectKey(url);
    if (key) keys.add(key);
  }

  await Promise.all([...keys].map((key) => deleteR2ObjectByKey(key)));
}
