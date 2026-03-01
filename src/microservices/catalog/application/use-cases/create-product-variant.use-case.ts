import { Inject, Injectable } from '@nestjs/common';
import {
  PRODUCT_COMMAND_PORT,
  type CreateProductVariantRequest,
  type ProductCommandPort,
} from '../ports/product-command.port';
import {
  CATALOG_EVENT_PUBLISHER_PORT,
  type CatalogEventPublisherPort,
} from '../ports/catalog-event-publisher.port';
import { ProductVariant } from '../../domain/product';

@Injectable()
export class CreateProductVariantUseCase {
  constructor(
    @Inject(PRODUCT_COMMAND_PORT)
    private readonly productCommand: ProductCommandPort,
    @Inject(CATALOG_EVENT_PUBLISHER_PORT)
    private readonly catalogEvents: CatalogEventPublisherPort,
  ) {}

  async execute(input: CreateProductVariantRequest): Promise<ProductVariant> {
    const variant = await this.productCommand.createVariant(input);
    await this.catalogEvents.publishVariantCreated(variant, input.productId);
    return variant;
  }
}
