function getPublicUrlConfig() {
  const bucket = process.env.R2_BUCKET_NAME;
  let publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");

  // R2_PUBLIC_URL must be the bucket root (e.g. https://pub-xxx.r2.dev).
  // Strip a trailing /{bucket} if it was copied from the S3 endpoint by mistake.
  if (bucket && publicUrl?.endsWith(`/${bucket}`)) {
    publicUrl = publicUrl.slice(0, -(bucket.length + 1));
  }

  return { bucket, publicUrl };
}

export function buildPublicObjectUrl(key: string): string {
  const { bucket, publicUrl } = getPublicUrlConfig();
  if (!bucket || !publicUrl) {
    throw new Error("Missing R2_BUCKET_NAME or R2_PUBLIC_URL");
  }

  const normalizedKey = key.replace(/^\//, "");
  const encodedKey = normalizedKey
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  // Public R2 URLs (r2.dev or custom domain) are already scoped to one bucket.
  // Object keys live at the URL root — do not prefix the bucket name in the path.
  return `${publicUrl}/${encodedKey}`;
}

function stripBucketFromPublicPath(path: string, bucket: string | undefined): string {
  if (bucket && path.startsWith(`${bucket}/`)) {
    return path.slice(bucket.length + 1);
  }
  return path;
}

export function normalizeR2PublicUrl(
  url: string | null | undefined
): string | null {
  if (!url) return null;

  const { bucket, publicUrl } = getPublicUrlConfig();
  if (!bucket || !publicUrl || !url.startsWith(publicUrl)) {
    return url;
  }

  let path = url.slice(publicUrl.length).replace(/^\//, "");
  path = stripBucketFromPublicPath(path, bucket);

  if (path.startsWith("pictograms/")) {
    return `${publicUrl}/${path}`;
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
  path = stripBucketFromPublicPath(path, bucket);

  try {
    path = decodeURIComponent(path);
  } catch {
    // keep raw path if not percent-encoded
  }

  if (!path.startsWith("pictograms/")) {
    return null;
  }

  return path;
}

export function isManagedR2ImageUrl(url: string | null | undefined): boolean {
  return extractR2ObjectKey(url) !== null;
}
