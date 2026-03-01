import { Cart, CartItem } from '../../domain/cart';

export const CART_REPOSITORY_PORT = Symbol('CART_REPOSITORY_PORT');

export interface CartRepositoryPort {
  getByCustomerId(customerId: string): Promise<Cart>;
  upsertItem(input: {
    customerId: string;
    productId: string;
    quantity: number;
  }): Promise<CartItem>;
  removeItem(customerId: string, productId: string): Promise<void>;
  clearCart(customerId: string): Promise<void>;
}
