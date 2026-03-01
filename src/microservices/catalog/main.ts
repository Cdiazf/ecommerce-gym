import { NestFactory } from '@nestjs/core';
import { CatalogModule } from './catalog.module';
import { loadEnvironment } from '../../shared/config/env-loader';
import { getKafkaMicroserviceOptions } from '../../shared/kafka/kafka.config';

async function bootstrap() {
  loadEnvironment();
  const app = await NestFactory.createMicroservice(
    CatalogModule,
    getKafkaMicroserviceOptions('catalog-service', 'catalog-consumer-group'),
  );

  await app.listen();
}

void bootstrap();
