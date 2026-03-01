import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Order } from '../../domain/order';
import { INVENTORY_PORT } from '../ports/inventory.port';
import { ORDER_EVENT_PUBLISHER_PORT } from '../ports/order-event-publisher.port';
import { ORDER_REPOSITORY_PORT } from '../ports/order-repository.port';
import type { InventoryPort } from '../ports/inventory.port';
import type { OrderEventPublisherPort } from '../ports/order-event-publisher.port';
import type { OrderRepositoryPort } from '../ports/order-repository.port';

interface CreateOrderItem {
  productId: string;
  quantity: number;
}

interface CreateOrderInput {
  customerId: string;
  items: CreateOrderItem[];
  paymentMethod?: 'AUTO' | 'YAPE';
  subtotalAmount: number;
  totalAmount: number;
  shippingAddress: Order['shippingAddress'];
  shippingCost: number;
  shippingCurrency: string;
  shippingServiceLevel: Order['shippingServiceLevel'];
  estimatedDeliveryDays: string;
}

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(INVENTORY_PORT) private readonly inventory: InventoryPort,
    @Inject(ORDER_REPOSITORY_PORT)
    private readonly orderRepository: OrderRepositoryPort,
    @Inject(ORDER_EVENT_PUBLISHER_PORT)
    private readonly orderEventPublisher: OrderEventPublisherPort,
  ) {}

  async execute(input: CreateOrderInput): Promise<Order> {
    const orderId = randomUUID();
    const stock = await this.inventory.reserveItems(orderId, input.items);
    const rejected = stock.some((item) => !item.reserved);

    if (rejected) {
      throw new Error('Some items are out of stock');
    }

    const order: Order = {
      id: orderId,
      customerId: input.customerId,
      items: input.items,
      paymentMethod: input.paymentMethod ?? 'AUTO',
      subtotalAmount: input.subtotalAmount,
      totalAmount: input.totalAmount,
      shippingAddress: input.shippingAddress,
      shippingCost: input.shippingCost,
      shippingCurrency: input.shippingCurrency,
      shippingServiceLevel: input.shippingServiceLevel,
      estimatedDeliveryDays: input.estimatedDeliveryDays,
      status: 'PENDING_PAYMENT',
      createdAt: new Date().toISOString(),
    };

    try {
      const savedOrder = await this.orderRepository.save(order);
      await this.orderEventPublisher.publishOrderCreated(savedOrder, order.paymentMethod);
      return savedOrder;
    } catch (error) {
      await this.inventory.releaseReservation(orderId);
      throw error;
    }
  }
}
