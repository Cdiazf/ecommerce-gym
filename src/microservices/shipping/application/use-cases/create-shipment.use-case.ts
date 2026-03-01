import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Shipment } from '../../domain/shipment';
import {
  SHIPMENT_REPOSITORY_PORT,
  type ShipmentRepositoryPort,
} from '../ports/shipment-repository.port';
import {
  SHIPPING_EVENT_PUBLISHER_PORT,
  type ShippingEventPublisherPort,
} from '../ports/shipping-event-publisher.port';

interface PaymentApprovedEvent {
  paymentId: string;
  orderId: string;
  customerId: string;
}

@Injectable()
export class CreateShipmentUseCase {
  private readonly logger = new Logger(CreateShipmentUseCase.name);

  constructor(
    @Inject(SHIPMENT_REPOSITORY_PORT)
    private readonly shipmentRepository: ShipmentRepositoryPort,
    @Inject(SHIPPING_EVENT_PUBLISHER_PORT)
    private readonly shippingEventPublisher: ShippingEventPublisherPort,
  ) {}

  async execute(event: PaymentApprovedEvent): Promise<Shipment> {
    const existing = await this.shipmentRepository.findByPaymentId(
      event.paymentId,
    );

    if (existing) {
      this.logger.log(
        `Shipment already exists for paymentId=${event.paymentId}. Skipping duplicate event.`,
      );
      return existing;
    }

    const shipment: Shipment = {
      id: randomUUID(),
      orderId: event.orderId,
      paymentId: event.paymentId,
      customerId: event.customerId,
      trackingCode: `TRK-${event.orderId.slice(0, 8).toUpperCase()}`,
      status: 'CREATED',
      events: [
        {
          status: 'CREATED',
          note: 'Shipment was created.',
          happenedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
    };

    const savedShipment = await this.shipmentRepository.save(shipment);
    await this.shippingEventPublisher.publishShippingCreated(savedShipment);

    this.logger.log(
      `Shipment created for orderId=${event.orderId}, shipmentId=${savedShipment.id}`,
    );

    return savedShipment;
  }
}
