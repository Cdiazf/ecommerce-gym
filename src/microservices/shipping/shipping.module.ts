import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { getKafkaBrokers } from '../../shared/kafka/kafka.config';
import { SHIPMENT_REPOSITORY_PORT } from './application/ports/shipment-repository.port';
import { SHIPPING_EVENT_PUBLISHER_PORT } from './application/ports/shipping-event-publisher.port';
import { CreateShipmentUseCase } from './application/use-cases/create-shipment.use-case';
import { GetAllShipmentsUseCase } from './application/use-cases/get-all-shipments.use-case';
import { GetShipmentByOrderUseCase } from './application/use-cases/get-shipment-by-order.use-case';
import { UpdateShipmentStatusUseCase } from './application/use-cases/update-shipment-status.use-case';
import { ShippingEventsKafkaPublisher } from './infrastructure/adapters/shipping-events-kafka.publisher';
import {
  PostgresShipmentRepository,
  SHIPPING_PG_POOL,
} from './infrastructure/adapters/postgres-shipment.repository';
import { ShippingEventController } from './infrastructure/controllers/shipping-event.controller';
import { ShippingMessageController } from './infrastructure/controllers/shipping-message.controller';
import { createPostgresPool } from '../../shared/postgres/postgres.config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'SHIPPING_EVENTS_BROKER',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'shipping-events-client',
            brokers: getKafkaBrokers(),
          },
          consumer: {
            groupId: 'shipping-events-consumer',
          },
        },
      },
    ]),
  ],
  controllers: [ShippingEventController, ShippingMessageController],
  providers: [
    CreateShipmentUseCase,
    GetAllShipmentsUseCase,
    GetShipmentByOrderUseCase,
    UpdateShipmentStatusUseCase,
    {
      provide: SHIPPING_PG_POOL,
      useFactory: () =>
        createPostgresPool({
          dbEnvVar: 'SHIPPING_DB_NAME',
          defaultDatabase: 'shipping_db',
        }),
    },
    PostgresShipmentRepository,
    ShippingEventsKafkaPublisher,
    {
      provide: SHIPMENT_REPOSITORY_PORT,
      useExisting: PostgresShipmentRepository,
    },
    {
      provide: SHIPPING_EVENT_PUBLISHER_PORT,
      useExisting: ShippingEventsKafkaPublisher,
    },
  ],
})
export class ShippingModule {}
