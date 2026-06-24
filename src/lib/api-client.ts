export async function parseJsonResponse<T>(
  res: Response,
  fallbackError: string
): Promise<T> {
  const text = await res.text();

  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      if (!res.ok) {
        throw new Error(
          text.trim().startsWith("<")
            ? `Error del servidor (${res.status}). Intenta de nuevo.`
            : fallbackError
        );
      }
      throw new Error(fallbackError);
    }
  }

  if (!res.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : fallbackError;
    throw new Error(message);
  }

  return data as T;
}
