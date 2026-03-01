import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import {
  AUTH_RATE_LIMIT_METADATA,
  type AuthRateLimitProfile,
} from './auth-rate-limit.decorator';
import { AuthRateLimitService } from './auth-rate-limit.service';

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: AuthRateLimitService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const profile = this.reflector.get<AuthRateLimitProfile>(
      AUTH_RATE_LIMIT_METADATA,
      context.getHandler(),
    );

    if (!profile) {
      return true;
    }

    const request = context.switchToHttp().getRequest<
      Request & { route?: { path?: string } }
    >();

    const routePath = request.route?.path ?? 'unknown';
    const source =
      request.ip ||
      request.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      request.socket.remoteAddress ||
      'unknown';
    const key = `auth:${profile}:${routePath}:${source}`;
    const options =
      profile === 'login'
        ? {
            limit: Number(process.env.AUTH_LOGIN_MAX_ATTEMPTS ?? 5),
            windowSeconds: Number(process.env.AUTH_LOGIN_WINDOW_SECONDS ?? 60),
            blockSeconds: Number(process.env.AUTH_LOGIN_BLOCK_SECONDS ?? 300),
          }
        : {
            limit: Number(process.env.AUTH_REGISTER_MAX_ATTEMPTS ?? 10),
            windowSeconds: Number(process.env.AUTH_REGISTER_WINDOW_SECONDS ?? 300),
            blockSeconds: Number(process.env.AUTH_REGISTER_BLOCK_SECONDS ?? 300),
          };
    const retryAfterSeconds = this.rateLimitService.registerAttempt(key, options);

    if (retryAfterSeconds) {
      throw new HttpException(
        `Too many authentication attempts. Retry in ${retryAfterSeconds} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
