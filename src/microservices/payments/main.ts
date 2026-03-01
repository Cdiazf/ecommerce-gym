import { NestFactory } from '@nestjs/core';
import { PaymentsModule } from './payments.module';
import { loadEnvironment } from '../../shared/config/env-loader';
import { getKafkaMicroserviceOptions } from '../../shared/kafka/kafka.config';

async function bootstrap() {
  loadEnvironment();
  const app = await NestFactory.createMicroservice(
    PaymentsModule,
    getKafkaMicroserviceOptions('payments-service', 'payments-consumer-group'),
  );

  await app.listen();
}

void bootstrap();
