import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Payment } from '../../domain/payment';
import {
  PAYMENT_EVENT_PUBLISHER_PORT,
  type PaymentEventPublisherPort,
} from '../ports/payment-event-publisher.port';
import {
  PAYMENT_REPOSITORY_PORT,
  type PaymentRepositoryPort,
} from '../ports/payment-repository.port';

interface OrderCreatedEvent {
  orderId: string;
  customerId: string;
  items: Array<{ productId: string; quantity: number }>;
  paymentMethod?: 'AUTO' | 'YAPE';
  subtotalAmount?: number;
  totalAmount?: number;
}

@Injectable()
export class ProcessPaymentUseCase {
  private readonly logger = new Logger(ProcessPaymentUseCase.name);

  constructor(
    @Inject(PAYMENT_REPOSITORY_PORT)
    private readonly paymentRepository: PaymentRepositoryPort,
    @Inject(PAYMENT_EVENT_PUBLISHER_PORT)
    private readonly paymentEventPublisher: PaymentEventPublisherPort,
  ) {}

  async execute(event: OrderCreatedEvent): Promise<Payment> {
    const existing = await this.paymentRepository.findByOrderId(event.orderId);

    if (existing) {
      this.logger.log(
        `Payment already exists for orderId=${event.orderId}. Skipping new charge.`,
      );
      return existing;
    }

    const amount = event.totalAmount ?? event.subtotalAmount ?? event.items.reduce(
      (acc, item) => acc + item.quantity * 10,
      0,
    );

    const method = event.paymentMethod ?? 'AUTO';

    const payment: Payment = {
      id: randomUUID(),
      orderId: event.orderId,
      customerId: event.customerId,
      amount,
      method,
      status: method === 'YAPE' ? 'PENDING' : 'APPROVED',
      externalReference:
        method === 'YAPE' ? `yape-intent-${event.orderId}` : null,
      operationCode: null,
      processedAt: new Date().toISOString(),
    };

    const savedPayment = await this.paymentRepository.save(payment);

    if (savedPayment.status === 'APPROVED') {
      await this.paymentEventPublisher.publishPaymentApproved(savedPayment);
      this.logger.log(
        `Payment approved for orderId=${event.orderId}, paymentId=${savedPayment.id}`,
      );
    } else {
      this.logger.log(
        `Payment pending with method=${savedPayment.method} for orderId=${event.orderId}`,
      );
    }

    return savedPayment;
  }
}
