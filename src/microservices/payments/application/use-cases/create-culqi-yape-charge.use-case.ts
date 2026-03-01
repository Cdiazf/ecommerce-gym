import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CULQI_GATEWAY_PORT,
  type CulqiGatewayPort,
} from '../ports/culqi-gateway.port';
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
export class CreateCulqiYapeChargeUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY_PORT)
    private readonly paymentRepository: PaymentRepositoryPort,
    @Inject(PAYMENT_EVENT_PUBLISHER_PORT)
    private readonly paymentEventPublisher: PaymentEventPublisherPort,
    @Inject(CULQI_GATEWAY_PORT)
    private readonly culqiGateway: CulqiGatewayPort,
  ) {}

  async execute(payload: {
    orderId: string;
    email: string;
    phoneNumber: string;
    otp: string;
  }): Promise<{
    orderId: string;
    paymentId: string;
    status: Payment['status'];
    culqi: {
      tokenId: string;
      chargeId: string;
      chargeStatus: string;
    };
  }> {
    const payment = await this.paymentRepository.findByOrderId(payload.orderId);

    if (!payment) {
      throw new NotFoundException(`Payment not found for orderId=${payload.orderId}`);
    }

    if (payment.method !== 'YAPE') {
      throw new ConflictException('Culqi Yape charge only applies to YAPE payments');
    }

    if (payment.status === 'APPROVED') {
      throw new ConflictException(`Payment for order ${payload.orderId} is already approved`);
    }

    const amountInCents = Math.round(payment.amount * 100);
    const token = await this.culqiGateway.createYapeToken({
      amountInCents,
      email: payload.email,
      phoneNumber: payload.phoneNumber,
      otp: payload.otp,
    });

    const charge = await this.culqiGateway.createCharge({
      amountInCents,
      email: payload.email,
      sourceId: token.id,
      orderId: payment.orderId,
      customerId: payment.customerId,
    });

    const nextStatus =
      charge.status.toLowerCase().includes('paid') ||
      charge.status.toLowerCase().includes('capture') ||
      charge.status.toLowerCase().includes('success')
        ? 'APPROVED'
        : 'PENDING';

    const updated: Payment = {
      ...payment,
      status: nextStatus,
      externalReference: charge.id,
      operationCode: token.id,
      processedAt: new Date().toISOString(),
    };

    const saved = await this.paymentRepository.update(updated);
    if (saved.status === 'APPROVED') {
      await this.paymentEventPublisher.publishPaymentApproved(saved);
    }

    return {
      orderId: saved.orderId,
      paymentId: saved.id,
      status: saved.status,
      culqi: {
        tokenId: token.id,
        chargeId: charge.id,
        chargeStatus: charge.status,
      },
    };
  }
}
