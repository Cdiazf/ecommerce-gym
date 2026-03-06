import { Injectable } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import type { CulqiGatewayPort } from '../../application/ports/culqi-gateway.port';

@Injectable()
export class CulqiHttpGateway implements CulqiGatewayPort {
  private readonly apiBaseUrl =
    process.env.CULQI_API_BASE_URL ?? 'https://api.culqi.com/v2';
  private readonly secretKey = process.env.CULQI_SECRET_KEY ?? '';
  private readonly webhookSecret = process.env.CULQI_WEBHOOK_SECRET ?? '';
  private readonly webhookSignatureMode = (
    process.env.CULQI_WEBHOOK_SIGNATURE_MODE ?? 'none'
  ).toLowerCase();
  private readonly isProduction =
    (process.env.NODE_ENV ?? '').toLowerCase() === 'production';
  private readonly walletOrderExpirationMinutes = Number(
    process.env.CULQI_WALLET_ORDER_EXPIRATION_MINUTES ?? 15,
  );

  async createPaymentOrder(input: {
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
  }> {
    const response = await this.postJson('/orders', {
      amount: input.amountInCents,
      currency_code: input.currencyCode,
      description: `Ecommerce Gym order ${input.internalOrderId}`,
      order_number: input.internalOrderId,
      client_details: {
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        phone_number: input.phoneNumber,
      },
      expiration_date:
        Math.floor(Date.now() / 1000) + this.walletOrderExpirationMinutes * 60,
      confirm: false,
      metadata: {
        internalOrderId: input.internalOrderId,
        customerId: input.customerId,
        paymentMethod: 'YAPE',
      },
    });

    return {
      id: String(response.id),
      paymentCode:
        typeof response.payment_code === 'string'
          ? response.payment_code
          : typeof response.paymentCode === 'string'
            ? response.paymentCode
            : null,
      paymentUrl:
        typeof response.payment_url === 'string'
          ? response.payment_url
          : typeof response.paymentUrl === 'string'
            ? response.paymentUrl
            : typeof response.qr === 'string'
              ? response.qr
              : null,
      status: String(response.state ?? response.status ?? 'pending'),
    };
  }

  verifyWebhookSignature(signature: string | undefined, payload: unknown): boolean {
    if (this.webhookSignatureMode === 'none') {
      return !this.isProduction;
    }

    if (!this.webhookSecret) {
      return false;
    }

    if (!signature) {
      return false;
    }

    if (this.webhookSignatureMode === 'shared-secret') {
      return signature === this.webhookSecret;
    }

    if (this.webhookSignatureMode !== 'hmac-sha256') {
      return false;
    }

    const expected = createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return signature === expected;
  }

  parseWebhook(payload: unknown): {
    orderId: string | null;
    externalReference: string | null;
    paymentCode: string | null;
    status: 'APPROVED' | 'FAILED' | 'EXPIRED' | 'IGNORED';
  } {
    if (!payload || typeof payload !== 'object') {
      return {
        orderId: null,
        externalReference: null,
        paymentCode: null,
        status: 'IGNORED',
      };
    }

    const event = payload as {
      type?: string;
      data?: {
        object?: {
          id?: string;
          order_number?: string;
          payment_code?: string;
          qr?: string;
          state?: string;
          status?: string;
          outcome?: { type?: string };
          metadata?: Record<string, unknown>;
        };
      };
    };

    const object = event.data?.object;
    const outcome = `${event.type ?? ''} ${object?.outcome?.type ?? ''} ${object?.status ?? ''} ${object?.state ?? ''}`
      .toLowerCase();
    const metadata = object?.metadata ?? {};
    const orderIdValue =
      metadata.internalOrderId ??
      metadata.orderId ??
      metadata.order_id ??
      object?.order_number ??
      null;

    let status: 'APPROVED' | 'FAILED' | 'EXPIRED' | 'IGNORED' = 'IGNORED';
    if (
      outcome.includes('order.status.changed paid') ||
      outcome.includes('paid') ||
      outcome.includes('capture') ||
      outcome.includes('success')
    ) {
      status = 'APPROVED';
    } else if (outcome.includes('expire')) {
      status = 'EXPIRED';
    } else if (
      outcome.includes('declin') ||
      outcome.includes('fail') ||
      outcome.includes('reject') ||
      outcome.includes('void')
    ) {
      status = 'FAILED';
    }

    return {
      orderId: typeof orderIdValue === 'string' ? orderIdValue : null,
      externalReference: typeof object?.id === 'string' ? object.id : null,
      paymentCode:
        typeof object?.payment_code === 'string'
          ? object.payment_code
          : typeof object?.qr === 'string'
            ? object.qr
            : null,
      status,
    };
  }

  private async postJson(
    path: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, any>> {
    if (!this.secretKey) {
      throw new Error('CULQI_SECRET_KEY is not configured');
    }

    const response = await fetch(`${this.apiBaseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.secretKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Culqi API request failed (${response.status}): ${text || response.statusText}`,
      );
    }

    return (await response.json()) as Record<string, any>;
  }
}
