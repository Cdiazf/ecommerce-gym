import { getProductPrice } from './product-utils';
import type { CartItem, Product, StoredCartItem } from './types';

export function getCartStorageKey(username: string): string {
  return `fitstore-cart:${username || 'guest'}`;
}

export function hydrateCartItems(
  items: StoredCartItem[],
  products: Product[],
): CartItem[] {
  const productsById = new Map(products.map((product) => [product.id, product]));

  return items.map((item) => {
    const product = productsById.get(item.productId);

    return {
      productId: item.productId,
      name: product?.name ?? item.productId,
      price: product ? getProductPrice(product) : 0,
      quantity: item.quantity,
    };
  });
}
