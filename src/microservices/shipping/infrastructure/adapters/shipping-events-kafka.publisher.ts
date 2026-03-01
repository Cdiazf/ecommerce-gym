import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ShippingEventPublisherPort } from '../../application/ports/shipping-event-publisher.port';
import { Shipment } from '../../domain/shipment';

@Injectable()
export class ShippingEventsKafkaPublisher
  implements ShippingEventPublisherPort, OnModuleInit
{
  constructor(
    @Inject('SHIPPING_EVENTS_BROKER')
    private readonly eventsClient: ClientKafka,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.eventsClient.connect();
  }

  async publishShippingCreated(shipment: Shipment): Promise<void> {
    await firstValueFrom(
      this.eventsClient.emit('shipping.created', {
        shipmentId: shipment.id,
        orderId: shipment.orderId,
        paymentId: shipment.paymentId,
        customerId: shipment.customerId,
        status: shipment.status,
        createdAt: shipment.createdAt,
      }),
    );
  }
}
