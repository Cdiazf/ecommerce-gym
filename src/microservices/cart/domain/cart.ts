export interface CartItem {
  productId: string;
  quantity: number;
  updatedAt: string;
}

export interface Cart {
  customerId: string;
  items: CartItem[];
}
