import { Inject, Injectable } from '@nestjs/common';
import { ORDER_REPOSITORY_PORT } from '../ports/order-repository.port';
import type {
  BestSellerProductStat,
  OrderRepositoryPort,
} from '../ports/order-repository.port';

@Injectable()
export class GetBestSellerProductsUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY_PORT)
    private readonly orderRepository: OrderRepositoryPort,
  ) {}

  async execute(limit = 8): Promise<BestSellerProductStat[]> {
    return this.orderRepository.findBestSellerProducts(limit);
  }
}
