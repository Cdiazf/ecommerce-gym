import { SetMetadata } from '@nestjs/common';

export type AuthRateLimitProfile = 'login' | 'register';

export const AUTH_RATE_LIMIT_METADATA = 'auth-rate-limit-options';

export const AuthRateLimit = (profile: AuthRateLimitProfile) =>
  SetMetadata(AUTH_RATE_LIMIT_METADATA, profile);
