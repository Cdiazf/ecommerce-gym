import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { GatewayController } from './gateway.controller';
import { getKafkaBrokers } from '../shared/kafka/kafka.config';
import { AuthModule } from './auth/auth.module';
import { createPostgresPool } from '../shared/postgres/postgres.config';
import {
  IDEMPOTENCY_PG_POOL,
  IdempotencyRepository,
} from './idempotency.repository';
import { IdempotencyService } from './idempotency.service';

@Module({
  imports: [
    AuthModule,
    ClientsModule.register([
      {
        name: 'CATALOG_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'gateway-catalog-client',
            brokers: getKafkaBrokers(),
          },
          consumer: {
            groupId: 'gateway-catalog-consumer',
          },
        },
      },
      {
        name: 'ORDERS_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'gateway-orders-client',
            brokers: getKafkaBrokers(),
          },
          consumer: {
            groupId: 'gateway-orders-consumer',
          },
        },
      },
      {
        name: 'INVENTORY_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'gateway-inventory-client',
            brokers: getKafkaBrokers(),
          },
          consumer: {
            groupId: 'gateway-inventory-consumer',
          },
        },
      },
      {
        name: 'PAYMENTS_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'gateway-payments-client',
            brokers: getKafkaBrokers(),
          },
          consumer: {
            groupId: 'gateway-payments-consumer',
          },
        },
      },
      {
        name: 'SHIPPING_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'gateway-shipping-client',
            brokers: getKafkaBrokers(),
          },
          consumer: {
            groupId: 'gateway-shipping-consumer',
          },
        },
      },
      {
        name: 'CART_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'gateway-cart-client',
            brokers: getKafkaBrokers(),
          },
          consumer: {
            groupId: 'gateway-cart-consumer',
          },
        },
      },
    ]),
  ],
  controllers: [GatewayController],
  providers: [
    {
      provide: IDEMPOTENCY_PG_POOL,
      useFactory: () =>
        createPostgresPool({
          dbEnvVar: 'AUTH_DB_NAME',
          defaultDatabase: 'auth_db',
        }),
    },
    IdempotencyRepository,
    IdempotencyService,
  ],
})
export class GatewayModule {}
