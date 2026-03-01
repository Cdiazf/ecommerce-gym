import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PAYMENT_REPOSITORY_PORT } from '../ports/payment-repository.port';
import type { PaymentRepositoryPort } from '../ports/payment-repository.port';

@Injectable()
export class StartYapePaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY_PORT)
    private readonly paymentRepository: PaymentRepositoryPort,
  ) {}

  async execute(payload: { orderId: string; phone?: string }): Promise<{
    orderId: string;
    paymentId: string;
    method: 'YAPE';
    status: 'PENDING' | 'APPROVED' | 'FAILED' | 'EXPIRED';
    amount: number;
    yape: {
      qrData: string;
      operationHint: string;
      phone: string | null;
    };
  }> {
    const payment = await this.paymentRepository.findByOrderId(payload.orderId);

    if (!payment) {
      throw new NotFoundException(
        `Payment not found for orderId=${payload.orderId}. Create the order first.`,
      );
    }

    if (payment.method !== 'YAPE') {
      throw new NotFoundException(
        `Order ${payload.orderId} is not configured for YAPE. Create order with paymentMethod=YAPE.`,
      );
    }

    const operationHint = `YAPE-${payment.orderId.slice(0, 8).toUpperCase()}`;
    const qrData = `yape://pay?orderId=${payment.orderId}&amount=${payment.amount}&operationHint=${operationHint}`;

    return {
      orderId: payment.orderId,
      paymentId: payment.id,
      method: 'YAPE',
      status: payment.status,
      amount: payment.amount,
      yape: {
        qrData,
        operationHint,
        phone: payload.phone ?? null,
      },
    };
  }
}
