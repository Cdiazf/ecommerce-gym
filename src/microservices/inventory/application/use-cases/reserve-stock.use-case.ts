import { Inject, Injectable } from '@nestjs/common';
import {
  ReserveStockRequest,
  ReserveStockResult,
  STOCK_REPOSITORY_PORT,
} from '../ports/stock-repository.port';
import type { StockRepositoryPort } from '../ports/stock-repository.port';

@Injectable()
export class ReserveStockUseCase {
  constructor(
    @Inject(STOCK_REPOSITORY_PORT)
    private readonly stockRepository: StockRepositoryPort,
  ) {}

  async execute(
    orderId: string,
    items: ReserveStockRequest[],
  ): Promise<ReserveStockResult[]> {
    return this.stockRepository.reserve(orderId, items);
  }
}
