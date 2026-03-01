import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CATALOG_EVENT_PUBLISHER_PORT } from './application/ports/catalog-event-publisher.port';
import { PRODUCT_COMMAND_PORT } from './application/ports/product-command.port';
import { PRODUCT_QUERY_PORT } from './application/ports/product-query.port';
import { CreateProductVariantUseCase } from './application/use-cases/create-product-variant.use-case';
import { CreateProductUseCase } from './application/use-cases/create-product.use-case';
import { UpdateProductUseCase } from './application/use-cases/update-product.use-case';
import { DeleteProductUseCase } from './application/use-cases/delete-product.use-case';
import { ListProductsUseCase } from './application/use-cases/list-products.use-case';
import { CatalogEventsKafkaPublisher } from './infrastructure/adapters/catalog-events-kafka.publisher';
import { CatalogMessageController } from './infrastructure/controllers/catalog-message.controller';
import {
  CATALOG_PG_POOL,
  PostgresProductRepository,
} from './infrastructure/adapters/postgres-product.repository';
import { getKafkaBrokers } from '../../shared/kafka/kafka.config';
import { createPostgresPool } from '../../shared/postgres/postgres.config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'CATALOG_EVENTS_BROKER',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'catalog-events-client',
            brokers: getKafkaBrokers(),
          },
          consumer: {
            groupId: 'catalog-events-consumer',
          },
        },
      },
    ]),
  ],
  controllers: [CatalogMessageController],
  providers: [
    ListProductsUseCase,
    CreateProductUseCase,
    CreateProductVariantUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
    {
      provide: CATALOG_PG_POOL,
      useFactory: () =>
        createPostgresPool({
          dbEnvVar: 'CATALOG_DB_NAME',
          defaultDatabase: 'catalog_db',
        }),
    },
    PostgresProductRepository,
    CatalogEventsKafkaPublisher,
    {
      provide: PRODUCT_COMMAND_PORT,
      useExisting: PostgresProductRepository,
    },
    {
      provide: PRODUCT_QUERY_PORT,
      useExisting: PostgresProductRepository,
    },
    {
      provide: CATALOG_EVENT_PUBLISHER_PORT,
      useExisting: CatalogEventsKafkaPublisher,
    },
  ],
})
export class CatalogModule {}
