import { Inject, Injectable } from '@nestjs/common';
import { ORDER_REPOSITORY_PORT } from '../ports/order-repository.port';
import type { OrderRepositoryPort } from '../ports/order-repository.port';

@Injectable()
export class MarkOrderPaidUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY_PORT)
    private readonly orderRepository: OrderRepositoryPort,
  ) {}

  async execute(orderId: string) {
    return this.orderRepository.updateStatus(orderId, 'PAID');
  }
}
