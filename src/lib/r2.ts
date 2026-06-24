import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { randomUUID } from "crypto";
import { buildPublicObjectUrl, extractR2ObjectKey } from "@/lib/r2-url";

/** Max width/height for uploaded pictogram images (px), aspect ratio preserved. */
const PICTOGRAM_IMAGE_MAX_PX = 120;

function normalizeR2Endpoint(
  raw: string | undefined,
  accountId: string,
  bucket: string
): string {
  let endpoint = (
    raw?.trim() || `https://${accountId}.r2.cloudflarestorage.com`
  ).replace(/\/$/, "");

  if (bucket && endpoint.endsWith(`/${bucket}`)) {
    endpoint = endpoint.slice(0, -(bucket.length + 1));
  }

  return endpoint;
}

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

  return {
    bucket: bucket!,
    publicUrl: publicUrl!.replace(/\/$/, ""),
    endpoint: normalizeR2Endpoint(process.env.R2_ENDPOINT, accountId!, bucket!),
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

function formatImageProcessingError(error: unknown): Error {
  const message = error instanceof Error ? error.message : "Image processing failed";

  if (/unsupported image format|corrupt header|Input buffer/i.test(message)) {
    return new Error(
      "No se pudo procesar la imagen. Prueba con JPG o PNG, o toma la foto de nuevo."
    );
  }

  return error instanceof Error ? error : new Error(message);
}

export async function optimizePictogramImage(buffer: Buffer): Promise<Buffer> {
  if (!process.env.VIPS_MAX_IREF) {
    process.env.VIPS_MAX_IREF = "100";
  }

  try {
    const { data } = await sharp(buffer)
      .rotate()
      .resize(PICTOGRAM_IMAGE_MAX_PX, PICTOGRAM_IMAGE_MAX_PX, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82, effort: 6 })
      .toUint8Array();

    return Buffer.from(data);
  } catch (error) {
    throw formatImageProcessingError(error);
  }
}

export async function optimizeAndUploadImage(
  buffer: Buffer,
  _filename?: string
): Promise<string> {
  const config = getR2Config();
  const optimized = await optimizePictogramImage(buffer);

  const key = `pictograms/${randomUUID()}.webp`;

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
