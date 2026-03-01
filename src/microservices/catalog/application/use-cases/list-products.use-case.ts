import { Inject, Injectable } from '@nestjs/common';
import { PRODUCT_QUERY_PORT } from '../ports/product-query.port';
import { Product } from '../../domain/product';
import type { ProductQueryPort } from '../ports/product-query.port';

@Injectable()
export class ListProductsUseCase {
  constructor(
    @Inject(PRODUCT_QUERY_PORT) private readonly productQuery: ProductQueryPort,
  ) {}

  async execute(): Promise<Product[]> {
    return this.productQuery.findAll();
  }
}
