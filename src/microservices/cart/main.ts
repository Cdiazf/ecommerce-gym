import { NestFactory } from '@nestjs/core';
import { getKafkaMicroserviceOptions } from '../../shared/kafka/kafka.config';
import { loadEnvironment } from '../../shared/config/env-loader';
import { CartModule } from './cart.module';

async function bootstrap() {
  loadEnvironment();
  const app = await NestFactory.createMicroservice(
    CartModule,
    getKafkaMicroserviceOptions('cart-service', 'cart-consumer-group'),
  );

  await app.listen();
}

void bootstrap();
