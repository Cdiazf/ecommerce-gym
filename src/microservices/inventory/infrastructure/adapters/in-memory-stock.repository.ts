import { Injectable } from '@nestjs/common';
import {
  EnsureStockItemRequest,
  ReserveStockRequest,
  ReserveStockResult,
  StockRepositoryPort,
  UpsertStockItemRequest,
} from '../../application/ports/stock-repository.port';
import { StockItem } from '../../domain/stock-item';

type ReservationStatus = 'RESERVED' | 'CONFIRMED' | 'RELEASED';

type Reservation = {
  orderId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  status: ReservationStatus;
};

@Injectable()
export class InMemoryStockRepository implements StockRepositoryPort {
  private readonly stock = new Map<string, StockItem>([
    [
      'shoe-01::',
      {
        productId: 'shoe-01',
        variantId: null,
        quantityOnHand: 25,
        quantityReserved: 0,
        quantityAvailable: 25,
        status: 'ACTIVE',
        isAvailable: true,
        updatedAt: new Date().toISOString(),
      },
    ],
    [
      'shirt-01::',
      {
        productId: 'shirt-01',
        variantId: null,
        quantityOnHand: 50,
        quantityReserved: 0,
        quantityAvailable: 50,
        status: 'ACTIVE',
        isAvailable: true,
        updatedAt: new Date().toISOString(),
      },
    ],
    [
      'short-01::',
      {
        productId: 'short-01',
        variantId: null,
        quantityOnHand: 40,
        quantityReserved: 0,
        quantityAvailable: 40,
        status: 'ACTIVE',
        isAvailable: true,
        updatedAt: new Date().toISOString(),
      },
    ],
  ]);

  private readonly reservations = new Map<string, Reservation[]>();

  reserve(
    orderId: string,
    items: ReserveStockRequest[],
  ): Promise<ReserveStockResult[]> {
    const results: ReserveStockResult[] = [];
    const createdReservations: Reservation[] = [];

    for (const item of items) {
      const key = this.key(item.productId, item.variantId ?? null);
      const current = this.stock.get(key);

      if (!current || current.status !== 'ACTIVE') {
        results.push({
          productId: item.productId,
          variantId: item.variantId ?? null,
          reserved: false,
          remaining: 0,
          isAvailable: false,
        });
        continue;
      }

      const available = current.quantityOnHand - current.quantityReserved;
      const canReserve = available >= item.quantity;
      const newReserved = canReserve
        ? current.quantityReserved + item.quantity
        : current.quantityReserved;
      const remaining = canReserve ? available - item.quantity : available;

      if (canReserve) {
        const updated: StockItem = {
          ...current,
          quantityReserved: newReserved,
          quantityAvailable: remaining,
          isAvailable: remaining > 0,
          updatedAt: new Date().toISOString(),
        };
        this.stock.set(key, updated);
        createdReservations.push({
          orderId,
          productId: item.productId,
          variantId: item.variantId ?? null,
          quantity: item.quantity,
          status: 'RESERVED',
        });
      }

      results.push({
        productId: item.productId,
        variantId: item.variantId ?? null,
        reserved: canReserve,
        remaining,
        isAvailable: remaining > 0,
      });
    }

    if (results.some((result) => !result.reserved)) {
      for (const reservation of createdReservations) {
        const key = this.key(reservation.productId, reservation.variantId);
        const current = this.stock.get(key);

        if (!current) {
          continue;
        }

        const nextReserved = Math.max(0, current.quantityReserved - reservation.quantity);
        this.stock.set(key, {
          ...current,
          quantityReserved: nextReserved,
          quantityAvailable: current.quantityOnHand - nextReserved,
          isAvailable: current.status === 'ACTIVE' && current.quantityOnHand - nextReserved > 0,
          updatedAt: new Date().toISOString(),
        });
      }

      return Promise.resolve(results);
    }

    this.reservations.set(orderId, createdReservations);
    return Promise.resolve(results);
  }

