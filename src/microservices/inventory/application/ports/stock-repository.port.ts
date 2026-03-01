import { StockItem } from '../../domain/stock-item';

export const STOCK_REPOSITORY_PORT = Symbol('STOCK_REPOSITORY_PORT');

export interface ReserveStockRequest {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface ReserveStockResult {
  productId: string;
  variantId: string | null;
  reserved: boolean;
  remaining: number;
  isAvailable: boolean;
}

export interface UpsertStockItemRequest {
  productId: string;
  variantId?: string | null;
  quantityOnHand: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface EnsureStockItemRequest {
  productId: string;
  variantId?: string | null;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface StockRepositoryPort {
  reserve(
    orderId: string,
    items: ReserveStockRequest[],
  ): Promise<ReserveStockResult[]>;
  confirmReservation(orderId: string): Promise<void>;
  releaseReservation(orderId: string): Promise<void>;
  listAll(): Promise<StockItem[]>;
  upsertItem(item: UpsertStockItemRequest): Promise<StockItem>;
  ensureItem(item: EnsureStockItemRequest): Promise<StockItem>;
  deleteItem(productId: string, variantId?: string | null): Promise<StockItem>;
}
