import { Injectable } from '@nestjs/common';

type AttemptRecord = {
  count: number;
  windowStartedAt: number;
  blockedUntil: number;
};

@Injectable()
export class AuthRateLimitService {
  private readonly attempts = new Map<string, AttemptRecord>();

  registerAttempt(
    key: string,
    options: { limit: number; windowSeconds: number; blockSeconds: number },
  ): number | null {
    const now = Date.now();
    const windowMs = options.windowSeconds * 1000;
    const blockMs = options.blockSeconds * 1000;
    const current = this.attempts.get(key);

    if (current && current.blockedUntil > now) {
      return Math.ceil((current.blockedUntil - now) / 1000);
    }

    const baseRecord =
      !current || now - current.windowStartedAt >= windowMs
        ? {
            count: 0,
            windowStartedAt: now,
            blockedUntil: 0,
          }
        : {
            ...current,
            blockedUntil: 0,
          };

    baseRecord.count += 1;

    if (baseRecord.count > options.limit) {
      baseRecord.blockedUntil = now + blockMs;
      this.attempts.set(key, baseRecord);
      return options.blockSeconds;
    }

    this.attempts.set(key, baseRecord);
    return null;
  }
}
