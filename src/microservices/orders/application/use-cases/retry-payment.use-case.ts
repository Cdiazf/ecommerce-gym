import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { INVENTORY_PORT } from '../ports/inventory.port';
import { ORDER_REPOSITORY_PORT } from '../ports/order-repository.port';
import type { InventoryPort } from '../ports/inventory.port';
import type { OrderRepositoryPort } from '../ports/order-repository.port';
import { Order } from '../../domain/order';

@Injectable()
export class RetryPaymentUseCase {
  constructor(
    @Inject(INVENTORY_PORT) private readonly inventory: InventoryPort,
    @Inject(ORDER_REPOSITORY_PORT)
    private readonly orderRepository: OrderRepositoryPort,
  ) {}

  async execute(payload: {
    orderId: string;
    customerId: string;
  }): Promise<Order> {
    const order = await this.orderRepository.findById(payload.orderId);

    if (!order) {
      throw new NotFoundException(`Order not found: ${payload.orderId}`);
    }

    if (order.customerId !== payload.customerId) {
      throw new NotFoundException(`Order not found: ${payload.orderId}`);
    }

    if (order.paymentMethod !== 'YAPE') {
      throw new ConflictException('Only YAPE orders can be retried');
    }

    if (order.status !== 'CANCELLED') {
      throw new ConflictException('Only cancelled orders can retry payment');
    }

    const stock = await this.inventory.reserveItems(order.id, order.items);
    const rejected = stock.some((item) => !item.reserved);

    if (rejected) {
      throw new ConflictException('Some items are out of stock');
    }

    return this.orderRepository.updateStatus(order.id, 'PENDING_PAYMENT');
  }
}
