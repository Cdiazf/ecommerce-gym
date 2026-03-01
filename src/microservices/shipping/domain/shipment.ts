export interface ShipmentEvent {
  status: 'CREATED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';
  note: string;
  happenedAt: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  paymentId: string;
  customerId: string;
  trackingCode: string;
  status: 'CREATED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';
  events: ShipmentEvent[];
  createdAt: string;
}
