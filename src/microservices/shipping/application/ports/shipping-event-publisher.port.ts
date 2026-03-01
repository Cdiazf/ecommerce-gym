import { Shipment } from '../../domain/shipment';

export const SHIPPING_EVENT_PUBLISHER_PORT = Symbol(
  'SHIPPING_EVENT_PUBLISHER_PORT',
);

export interface ShippingEventPublisherPort {
  publishShippingCreated(shipment: Shipment): Promise<void>;
}
