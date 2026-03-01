import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  PAYMENT_EVENT_PUBLISHER_PORT,
  type PaymentEventPublisherPort,
} from '../ports/payment-event-publisher.port';
import {
  PAYMENT_REPOSITORY_PORT,
  type PaymentRepositoryPort,
} from '../ports/payment-repository.port';
import { Payment } from '../../domain/payment';

@Injectable()
export class ExpirePendingPaymentsUseCase {
  private readonly logger = new Logger(ExpirePendingPaymentsUseCase.name);

  constructor(
    @Inject(PAYMENT_REPOSITORY_PORT)
    private readonly paymentRepository: PaymentRepositoryPort,
    @Inject(PAYMENT_EVENT_PUBLISHER_PORT)
    private readonly paymentEventPublisher: PaymentEventPublisherPort,
  ) {}

  async execute(now = new Date()): Promise<number> {
    const ttlMinutes = Number(process.env.YAPE_PENDING_TTL_MINUTES ?? 10);
    const cutoff = new Date(now.getTime() - ttlMinutes * 60_000).toISOString();
    const expiredCandidates = await this.paymentRepository.findPendingYapeBefore(cutoff);

    for (const payment of expiredCandidates) {
      const expired: Payment = {
        ...payment,
        status: 'EXPIRED',
        processedAt: new Date().toISOString(),
      };

      const saved = await this.paymentRepository.update(expired);
      await this.paymentEventPublisher.publishPaymentExpired(saved);
      this.logger.log(`Expired pending YAPE payment for orderId=${payment.orderId}`);
    }

    return expiredCandidates.length;
  }
}
