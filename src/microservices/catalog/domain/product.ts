export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ProductPrice {
  id: string;
  currency: string;
  listPrice: number;
  salePrice: number | null;
  startsAt: string | null;
  endsAt: string | null;
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
  variantId: string | null;
}

export interface ProductVariant {
  id: string;
  sku: string;
  color: string | null;
  size: string | null;
  material: string | null;
  barcode: string | null;
  weightGrams: number | null;
  status: string;
  prices: ProductPrice[];
  images: ProductImage[];
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  brand: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  categories: ProductCategory[];
  images: ProductImage[];
  variants: ProductVariant[];
}
