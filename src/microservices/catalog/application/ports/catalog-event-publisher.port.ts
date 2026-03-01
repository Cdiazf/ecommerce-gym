import { Product, ProductVariant } from '../../domain/product';

export const CATALOG_EVENT_PUBLISHER_PORT = Symbol(
  'CATALOG_EVENT_PUBLISHER_PORT',
);

export interface CatalogEventPublisherPort {
  publishProductCreated(product: Product): Promise<void>;
  publishVariantCreated(
    variant: ProductVariant,
    productId: string,
  ): Promise<void>;
}
