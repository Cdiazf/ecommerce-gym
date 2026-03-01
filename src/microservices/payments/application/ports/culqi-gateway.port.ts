export const CULQI_GATEWAY_PORT = Symbol('CULQI_GATEWAY_PORT');

export interface CulqiGatewayPort {
  createPaymentOrder(input: {
    amountInCents: number;
    currencyCode: 'PEN';
    internalOrderId: string;
    customerId: string;
    email: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
  }): Promise<{
    id: string;
    paymentCode: string | null;
    paymentUrl: string | null;
    status: string;
  }>;
  verifyWebhookSignature(signature: string | undefined, payload: unknown): boolean;
  parseWebhook(payload: unknown): {
    orderId: string | null;
    externalReference: string | null;
    paymentCode: string | null;
    status: 'APPROVED' | 'FAILED' | 'EXPIRED' | 'IGNORED';
  };
}
