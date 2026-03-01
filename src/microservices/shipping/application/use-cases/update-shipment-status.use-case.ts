import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Shipment } from '../../domain/shipment';
import { SHIPMENT_REPOSITORY_PORT } from '../ports/shipment-repository.port';
import type { ShipmentRepositoryPort } from '../ports/shipment-repository.port';

@Injectable()
export class UpdateShipmentStatusUseCase {
  constructor(
    @Inject(SHIPMENT_REPOSITORY_PORT)
    private readonly shipmentRepository: ShipmentRepositoryPort,
  ) {}

  async execute(
    orderId: string,
    status: Shipment['status'],
    note?: string,
  ): Promise<Shipment> {
    const current = await this.shipmentRepository.findByOrderId(orderId);
    if (!current) {
      throw new BadRequestException(`Shipment not found for order ${orderId}`);
    }

    const allowedTransitions: Record<Shipment['status'], Shipment['status'][]> = {
      CREATED: ['IN_TRANSIT', 'FAILED'],
      IN_TRANSIT: ['DELIVERED', 'FAILED'],
      FAILED: ['CREATED'],
      DELIVERED: [],
    };

    if (!allowedTransitions[current.status].includes(status)) {
      throw new BadRequestException(
        `Invalid shipment transition: ${current.status} -> ${status}`,
      );
    }

    return this.shipmentRepository.updateStatus(orderId, status, note);
  }
}
