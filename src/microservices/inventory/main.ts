import { NestFactory } from '@nestjs/core';
import { InventoryModule } from './inventory.module';
import { loadEnvironment } from '../../shared/config/env-loader';
import { getKafkaMicroserviceOptions } from '../../shared/kafka/kafka.config';

async function bootstrap() {
  loadEnvironment();
  const app = await NestFactory.createMicroservice(
    InventoryModule,
    getKafkaMicroserviceOptions(
      'inventory-service',
      'inventory-consumer-group',
    ),
  );

  await app.listen();
}

void bootstrap();
