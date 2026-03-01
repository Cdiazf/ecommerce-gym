import { Injectable } from '@nestjs/common';
import { PaymentRepositoryPort } from '../../application/ports/payment-repository.port';
import { Payment } from '../../domain/payment';

@Injectable()
export class InMemoryPaymentRepository implements PaymentRepositoryPort {
  private readonly payments: Payment[] = [];

  save(payment: Payment): Promise<Payment> {
    const existing = this.payments.find(
      (candidate) => candidate.orderId === payment.orderId,
    );

    if (existing) {
      return Promise.resolve(existing);
    }

    this.payments.push(payment);
    return Promise.resolve(payment);
  }

  findByOrderId(orderId: string): Promise<Payment | null> {
    const payment =
      this.payments.find((candidate) => candidate.orderId === orderId) ?? null;
    return Promise.resolve(payment);
  }

  findAll(): Promise<Payment[]> {
    return Promise.resolve([...this.payments]);
  }

  findPendingYapeBefore(cutoffIso: string): Promise<Payment[]> {
    const cutoff = new Date(cutoffIso).getTime();

    return Promise.resolve(
      this.payments.filter(
        (payment) =>
          payment.method === 'YAPE' &&
          payment.status === 'PENDING' &&
          new Date(payment.processedAt).getTime() <= cutoff,
      ),
    );
  }

  update(payment: Payment): Promise<Payment> {
    const index = this.payments.findIndex(
      (candidate) => candidate.orderId === payment.orderId,
    );

    if (index === -1) {
      throw new Error(`Payment not found for order ${payment.orderId}`);
    }

    this.payments[index] = payment;
    return Promise.resolve(payment);
  }
}
