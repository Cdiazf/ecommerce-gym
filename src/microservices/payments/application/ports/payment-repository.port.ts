import { Payment } from '../../domain/payment';

export const PAYMENT_REPOSITORY_PORT = Symbol('PAYMENT_REPOSITORY_PORT');

export interface PaymentRepositoryPort {
  save(payment: Payment): Promise<Payment>;
  findAll(): Promise<Payment[]>;
  findByOrderId(orderId: string): Promise<Payment | null>;
  findPendingYapeBefore(cutoffIso: string): Promise<Payment[]>;
  update(payment: Payment): Promise<Payment>;
}
