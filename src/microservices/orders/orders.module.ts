import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { INVENTORY_PORT } from './application/ports/inventory.port';
import { ORDER_EVENT_PUBLISHER_PORT } from './application/ports/order-event-publisher.port';
import { ORDER_REPOSITORY_PORT } from './application/ports/order-repository.port';
import { CreateOrderUseCase } from './application/use-cases/create-order.use-case';
import { CancelOrderUseCase } from './application/use-cases/cancel-order.use-case';
import { GetAllOrdersUseCase } from './application/use-cases/get-all-orders.use-case';
import { GetBestSellerProductsUseCase } from './application/use-cases/get-best-seller-products.use-case';
import { GetOrdersByCustomerUseCase } from './application/use-cases/get-orders-by-customer.use-case';
import { MarkOrderPaidUseCase } from './application/use-cases/mark-order-paid.use-case';
import { RetryPaymentUseCase } from './application/use-cases/retry-payment.use-case';
import { InventoryKafkaAdapter } from './infrastructure/adapters/inventory-kafka.adapter';
import { OrderEventsKafkaPublisher } from './infrastructure/adapters/order-events-kafka.publisher';
import {
  ORDERS_PG_POOL,
  PostgresOrderRepository,
} from './infrastructure/adapters/postgres-order.repository';
import { OrdersEventsController } from './infrastructure/controllers/orders-events.controller';
import { OrdersMessageController } from './infrastructure/controllers/orders-message.controller';
import { getKafkaBrokers } from '../../shared/kafka/kafka.config';
import { createPostgresPool } from '../../shared/postgres/postgres.config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'INVENTORY_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'orders-inventory-client',
            brokers: getKafkaBrokers(),
          },
          consumer: {
            groupId: 'orders-inventory-consumer',
          },
        },
      },
      {
        name: 'ORDER_EVENTS_BROKER',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'orders-events-client',
            brokers: getKafkaBrokers(),
          },
          consumer: {
            groupId: 'orders-events-consumer',
          },
        },
      },
    ]),
  ],
  controllers: [OrdersMessageController, OrdersEventsController],
  providers: [
    CreateOrderUseCase,
    CancelOrderUseCase,
    GetAllOrdersUseCase,
    GetBestSellerProductsUseCase,
    GetOrdersByCustomerUseCase,
    MarkOrderPaidUseCase,
    RetryPaymentUseCase,
    {
      provide: ORDERS_PG_POOL,
      useFactory: () =>
        createPostgresPool({
          dbEnvVar: 'ORDERS_DB_NAME',
          defaultDatabase: 'orders_db',
        }),
    },
    PostgresOrderRepository,
    InventoryKafkaAdapter,
    OrderEventsKafkaPublisher,
    {
      provide: ORDER_REPOSITORY_PORT,
      useExisting: PostgresOrderRepository,
    },
    {
      provide: INVENTORY_PORT,
      useExisting: InventoryKafkaAdapter,
    },
    {
      provide: ORDER_EVENT_PUBLISHER_PORT,
      useExisting: OrderEventsKafkaPublisher,
    },
  ],
})
export class OrdersModule {}
