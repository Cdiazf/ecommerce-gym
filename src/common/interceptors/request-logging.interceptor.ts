import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<{ method?: string; url?: string }>();
    const response = http.getResponse<{ statusCode?: number }>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(
            `${request.method ?? 'UNKNOWN'} ${request.url ?? '/'} ${response.statusCode ?? 200} ${Date.now() - startedAt}ms`,
          );
        },
        error: (error: unknown) => {
          const message =
            error instanceof Error ? error.message : 'Unknown request error';
          this.logger.error(
            `${request.method ?? 'UNKNOWN'} ${request.url ?? '/'} ${response.statusCode ?? 500} ${Date.now() - startedAt}ms: ${message}`,
          );
        },
      }),
    );
  }
}
