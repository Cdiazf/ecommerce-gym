import {
  Product,
  ProductCategory,
  ProductImage,
  ProductPrice,
  ProductVariant,
} from '../../domain/product';

export const PRODUCT_COMMAND_PORT = Symbol('PRODUCT_COMMAND_PORT');

export interface CreateProductRequest {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description?: string | null;
  brand: string;
  status?: string;
}

export interface CreateProductVariantRequest {
  id: string;
  productId: string;
  sku: string;
  color?: string | null;
  size?: string | null;
  material?: string | null;
  barcode?: string | null;
  weightGrams?: number | null;
  status?: string;
}

export interface UpdateProductRequest {
  id: string;
  sku?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  brand?: string;
  status?: string;
}

export interface UpdateProductVariantRequest {
  id: string;
  sku?: string;
  color?: string | null;
  size?: string | null;
  material?: string | null;
  barcode?: string | null;
  weightGrams?: number | null;
  status?: string;
}

export interface CreateProductPriceRequest {
  id: string;
  variantId: string;
  currency: string;
  listPrice: number;
  salePrice?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface UpdateProductPriceRequest {
  id: string;
  currency?: string;
  listPrice?: number;
  salePrice?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface CreateProductImageRequest {
  id: string;
  productId: string;
  variantId?: string | null;
  url: string;
  altText?: string | null;
  sortOrder?: number;
  isPrimary?: boolean;
}

export interface UpdateProductImageRequest {
  id: string;
  url?: string;
  altText?: string | null;
  sortOrder?: number;
  isPrimary?: boolean;
  variantId?: string | null;
}

export interface CreateProductCategoryRequest {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
}

export interface UpdateProductCategoryRequest {
  id: string;
  name?: string;
  slug?: string;
  parentId?: string | null;
}

export interface ProductCommandPort {
  createProduct(input: CreateProductRequest): Promise<Product>;
  createVariant(input: CreateProductVariantRequest): Promise<ProductVariant>;
  updateProduct(input: UpdateProductRequest): Promise<Product>;
  deleteProduct(productId: string): Promise<void>;
  updateVariant(input: UpdateProductVariantRequest): Promise<ProductVariant>;
  deleteVariant(variantId: string): Promise<void>;
  createPrice(input: CreateProductPriceRequest): Promise<ProductPrice>;
  updatePrice(input: UpdateProductPriceRequest): Promise<ProductPrice>;
  deletePrice(priceId: string): Promise<void>;
  createImage(input: CreateProductImageRequest): Promise<ProductImage>;
  updateImage(input: UpdateProductImageRequest): Promise<ProductImage>;
  deleteImage(imageId: string): Promise<void>;
  createCategory(input: CreateProductCategoryRequest): Promise<ProductCategory>;
  updateCategory(input: UpdateProductCategoryRequest): Promise<ProductCategory>;
  deleteCategory(categoryId: string): Promise<void>;
  assignCategoryToProduct(productId: string, categoryId: string): Promise<void>;
  unassignCategoryFromProduct(productId: string, categoryId: string): Promise<void>;
}
