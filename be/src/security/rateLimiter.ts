import { AppError } from "../errors/AppError";

type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

type Counter = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Counter>();

export function rateLimit(
  key: string,
  config: RateLimitConfig,
  label: string
) {
  const now = Date.now();
  const record = store.get(key);

  if (!record || record.resetAt < now) {
    store.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return;
  }

  if (record.count >= config.limit) {
    console.error(`[RATE LIMIT] ${label} exceeded for ${key}`);

    throw new AppError(
      "RATE_LIMIT_EXCEEDED",
      `Too many ${label} requests. Please wait and try again.`
    );
  }

  record.count += 1;
}
