import { Payment } from '../../domain/payment';

export const PAYMENT_EVENT_PUBLISHER_PORT = Symbol(
  'PAYMENT_EVENT_PUBLISHER_PORT',
);

export interface PaymentEventPublisherPort {
  publishPaymentApproved(payment: Payment): Promise<void>;
  publishPaymentFailed(payment: Payment): Promise<void>;
  publishPaymentExpired(payment: Payment): Promise<void>;
}
