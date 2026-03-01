import { Inject, Injectable } from '@nestjs/common';
import { StockItem } from '../../domain/stock-item';
import { STOCK_REPOSITORY_PORT } from '../ports/stock-repository.port';
import type {
  EnsureStockItemRequest,
  StockRepositoryPort,
} from '../ports/stock-repository.port';

@Injectable()
export class EnsureStockItemUseCase {
  constructor(
    @Inject(STOCK_REPOSITORY_PORT)
    private readonly stockRepository: StockRepositoryPort,
  ) {}

  async execute(item: EnsureStockItemRequest): Promise<StockItem> {
    return this.stockRepository.ensureItem(item);
  }
}
