import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../../domain/order';
import { ORDER_REPOSITORY_PORT } from '../ports/order-repository.port';
import type { OrderRepositoryPort } from '../ports/order-repository.port';

@Injectable()
export class GetOrdersByCustomerUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY_PORT)
    private readonly orderRepository: OrderRepositoryPort,
  ) {}

  async execute(customerId: string): Promise<Order[]> {
    return this.orderRepository.findByCustomerId(customerId);
  }
}
