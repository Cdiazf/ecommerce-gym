import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { PaymentEventPublisherPort } from '../../application/ports/payment-event-publisher.port';
import { Payment } from '../../domain/payment';

@Injectable()
export class PaymentEventsKafkaPublisher
  implements PaymentEventPublisherPort, OnModuleInit
{
  constructor(
    @Inject('PAYMENT_EVENTS_BROKER') private readonly eventsClient: ClientKafka,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.eventsClient.connect();
  }

  async publishPaymentApproved(payment: Payment): Promise<void> {
    await this.emitPaymentEvent('payment.approved', payment);
  }

  async publishPaymentFailed(payment: Payment): Promise<void> {
    await this.emitPaymentEvent('payment.failed', payment);
  }

  async publishPaymentExpired(payment: Payment): Promise<void> {
    await this.emitPaymentEvent('payment.expired', payment);
  }

  private async emitPaymentEvent(topic: string, payment: Payment): Promise<void> {
    await firstValueFrom(
      this.eventsClient.emit(topic, {
        paymentId: payment.id,
        orderId: payment.orderId,
        customerId: payment.customerId,
        amount: payment.amount,
        status: payment.status,
        processedAt: payment.processedAt,
      }),
    );
  }
}
