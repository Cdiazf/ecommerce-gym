import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ReserveStockUseCase } from '../../application/use-cases/reserve-stock.use-case';
import { ConfirmReservationUseCase } from '../../application/use-cases/confirm-reservation.use-case';
import { ListStockUseCase } from '../../application/use-cases/list-stock.use-case';
import { ReleaseReservationUseCase } from '../../application/use-cases/release-reservation.use-case';
import { UpsertStockItemUseCase } from '../../application/use-cases/upsert-stock-item.use-case';
import { DeleteStockItemUseCase } from '../../application/use-cases/delete-stock-item.use-case';
import type {
  ReserveStockRequest,
  UpsertStockItemRequest,
} from '../../application/ports/stock-repository.port';

@Controller()
export class InventoryMessageController {
  constructor(
    private readonly reserveStockUseCase: ReserveStockUseCase,
    private readonly confirmReservationUseCase: ConfirmReservationUseCase,
    private readonly listStockUseCase: ListStockUseCase,
    private readonly releaseReservationUseCase: ReleaseReservationUseCase,
    private readonly upsertStockItemUseCase: UpsertStockItemUseCase,
    private readonly deleteStockItemUseCase: DeleteStockItemUseCase,
  ) {}

  @MessagePattern('inventory.reserve_items')
  reserveItems(@Payload() payload: { orderId: string; items: ReserveStockRequest[] }) {
    return this.reserveStockUseCase.execute(payload.orderId, payload.items ?? []);
  }

  @MessagePattern('inventory.confirm_reservation')
  confirmReservation(@Payload() payload: { orderId: string }) {
    return this.confirmReservationUseCase.execute(payload.orderId);
  }

  @MessagePattern('inventory.release_reservation')
  releaseReservation(@Payload() payload: { orderId: string }) {
    return this.releaseReservationUseCase.execute(payload.orderId);
  }

  @MessagePattern('inventory.get_stock')
  getStock() {
    return this.listStockUseCase.execute();
  }

  @MessagePattern('inventory.upsert_stock_item')
  upsertStockItem(@Payload() payload: UpsertStockItemRequest) {
    return this.upsertStockItemUseCase.execute(payload);
  }

  @MessagePattern('inventory.delete_stock_item')
  deleteStockItem(@Payload() payload: { productId: string; variantId?: string | null }) {
    return this.deleteStockItemUseCase.execute(payload);
  }
}
