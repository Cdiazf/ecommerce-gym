import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { getKafkaBrokers } from '../../shared/kafka/kafka.config';
import { PAYMENT_EVENT_PUBLISHER_PORT } from './application/ports/payment-event-publisher.port';
import { CULQI_GATEWAY_PORT } from './application/ports/culqi-gateway.port';
import { PAYMENT_REPOSITORY_PORT } from './application/ports/payment-repository.port';
import { GetAllPaymentsUseCase } from './application/use-cases/get-all-payments.use-case';
import { GetPaymentByOrderUseCase } from './application/use-cases/get-payment-by-order.use-case';
import { ProcessPaymentUseCase } from './application/use-cases/process-payment.use-case';
import { StartYapePaymentUseCase } from './application/use-cases/start-yape-payment.use-case';
import { ConfirmYapePaymentUseCase } from './application/use-cases/confirm-yape-payment.use-case';
import { FailYapePaymentUseCase } from './application/use-cases/fail-yape-payment.use-case';
import { ExpirePendingPaymentsUseCase } from './application/use-cases/expire-pending-payments.use-case';
import { ExpireYapePaymentUseCase } from './application/use-cases/expire-yape-payment.use-case';
import { PaymentsExpirationWorker } from './application/use-cases/payments-expiration.worker';
import { RetryYapePaymentUseCase } from './application/use-cases/retry-yape-payment.use-case';
import { CreateCulqiYapeChargeUseCase } from './application/use-cases/create-culqi-yape-charge.use-case';
import { ProcessCulqiWebhookUseCase } from './application/use-cases/process-culqi-webhook.use-case';
import { PaymentEventsKafkaPublisher } from './infrastructure/adapters/payment-events-kafka.publisher';
import { CulqiHttpGateway } from './infrastructure/adapters/culqi-http.gateway';
import {
  PAYMENTS_PG_POOL,
  PostgresPaymentRepository,
} from './infrastructure/adapters/postgres-payment.repository';
import { PaymentsEventController } from './infrastructure/controllers/payments-event.controller';
import { PaymentsMessageController } from './infrastructure/controllers/payments-message.controller';
import { createPostgresPool } from '../../shared/postgres/postgres.config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PAYMENT_EVENTS_BROKER',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'payments-events-client',
            brokers: getKafkaBrokers(),
          },
          consumer: {
            groupId: 'payments-events-consumer',
          },
        },
      },
    ]),
  ],
  controllers: [PaymentsEventController, PaymentsMessageController],
  providers: [
    ProcessPaymentUseCase,
    GetAllPaymentsUseCase,
    GetPaymentByOrderUseCase,
    StartYapePaymentUseCase,
    ConfirmYapePaymentUseCase,
    FailYapePaymentUseCase,
    ExpirePendingPaymentsUseCase,
    ExpireYapePaymentUseCase,
    PaymentsExpirationWorker,
    RetryYapePaymentUseCase,
    CreateCulqiYapeChargeUseCase,
    ProcessCulqiWebhookUseCase,
    {
      provide: PAYMENTS_PG_POOL,
      useFactory: () =>
        createPostgresPool({
          dbEnvVar: 'PAYMENTS_DB_NAME',
          defaultDatabase: 'payments_db',
        }),
    },
    PostgresPaymentRepository,
    PaymentEventsKafkaPublisher,
    CulqiHttpGateway,
    {
      provide: PAYMENT_REPOSITORY_PORT,
      useExisting: PostgresPaymentRepository,
    },
    {
      provide: PAYMENT_EVENT_PUBLISHER_PORT,
      useExisting: PaymentEventsKafkaPublisher,
    },
    {
      provide: CULQI_GATEWAY_PORT,
      useExisting: CulqiHttpGateway,
    },
  ],
})
export class PaymentsModule {}
