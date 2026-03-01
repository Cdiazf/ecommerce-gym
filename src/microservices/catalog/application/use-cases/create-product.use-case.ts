import { Inject, Injectable } from '@nestjs/common';
import {
  PRODUCT_COMMAND_PORT,
  type CreateProductRequest,
  type ProductCommandPort,
} from '../ports/product-command.port';
import {
  CATALOG_EVENT_PUBLISHER_PORT,
  type CatalogEventPublisherPort,
} from '../ports/catalog-event-publisher.port';
import { Product } from '../../domain/product';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_COMMAND_PORT)
    private readonly productCommand: ProductCommandPort,
    @Inject(CATALOG_EVENT_PUBLISHER_PORT)
    private readonly catalogEvents: CatalogEventPublisherPort,
  ) {}

  async execute(input: CreateProductRequest): Promise<Product> {
    const product = await this.productCommand.createProduct(input);
    await this.catalogEvents.publishProductCreated(product);
    return product;
  }
}
