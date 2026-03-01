export const INVENTORY_PORT = Symbol('INVENTORY_PORT');

export interface ReserveItemCommand {
  productId: string;
  quantity: number;
}

export interface ReserveItemResult {
  productId: string;
  reserved: boolean;
  remaining: number;
}

export interface InventoryPort {
  reserveItems(
    orderId: string,
    items: ReserveItemCommand[],
  ): Promise<ReserveItemResult[]>;
  releaseReservation(orderId: string): Promise<void>;
}
