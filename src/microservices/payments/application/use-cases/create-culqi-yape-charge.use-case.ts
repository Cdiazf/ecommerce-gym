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
    firstName?: string;
    lastName?: string;
  }): Promise<{
    orderId: string;
    paymentId: string;
    status: Payment['status'];
    culqi: {
      paymentOrderId: string;
      paymentCode: string | null;
      paymentUrl: string | null;
      paymentStatus: string;
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
    const paymentOrder = await this.culqiGateway.createPaymentOrder({
      amountInCents,
      currencyCode: 'PEN',
      internalOrderId: payment.orderId,
      customerId: payment.customerId,
      email: payload.email,
      phoneNumber: payload.phoneNumber,
      firstName: payload.firstName?.trim() || 'Ecommerce',
      lastName: payload.lastName?.trim() || 'Gym',
    });

    const nextStatus =
      paymentOrder.status.toLowerCase().includes('paid') ||
      paymentOrder.status.toLowerCase().includes('capture') ||
      paymentOrder.status.toLowerCase().includes('success')
        ? 'APPROVED'
        : 'PENDING';

    const updated: Payment = {
      ...payment,
      status: nextStatus,
      externalReference: paymentOrder.id,
      operationCode: paymentOrder.paymentCode,
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
        paymentOrderId: paymentOrder.id,
        paymentCode: paymentOrder.paymentCode,
        paymentUrl: paymentOrder.paymentUrl,
        paymentStatus: paymentOrder.status,
      },
    };
  }
}
