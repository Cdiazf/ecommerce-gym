import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ExpirePendingPaymentsUseCase } from './expire-pending-payments.use-case';

@Injectable()
export class PaymentsExpirationWorker implements OnModuleInit, OnModuleDestroy {
  private intervalHandle: NodeJS.Timeout | null = null;

  constructor(
    private readonly expirePendingPaymentsUseCase: ExpirePendingPaymentsUseCase,
  ) {}

  onModuleInit(): void {
    const intervalMs = Number(process.env.YAPE_PENDING_SWEEP_MS ?? 30_000);

    void this.expirePendingPaymentsUseCase.execute().catch(() => undefined);
    this.intervalHandle = setInterval(() => {
      void this.expirePendingPaymentsUseCase.execute().catch(() => undefined);
    }, intervalMs);
  }

  onModuleDestroy(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }
}
