import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  InventoryPort,
  ReserveItemCommand,
  ReserveItemResult,
} from '../../application/ports/inventory.port';

@Injectable()
export class InventoryKafkaAdapter implements InventoryPort, OnModuleInit {
  constructor(
    @Inject('INVENTORY_SERVICE') private readonly inventoryClient: ClientKafka,
  ) {}

  async onModuleInit(): Promise<void> {
    this.inventoryClient.subscribeToResponseOf('inventory.reserve_items');
    this.inventoryClient.subscribeToResponseOf('inventory.release_reservation');
    await this.inventoryClient.connect();
  }

  async reserveItems(
    orderId: string,
    items: ReserveItemCommand[],
  ): Promise<ReserveItemResult[]> {
    return firstValueFrom(
      this.inventoryClient.send('inventory.reserve_items', { orderId, items }),
    );
  }

  async releaseReservation(orderId: string): Promise<void> {
    await firstValueFrom(
      this.inventoryClient.send('inventory.release_reservation', { orderId }),
    );
  }
}
