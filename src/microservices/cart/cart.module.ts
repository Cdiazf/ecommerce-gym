import { Module } from '@nestjs/common';
import { createPostgresPool } from '../../shared/postgres/postgres.config';
import { CART_REPOSITORY_PORT } from './application/ports/cart-repository.port';
import { ClearCartUseCase } from './application/use-cases/clear-cart.use-case';
import { GetCartUseCase } from './application/use-cases/get-cart.use-case';
import { RemoveCartItemUseCase } from './application/use-cases/remove-cart-item.use-case';
import { UpsertCartItemUseCase } from './application/use-cases/upsert-cart-item.use-case';
import {
  CART_PG_POOL,
  PostgresCartRepository,
} from './infrastructure/adapters/postgres-cart.repository';
import { CartMessageController } from './infrastructure/controllers/cart-message.controller';

@Module({
  controllers: [CartMessageController],
  providers: [
    GetCartUseCase,
    UpsertCartItemUseCase,
    RemoveCartItemUseCase,
    ClearCartUseCase,
    {
      provide: CART_PG_POOL,
      useFactory: () =>
        createPostgresPool({
          dbEnvVar: 'CART_DB_NAME',
          defaultDatabase: 'orders_db',
        }),
    },
    PostgresCartRepository,
    {
      provide: CART_REPOSITORY_PORT,
      useExisting: PostgresCartRepository,
    },
  ],
})
export class CartModule {}
