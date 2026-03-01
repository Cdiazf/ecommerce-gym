import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../../domain/order';
import { ORDER_REPOSITORY_PORT } from '../ports/order-repository.port';
import type { OrderRepositoryPort } from '../ports/order-repository.port';

@Injectable()
export class GetAllOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY_PORT)
    private readonly orderRepository: OrderRepositoryPort,
  ) {}

  async execute(): Promise<Order[]> {
    return this.orderRepository.findAll();
  }
}
