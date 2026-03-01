import { Injectable } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import type { CulqiGatewayPort } from '../../application/ports/culqi-gateway.port';

@Injectable()
export class CulqiHttpGateway implements CulqiGatewayPort {
  private readonly apiBaseUrl =
    process.env.CULQI_API_BASE_URL ?? 'https://api.culqi.com/v2';
  private readonly secretKey = process.env.CULQI_SECRET_KEY ?? '';
  private readonly webhookSecret = process.env.CULQI_WEBHOOK_SECRET ?? '';

  async createYapeToken(input: {
    amountInCents: number;
    email: string;
    phoneNumber: string;
    otp: string;
  }): Promise<{ id: string }> {
    const response = await this.postJson('/tokens/yape', {
      amount: input.amountInCents,
      currency_code: 'PEN',
      email: input.email,
      phone_number: input.phoneNumber,
      otp: input.otp,
    });

    return {
      id: String(response.id),
    };
  }

  async createCharge(input: {
    amountInCents: number;
    email: string;
    sourceId: string;
    orderId: string;
    customerId: string;
  }): Promise<{ id: string; status: string }> {
    const response = await this.postJson('/charges', {
      amount: input.amountInCents,
      currency_code: 'PEN',
      email: input.email,
      source_id: input.sourceId,
      capture: true,
      metadata: {
        orderId: input.orderId,
        customerId: input.customerId,
        paymentMethod: 'YAPE',
      },
    });

    return {
      id: String(response.id),
      status: String(response.outcome?.type ?? response.status ?? 'pending'),
    };
  }

  verifyWebhookSignature(signature: string | undefined, payload: unknown): boolean {
    if (!this.webhookSecret) {
      return true;
    }

    if (!signature) {
      return false;
    }

    const expected = createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return signature === expected;
  }

  parseWebhook(payload: unknown): {
    orderId: string | null;
    chargeId: string | null;
    sourceId: string | null;
    status: 'APPROVED' | 'FAILED' | 'EXPIRED' | 'IGNORED';
  } {
    if (!payload || typeof payload !== 'object') {
      return {
        orderId: null,
        chargeId: null,
        sourceId: null,
        status: 'IGNORED',
      };
    }

    const event = payload as {
      type?: string;
      data?: {
        object?: {
          id?: string;
          source_id?: string;
          status?: string;
          outcome?: { type?: string };
          metadata?: Record<string, unknown>;
        };
      };
    };

    const object = event.data?.object;
    const outcome = `${event.type ?? ''} ${object?.outcome?.type ?? ''} ${object?.status ?? ''}`
      .toLowerCase();
    const metadata = object?.metadata ?? {};
    const orderIdValue = metadata.orderId ?? metadata.order_id ?? null;

    let status: 'APPROVED' | 'FAILED' | 'EXPIRED' | 'IGNORED' = 'IGNORED';
    if (
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
      chargeId: typeof object?.id === 'string' ? object.id : null,
      sourceId: typeof object?.source_id === 'string' ? object.source_id : null,
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
