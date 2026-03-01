import { Injectable } from '@nestjs/common';
import { ShipmentRepositoryPort } from '../../application/ports/shipment-repository.port';
import { Shipment } from '../../domain/shipment';

@Injectable()
export class InMemoryShipmentRepository implements ShipmentRepositoryPort {
  private readonly shipments: Shipment[] = [];

  save(shipment: Shipment): Promise<Shipment> {
    const existing = this.shipments.find(
      (candidate) => candidate.paymentId === shipment.paymentId,
    );

    if (existing) {
      return Promise.resolve(existing);
    }

    this.shipments.push(shipment);
    return Promise.resolve(shipment);
  }

  findByOrderId(orderId: string): Promise<Shipment | null> {
    const shipment =
      this.shipments.find((candidate) => candidate.orderId === orderId) ?? null;
    return Promise.resolve(shipment);
  }

  findByPaymentId(paymentId: string): Promise<Shipment | null> {
    const shipment =
      this.shipments.find((candidate) => candidate.paymentId === paymentId) ??
      null;
    return Promise.resolve(shipment);
  }

  findAll(): Promise<Shipment[]> {
    return Promise.resolve([...this.shipments]);
  }

  updateStatus(
    orderId: string,
    status: Shipment['status'],
    note?: string,
  ): Promise<Shipment> {
    const index = this.shipments.findIndex(
      (candidate) => candidate.orderId === orderId,
    );

    if (index === -1) {
      throw new Error(`Shipment not found for order ${orderId}`);
    }

    this.shipments[index] = {
      ...this.shipments[index],
      status,
      events: [
        ...this.shipments[index].events,
        {
          status,
          note:
            note?.trim() ??
            (status === 'IN_TRANSIT'
              ? 'Package is on the way to the destination.'
              : status === 'DELIVERED'
                ? 'Package delivered to the customer.'
                : status === 'FAILED'
                  ? 'Delivery attempt failed.'
                  : 'Shipment was created.'),
          happenedAt: new Date().toISOString(),
        },
      ],
    };

    return Promise.resolve(this.shipments[index]);
  }
}
