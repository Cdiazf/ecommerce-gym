import { Inject, Injectable } from '@nestjs/common';
import { STOCK_REPOSITORY_PORT } from '../ports/stock-repository.port';
import type { StockRepositoryPort } from '../ports/stock-repository.port';

@Injectable()
export class ReleaseReservationUseCase {
  constructor(
    @Inject(STOCK_REPOSITORY_PORT)
    private readonly stockRepository: StockRepositoryPort,
  ) {}

  async execute(orderId: string): Promise<void> {
    await this.stockRepository.releaseReservation(orderId);
  }
}
