import { Module } from '@nestjs/common';
import { STOCK_REPOSITORY_PORT } from './application/ports/stock-repository.port';
import { EnsureStockItemUseCase } from './application/use-cases/ensure-stock-item.use-case';
import { ConfirmReservationUseCase } from './application/use-cases/confirm-reservation.use-case';
import { ReserveStockUseCase } from './application/use-cases/reserve-stock.use-case';
import { ListStockUseCase } from './application/use-cases/list-stock.use-case';
import { ReleaseReservationUseCase } from './application/use-cases/release-reservation.use-case';
import { UpsertStockItemUseCase } from './application/use-cases/upsert-stock-item.use-case';
import { DeleteStockItemUseCase } from './application/use-cases/delete-stock-item.use-case';
import { InventoryEventsController } from './infrastructure/controllers/inventory-events.controller';
import { InventoryMessageController } from './infrastructure/controllers/inventory-message.controller';
import {
  INVENTORY_PG_POOL,
  PostgresStockRepository,
} from './infrastructure/adapters/postgres-stock.repository';
import { createPostgresPool } from '../../shared/postgres/postgres.config';

@Module({
  controllers: [InventoryMessageController, InventoryEventsController],
  providers: [
    ReserveStockUseCase,
    ConfirmReservationUseCase,
    ListStockUseCase,
    ReleaseReservationUseCase,
    UpsertStockItemUseCase,
    DeleteStockItemUseCase,
    EnsureStockItemUseCase,
    {
      provide: INVENTORY_PG_POOL,
      useFactory: () =>
        createPostgresPool({
          dbEnvVar: 'INVENTORY_DB_NAME',
          defaultDatabase: 'inventory_db',
        }),
    },
    PostgresStockRepository,
    {
      provide: STOCK_REPOSITORY_PORT,
      useExisting: PostgresStockRepository,
    },
  ],
})
export class InventoryModule {}
