import { NestFactory } from '@nestjs/core';
import { OrdersModule } from './orders.module';
import { loadEnvironment } from '../../shared/config/env-loader';
import { getKafkaMicroserviceOptions } from '../../shared/kafka/kafka.config';

async function bootstrap() {
  loadEnvironment();
  const app = await NestFactory.createMicroservice(
    OrdersModule,
    getKafkaMicroserviceOptions('orders-service', 'orders-consumer-group'),
  );

  await app.listen();
}

void bootstrap();
