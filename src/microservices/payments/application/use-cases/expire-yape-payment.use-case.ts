import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  PAYMENT_EVENT_PUBLISHER_PORT,
  type PaymentEventPublisherPort,
} from '../ports/payment-event-publisher.port';
import { PAYMENT_REPOSITORY_PORT } from '../ports/payment-repository.port';
import type { PaymentRepositoryPort } from '../ports/payment-repository.port';
import { Payment } from '../../domain/payment';

@Injectable()
export class ExpireYapePaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY_PORT)
    private readonly paymentRepository: PaymentRepositoryPort,
    @Inject(PAYMENT_EVENT_PUBLISHER_PORT)
    private readonly paymentEventPublisher: PaymentEventPublisherPort,
  ) {}

  async execute(payload: { orderId: string }): Promise<Payment> {
    const existing = await this.paymentRepository.findByOrderId(payload.orderId);

    if (!existing) {
      throw new NotFoundException(
        `Payment not found for orderId=${payload.orderId}`,
      );
    }

    if (existing.method !== 'YAPE') {
      throw new NotFoundException(
        `Order ${payload.orderId} does not use YAPE payment method`,
      );
    }

    if (existing.status === 'EXPIRED') {
      return existing;
    }

    if (existing.status === 'APPROVED') {
      throw new NotFoundException(
        `Payment for order ${payload.orderId} is already approved`,
      );
    }

    const expired: Payment = {
      ...existing,
      status: 'EXPIRED',
      processedAt: new Date().toISOString(),
    };

    const saved = await this.paymentRepository.update(expired);
    await this.paymentEventPublisher.publishPaymentExpired(saved);
    return saved;
  }
}
