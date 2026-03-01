import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PAYMENT_EVENT_PUBLISHER_PORT,
  type PaymentEventPublisherPort,
} from '../ports/payment-event-publisher.port';
import { PAYMENT_REPOSITORY_PORT } from '../ports/payment-repository.port';
import type { PaymentRepositoryPort } from '../ports/payment-repository.port';
import { Payment } from '../../domain/payment';

@Injectable()
export class ConfirmYapePaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY_PORT)
    private readonly paymentRepository: PaymentRepositoryPort,
    @Inject(PAYMENT_EVENT_PUBLISHER_PORT)
    private readonly paymentEventPublisher: PaymentEventPublisherPort,
  ) {}

  async execute(payload: {
    orderId: string;
    operationCode: string;
  }): Promise<Payment> {
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

    if (existing.status === 'APPROVED') {
      return existing;
    }

    if (existing.status === 'FAILED' || existing.status === 'EXPIRED') {
      throw new ConflictException(
        `Payment for order ${payload.orderId} is already ${existing.status.toLowerCase()}`,
      );
    }

    const approved: Payment = {
      ...existing,
      status: 'APPROVED',
      operationCode: payload.operationCode,
      processedAt: new Date().toISOString(),
    };

    const saved = await this.paymentRepository.update(approved);
    await this.paymentEventPublisher.publishPaymentApproved(saved);
    return saved;
  }
}