  confirmReservation(orderId: string): Promise<void> {
    const reservations = this.reservations.get(orderId) ?? [];

    for (const reservation of reservations) {
      if (reservation.status !== 'RESERVED') {
        continue;
      }

      const key = this.key(reservation.productId, reservation.variantId);
      const current = this.stock.get(key);
      if (!current) {
        continue;
      }

      const nextReserved = Math.max(0, current.quantityReserved - reservation.quantity);
      const nextOnHand = Math.max(0, current.quantityOnHand - reservation.quantity);
      this.stock.set(key, {
        ...current,
        quantityOnHand: nextOnHand,
        quantityReserved: nextReserved,
        quantityAvailable: nextOnHand - nextReserved,
        isAvailable: current.status === 'ACTIVE' && nextOnHand - nextReserved > 0,
        updatedAt: new Date().toISOString(),
      });
      reservation.status = 'CONFIRMED';
    }

    return Promise.resolve();
  }

  releaseReservation(orderId: string): Promise<void> {
    const reservations = this.reservations.get(orderId) ?? [];

    for (const reservation of reservations) {
      if (reservation.status !== 'RESERVED') {
        continue;
      }

      const key = this.key(reservation.productId, reservation.variantId);
      const current = this.stock.get(key);
      if (!current) {
        continue;
      }

      const nextReserved = Math.max(0, current.quantityReserved - reservation.quantity);
      this.stock.set(key, {
        ...current,
        quantityReserved: nextReserved,
        quantityAvailable: current.quantityOnHand - nextReserved,
        isAvailable: current.status === 'ACTIVE' && current.quantityOnHand - nextReserved > 0,
        updatedAt: new Date().toISOString(),
      });
      reservation.status = 'RELEASED';
    }

    return Promise.resolve();
  }

  listAll(): Promise<StockItem[]> {
    return Promise.resolve(Array.from(this.stock.values()));
  }

  upsertItem(item: UpsertStockItemRequest): Promise<StockItem> {
    const key = this.key(item.productId, item.variantId ?? null);
    const current = this.stock.get(key);
    const quantityReserved = current?.quantityReserved ?? 0;
    const quantityAvailable = item.quantityOnHand - quantityReserved;

    const updated: StockItem = {
      productId: item.productId,
      variantId: item.variantId ?? null,
      quantityOnHand: item.quantityOnHand,
      quantityReserved,
      quantityAvailable,
      status: item.status ?? 'ACTIVE',
      isAvailable:
        (item.status ?? 'ACTIVE') === 'ACTIVE' && quantityAvailable > 0,
      updatedAt: new Date().toISOString(),
    };

    this.stock.set(key, updated);
    return Promise.resolve(updated);
  }

  ensureItem(item: EnsureStockItemRequest): Promise<StockItem> {
    const key = this.key(item.productId, item.variantId ?? null);
    const existing = this.stock.get(key);

    if (existing) {
      return Promise.resolve(existing);
    }

    const created: StockItem = {
      productId: item.productId,
      variantId: item.variantId ?? null,
      quantityOnHand: 0,
      quantityReserved: 0,
      quantityAvailable: 0,
      status: item.status ?? 'ACTIVE',
      isAvailable: false,
      updatedAt: new Date().toISOString(),
    };

    this.stock.set(key, created);
    return Promise.resolve(created);
  }

  deleteItem(productId: string, variantId?: string | null): Promise<StockItem> {
    const key = this.key(productId, variantId ?? null);
    const existing = this.stock.get(key);

    if (!existing) {
      throw new Error(
        `Stock item not found for product ${productId} and variant ${variantId ?? ''}`,
      );
    }

    this.stock.delete(key);
    return Promise.resolve(existing);
  }

  private key(productId: string, variantId: string | null): string {
    return `${productId}::${variantId ?? ''}`;
  }
}
