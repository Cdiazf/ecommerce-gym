import { Inject, Injectable } from '@nestjs/common';
import { STOCK_REPOSITORY_PORT } from '../ports/stock-repository.port';
import { StockItem } from '../../domain/stock-item';
import type {
  StockRepositoryPort,
  UpsertStockItemRequest,
} from '../ports/stock-repository.port';

@Injectable()
export class UpsertStockItemUseCase {
  constructor(
    @Inject(STOCK_REPOSITORY_PORT)
    private readonly stockRepository: StockRepositoryPort,
  ) {}

  async execute(item: UpsertStockItemRequest): Promise<StockItem> {
    return this.stockRepository.upsertItem(item);
  }
}
