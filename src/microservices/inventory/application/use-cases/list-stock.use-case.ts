import { Inject, Injectable } from '@nestjs/common';
import { STOCK_REPOSITORY_PORT } from '../ports/stock-repository.port';
import { StockItem } from '../../domain/stock-item';
import type { StockRepositoryPort } from '../ports/stock-repository.port';

@Injectable()
export class ListStockUseCase {
  constructor(
    @Inject(STOCK_REPOSITORY_PORT)
    private readonly stockRepository: StockRepositoryPort,
  ) {}

  async execute(): Promise<StockItem[]> {
    return this.stockRepository.listAll();
  }
}
