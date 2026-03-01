import { Inject, Injectable } from '@nestjs/common';
import { Shipment } from '../../domain/shipment';
import { SHIPMENT_REPOSITORY_PORT } from '../ports/shipment-repository.port';
import type { ShipmentRepositoryPort } from '../ports/shipment-repository.port';

@Injectable()
export class GetAllShipmentsUseCase {
  constructor(
    @Inject(SHIPMENT_REPOSITORY_PORT)
    private readonly shipmentRepository: ShipmentRepositoryPort,
  ) {}

  async execute(): Promise<Shipment[]> {
    return this.shipmentRepository.findAll();
  }
}
