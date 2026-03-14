export async function withRequestTiming<T>(
  label: string,
  callback: () => Promise<T>,
): Promise<T> {
  if (process.env.NODE_ENV === "production") {
    return callback();
  }

  let shouldLog = false;

  try {
    const { headers } = await import("next/headers");
    const requestHeaders = await headers();
    shouldLog = requestHeaders.get("x-mi-copi-timing") === "1";
  } catch {
    return callback();
  }

  if (!shouldLog) {
    return callback();
  }

  const startedAt = performance.now();

  try {
    return await callback();
  } finally {
    const durationMs = Math.round((performance.now() - startedAt) * 10) / 10;
    console.info(`[mi-copi-timing] ${label} ${durationMs}ms`);
  }
}
