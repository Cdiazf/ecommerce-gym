import { Product } from './types';

export const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800';
export const FALLBACK_PRODUCT_IMAGE_LARGE =
  'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=1200';

export function getProductPrice(product: Product): number {
  const firstVariant = product.variants[0];
  const firstPrice = firstVariant?.prices[0];

  if (!firstPrice) {
    return 0;
  }

  return firstPrice.salePrice ?? firstPrice.listPrice;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

export function resolveImageUrl(url: string | undefined, fallback: string): string {
  if (!url) {
    return fallback;
  }

  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'cdn.example.com') {
      return fallback;
    }
  } catch {
    return fallback;
  }

  return url;
}
