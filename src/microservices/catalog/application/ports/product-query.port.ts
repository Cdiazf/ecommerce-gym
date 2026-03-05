import { Product, ProductCategory } from '../../domain/product';

export const PRODUCT_QUERY_PORT = Symbol('PRODUCT_QUERY_PORT');

export interface ProductQueryPort {
  findAll(): Promise<Product[]>;
  findById(productId: string): Promise<Product | null>;
  listCategories(): Promise<ProductCategory[]>;
  findNewArrivals(limit: number): Promise<Product[]>;
}
