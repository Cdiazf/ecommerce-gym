import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Payment } from '../../domain/payment';
import {
  PAYMENT_REPOSITORY_PORT,
  type PaymentRepositoryPort,
} from '../ports/payment-repository.port';

@Injectable()
export class RetryYapePaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY_PORT)
    private readonly paymentRepository: PaymentRepositoryPort,
  ) {}

  async execute(payload: { orderId: string }): Promise<Payment> {
    const existing = await this.paymentRepository.findByOrderId(payload.orderId);

    if (!existing) {
      throw new NotFoundException(`Payment not found for orderId=${payload.orderId}`);
    }

    if (existing.method !== 'YAPE') {
      throw new ConflictException('Only YAPE payments can be retried');
    }

    if (existing.status === 'APPROVED') {
      throw new ConflictException('Approved payments cannot be retried');
    }

    const retried: Payment = {
      ...existing,
      status: 'PENDING',
      externalReference: `yape-retry-${existing.orderId}-${Date.now()}`,
      operationCode: null,
      processedAt: new Date().toISOString(),
    };

    return this.paymentRepository.update(retried);
  }
}
