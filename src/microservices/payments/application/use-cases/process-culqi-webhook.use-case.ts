import {
  Inject,
  Injectable,
  UnauthorizedException,
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
export class ProcessCulqiWebhookUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY_PORT)
    private readonly paymentRepository: PaymentRepositoryPort,
    @Inject(PAYMENT_EVENT_PUBLISHER_PORT)
    private readonly paymentEventPublisher: PaymentEventPublisherPort,
    @Inject(CULQI_GATEWAY_PORT)
    private readonly culqiGateway: CulqiGatewayPort,
  ) {}

  async execute(payload: {
    signature?: string;
    body: unknown;
  }): Promise<{ received: true; status: Payment['status'] | 'IGNORED'; orderId: string | null }> {
    if (!this.culqiGateway.verifyWebhookSignature(payload.signature, payload.body)) {
      throw new UnauthorizedException('Invalid Culqi webhook signature');
    }

    const event = this.culqiGateway.parseWebhook(payload.body);
    if (!event.orderId || event.status === 'IGNORED') {
      return { received: true, status: 'IGNORED', orderId: event.orderId };
    }

    const existing = await this.paymentRepository.findByOrderId(event.orderId);
    if (!existing) {
      return { received: true, status: 'IGNORED', orderId: event.orderId };
    }

    const updated: Payment = {
      ...existing,
      status: event.status,
      externalReference: event.externalReference ?? existing.externalReference,
      operationCode: event.paymentCode ?? existing.operationCode,
      processedAt: new Date().toISOString(),
    };

    const saved = await this.paymentRepository.update(updated);

    if (saved.status === 'APPROVED') {
      await this.paymentEventPublisher.publishPaymentApproved(saved);
    } else if (saved.status === 'FAILED') {
      await this.paymentEventPublisher.publishPaymentFailed(saved);
    } else if (saved.status === 'EXPIRED') {
      await this.paymentEventPublisher.publishPaymentExpired(saved);
    }

    return { received: true, status: saved.status, orderId: saved.orderId };
  }
}
