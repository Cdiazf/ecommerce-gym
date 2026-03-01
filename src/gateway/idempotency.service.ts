import { ConflictException, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { IdempotencyRepository } from './idempotency.repository';

@Injectable()
export class IdempotencyService {
  constructor(private readonly repository: IdempotencyRepository) {}

  async execute<T>(input: {
    key?: string | null;
    routeScope: string;
    userScope: string;
    payload: unknown;
    handler: () => Promise<T>;
  }): Promise<T> {
    const normalizedKey = input.key?.trim();

    if (!normalizedKey) {
      return input.handler();
    }

    const requestHash = createHash('sha256')
      .update(JSON.stringify(input.payload))
      .digest('hex');

    const claim = await this.repository.claim(
      normalizedKey,
      input.routeScope,
      input.userScope,
      requestHash,
    );

    if (claim.state === 'hash_mismatch') {
      throw new ConflictException(
        'Idempotency-Key was already used with a different request payload.',
      );
    }

    if (claim.state === 'processing') {
      throw new ConflictException(
        'A request with this Idempotency-Key is already in progress. Retry later.',
      );
    }

    if (claim.state === 'completed') {
      return claim.response as T;
    }

    try {
      const result = await input.handler();
      await this.repository.complete(
        normalizedKey,
        input.routeScope,
        input.userScope,
        result,
      );
      return result;
    } catch (error) {
      await this.repository.release(
        normalizedKey,
        input.routeScope,
        input.userScope,
      );
      throw error;
    }
  }
}
