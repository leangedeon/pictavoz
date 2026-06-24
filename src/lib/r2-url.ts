function getPublicUrlConfig() {
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  return { bucket, publicUrl };
}

export function buildPublicObjectUrl(key: string): string {
  const { bucket, publicUrl } = getPublicUrlConfig();
  if (!bucket || !publicUrl) {
    throw new Error("Missing R2_BUCKET_NAME or R2_PUBLIC_URL");
  }

  const normalizedKey = key.replace(/^\//, "");

  if (publicUrl.endsWith(`/${bucket}`)) {
    return `${publicUrl}/${normalizedKey}`;
  }

  return `${publicUrl}/${bucket}/${normalizedKey}`;
}

export function normalizeR2PublicUrl(
  url: string | null | undefined
): string | null {
  if (!url) return null;

  const { bucket, publicUrl } = getPublicUrlConfig();
  if (!bucket || !publicUrl || !url.startsWith(publicUrl)) {
    return url;
  }

  const path = url.slice(publicUrl.length).replace(/^\//, "");
  if (path.startsWith(`${bucket}/`)) {
    return url;
  }

  if (path.startsWith("pictograms/")) {
    return `${publicUrl}/${bucket}/${path}`;
  }

  return url;
}

export function extractR2ObjectKey(
  url: string | null | undefined
): string | null {
  if (!url) return null;

  const normalized = normalizeR2PublicUrl(url);
  if (!normalized) return null;

  const { bucket, publicUrl } = getPublicUrlConfig();
  if (!publicUrl || !normalized.startsWith(publicUrl)) {
    return null;
  }

  let path = normalized.slice(publicUrl.length).replace(/^\//, "");
  if (bucket && path.startsWith(`${bucket}/`)) {
    path = path.slice(bucket.length + 1);
  }

  if (!path.startsWith("pictograms/")) {
    return null;
  }

  return path;
}

export function isManagedR2ImageUrl(url: string | null | undefined): boolean {
  return extractR2ObjectKey(url) !== null;
}
