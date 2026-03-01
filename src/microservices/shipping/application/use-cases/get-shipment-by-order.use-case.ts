import { Inject, Injectable } from '@nestjs/common';
import { Shipment } from '../../domain/shipment';
import { SHIPMENT_REPOSITORY_PORT } from '../ports/shipment-repository.port';
import type { ShipmentRepositoryPort } from '../ports/shipment-repository.port';

@Injectable()
export class GetShipmentByOrderUseCase {
  constructor(
    @Inject(SHIPMENT_REPOSITORY_PORT)
    private readonly shipmentRepository: ShipmentRepositoryPort,
  ) {}

  async execute(orderId: string): Promise<Shipment | null> {
    return this.shipmentRepository.findByOrderId(orderId);
  }
}
