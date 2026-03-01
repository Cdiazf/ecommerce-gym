import { Injectable } from '@nestjs/common';
import { OrderRepositoryPort } from '../../application/ports/order-repository.port';
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
}
