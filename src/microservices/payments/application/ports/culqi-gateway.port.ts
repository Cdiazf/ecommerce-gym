export const CULQI_GATEWAY_PORT = Symbol('CULQI_GATEWAY_PORT');

export interface CulqiGatewayPort {
  createYapeToken(input: {
    amountInCents: number;
    email: string;
    phoneNumber: string;
    otp: string;
  }): Promise<{ id: string }>;
  createCharge(input: {
    amountInCents: number;
    email: string;
    sourceId: string;
    orderId: string;
    customerId: string;
  }): Promise<{ id: string; status: string }>;
  verifyWebhookSignature(signature: string | undefined, payload: unknown): boolean;
  parseWebhook(payload: unknown): {
    orderId: string | null;
    chargeId: string | null;
    sourceId: string | null;
    status: 'APPROVED' | 'FAILED' | 'EXPIRED' | 'IGNORED';
  };
}
