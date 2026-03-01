import { Order } from '../../domain/order';

export const ORDER_EVENT_PUBLISHER_PORT = Symbol('ORDER_EVENT_PUBLISHER_PORT');

export interface OrderEventPublisherPort {
  publishOrderCreated(order: Order, paymentMethod: 'AUTO' | 'YAPE'): Promise<void>;
}
