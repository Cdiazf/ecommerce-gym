import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Order } from '../../domain/order';
import { OrderEventPublisherPort } from '../../application/ports/order-event-publisher.port';

@Injectable()
export class OrderEventsKafkaPublisher
  implements OrderEventPublisherPort, OnModuleInit
{
  constructor(
    @Inject('ORDER_EVENTS_BROKER') private readonly eventsClient: ClientKafka,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.eventsClient.connect();
  }

  async publishOrderCreated(
    order: Order,
    paymentMethod: 'AUTO' | 'YAPE',
  ): Promise<void> {
    await firstValueFrom(
      this.eventsClient.emit('order.created', {
        orderId: order.id,
        customerId: order.customerId,
        items: order.items,
        paymentMethod,
        subtotalAmount: order.subtotalAmount,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
      }),
    );
  }
}
