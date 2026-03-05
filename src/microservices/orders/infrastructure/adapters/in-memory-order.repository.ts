import { Injectable } from '@nestjs/common';
import {
  BestSellerProductStat,
  OrderRepositoryPort,
} from '../../application/ports/order-repository.port';
import { Order } from '../../domain/order';

@Injectable()
export class InMemoryOrderRepository implements OrderRepositoryPort {
  private readonly orders: Order[] = [];

  save(order: Order): Promise<Order> {
    this.orders.push(order);
    return Promise.resolve(order);
  }

  findById(orderId: string): Promise<Order | null> {
    const order = this.orders.find((current) => current.id === orderId) ?? null;
    return Promise.resolve(order);
  }

  updateStatus(orderId: string, status: Order['status']): Promise<Order> {
    const index = this.orders.findIndex((order) => order.id === orderId);

    if (index === -1) {
      throw new Error(`Order not found for id ${orderId}`);
    }

    this.orders[index] = {
      ...this.orders[index],
      status,
    };

    return Promise.resolve(this.orders[index]);
  }

  findAll(): Promise<Order[]> {
    return Promise.resolve([...this.orders]);
  }

  findByCustomerId(customerId: string): Promise<Order[]> {
    return Promise.resolve(
      this.orders.filter((order) => order.customerId === customerId),
    );
  }

  findBestSellerProducts(limit: number): Promise<BestSellerProductStat[]> {
    const sales = new Map<string, number>();
    for (const order of this.orders) {
      if (order.status !== 'PAID') {
        continue;
      }

      for (const item of order.items) {
        sales.set(item.productId, (sales.get(item.productId) ?? 0) + item.quantity);
      }
    }

    const cappedLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 8;
    const ranked = Array.from(sales.entries())
      .map(([productId, totalSold]) => ({ productId, totalSold }))
      .sort((left, right) => right.totalSold - left.totalSold)
      .slice(0, cappedLimit);

    return Promise.resolve(ranked);
  }
}
