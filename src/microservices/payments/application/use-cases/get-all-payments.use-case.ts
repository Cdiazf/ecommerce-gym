import { Inject, Injectable } from '@nestjs/common';
import { Payment } from '../../domain/payment';
import {
  PAYMENT_REPOSITORY_PORT,
  type PaymentRepositoryPort,
} from '../ports/payment-repository.port';

@Injectable()
export class GetAllPaymentsUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY_PORT)
    private readonly paymentRepository: PaymentRepositoryPort,
  ) {}

  async execute(): Promise<Payment[]> {
    return this.paymentRepository.findAll();
  }
}
