import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ConfirmReservationUseCase } from '../../application/use-cases/confirm-reservation.use-case';
import { EnsureStockItemUseCase } from '../../application/use-cases/ensure-stock-item.use-case';
import { ReleaseReservationUseCase } from '../../application/use-cases/release-reservation.use-case';

interface CatalogProductCreatedEvent {
  productId: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

interface CatalogVariantCreatedEvent {
  productId: string;
  variantId: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

@Controller()
export class InventoryEventsController {
  constructor(
    private readonly ensureStockItemUseCase: EnsureStockItemUseCase,
    private readonly confirmReservationUseCase: ConfirmReservationUseCase,
    private readonly releaseReservationUseCase: ReleaseReservationUseCase,
  ) {}

  @EventPattern('catalog.product.created')
  async handleCatalogProductCreated(
    @Payload() payload: CatalogProductCreatedEvent,
  ): Promise<void> {
    await this.ensureStockItemUseCase.execute({
      productId: payload.productId,
      variantId: null,
      status: payload.status,
    });
  }

  @EventPattern('catalog.variant.created')
  async handleCatalogVariantCreated(
    @Payload() payload: CatalogVariantCreatedEvent,
  ): Promise<void> {
    await this.ensureStockItemUseCase.execute({
      productId: payload.productId,
      variantId: payload.variantId,
      status: payload.status,
    });
  }

  @EventPattern('payment.approved')
  async handlePaymentApproved(
    @Payload() payload: { orderId: string },
  ): Promise<void> {
    await this.confirmReservationUseCase.execute(payload.orderId);
  }

  @EventPattern('payment.failed')
  async handlePaymentFailed(
    @Payload() payload: { orderId: string },
  ): Promise<void> {
    await this.releaseReservationUseCase.execute(payload.orderId);
  }

  @EventPattern('payment.expired')
  async handlePaymentExpired(
    @Payload() payload: { orderId: string },
  ): Promise<void> {
    await this.releaseReservationUseCase.execute(payload.orderId);
  }
}
