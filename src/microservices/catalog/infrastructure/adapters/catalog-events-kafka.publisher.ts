import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CatalogEventPublisherPort } from '../../application/ports/catalog-event-publisher.port';
import { Product, ProductVariant } from '../../domain/product';

@Injectable()
export class CatalogEventsKafkaPublisher
  implements CatalogEventPublisherPort, OnModuleInit
{
  constructor(
    @Inject('CATALOG_EVENTS_BROKER') private readonly eventsClient: ClientKafka,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.eventsClient.connect();
  }

  async publishProductCreated(product: Product): Promise<void> {
    await firstValueFrom(
      this.eventsClient.emit('catalog.product.created', {
        productId: product.id,
        sku: product.sku,
        status: product.status,
      }),
    );
  }

  async publishVariantCreated(
    variant: ProductVariant,
    productId: string,
  ): Promise<void> {
    await firstValueFrom(
      this.eventsClient.emit('catalog.variant.created', {
        productId,
        variantId: variant.id,
        sku: variant.sku,
        status: variant.status,
      }),
    );
  }
}
