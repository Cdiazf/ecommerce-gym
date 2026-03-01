import { Shipment } from '../../domain/shipment';

export const SHIPMENT_REPOSITORY_PORT = Symbol('SHIPMENT_REPOSITORY_PORT');

export interface ShipmentRepositoryPort {
  save(shipment: Shipment): Promise<Shipment>;
  findAll(): Promise<Shipment[]>;
  findByOrderId(orderId: string): Promise<Shipment | null>;
  findByPaymentId(paymentId: string): Promise<Shipment | null>;
  updateStatus(
    orderId: string,
    status: Shipment['status'],
    note?: string,
  ): Promise<Shipment>;
}
