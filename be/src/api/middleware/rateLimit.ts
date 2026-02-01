import type { Request, Response, NextFunction } from "express";

const store = new Map<string, { count: number; resetAt: number }>();

export const apiRateLimit =
  (limit: number, windowMs: number) =>
  (req: Request, res: Response, next: NextFunction) => {
    const key =
      req.headers["x-session-id"] ||
      req.ip;

    const now = Date.now();
    const record = store.get(key as string);

    if (!record || record.resetAt < now) {
      store.set(key as string, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }

    if (record.count >= limit) {
      console.error("[API RATE LIMIT]", key);
      return res.status(429).json({
        error: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Please slow down.",
      });
    }

    record.count += 1;
    next();
  };
