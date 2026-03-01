import { NestFactory } from '@nestjs/core';
import { ShippingModule } from './shipping.module';
import { loadEnvironment } from '../../shared/config/env-loader';
import { getKafkaMicroserviceOptions } from '../../shared/kafka/kafka.config';

async function bootstrap() {
  loadEnvironment();
  const app = await NestFactory.createMicroservice(
    ShippingModule,
    getKafkaMicroserviceOptions('shipping-service', 'shipping-consumer-group'),
  );

  await app.listen();
}

void bootstrap();
