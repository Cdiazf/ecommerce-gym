export interface StockItem {
  productId: string;
  variantId: string | null;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  status: 'ACTIVE' | 'INACTIVE';
  isAvailable: boolean;
  updatedAt: string;
}
