import { Inject, Injectable } from '@nestjs/common';
import { Payment } from '../../domain/payment';
import { PAYMENT_REPOSITORY_PORT } from '../ports/payment-repository.port';
import type { PaymentRepositoryPort } from '../ports/payment-repository.port';

@Injectable()
export class GetPaymentByOrderUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY_PORT)
    private readonly paymentRepository: PaymentRepositoryPort,
  ) {}

  async execute(orderId: string): Promise<Payment | null> {
    return this.paymentRepository.findByOrderId(orderId);
  }
}
