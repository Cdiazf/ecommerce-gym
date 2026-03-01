import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import { createGlobalValidationPipe } from './common/validation/create-global-validation-pipe';
import { loadEnvironment } from './shared/config/env-loader';

async function bootstrap() {
  loadEnvironment();
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const expressApp = app.getHttpAdapter().getInstance();

  expressApp.set('trust proxy', 1);

  app.useGlobalPipes(createGlobalValidationPipe());
  app.useGlobalInterceptors(new RequestLoggingInterceptor());

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()) ?? [
      'http://localhost:5173',
    ],
    credentials: true,
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  logger.log(`Gateway listening on port ${port}`);
}
void bootstrap();
