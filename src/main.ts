import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import { createGlobalValidationPipe } from './common/validation/create-global-validation-pipe';
import { loadEnvironment } from './shared/config/env-loader';

function createCorsOriginMatcher() {
  const configuredOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return (requestOrigin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    if (!requestOrigin) {
      callback(null, true);
      return;
    }

    const isAllowed = configuredOrigins.some((allowedOrigin) => {
      if (allowedOrigin === '*') {
        return true;
      }

      if (allowedOrigin.includes('*')) {
        const escapedPattern = allowedOrigin
          .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
          .replace(/\*/g, '.*');

        return new RegExp(`^${escapedPattern}$`).test(requestOrigin);
      }

      return allowedOrigin === requestOrigin;
    });

    callback(isAllowed ? null : new Error(`CORS blocked for origin: ${requestOrigin}`), isAllowed);
  };
}

async function bootstrap() {
  loadEnvironment();
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const expressApp = app.getHttpAdapter().getInstance();

  expressApp.set('trust proxy', 1);

  app.useGlobalPipes(createGlobalValidationPipe());
  app.useGlobalInterceptors(new RequestLoggingInterceptor());

  app.enableCors({
    origin: createCorsOriginMatcher(),
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'ngrok-skip-browser-warning',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    optionsSuccessStatus: 204,
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  logger.log(`Gateway listening on port ${port}`);
}
void bootstrap();
