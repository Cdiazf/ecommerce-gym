import { Inject, Injectable } from '@nestjs/common';
import { CART_REPOSITORY_PORT } from '../ports/cart-repository.port';
import type { CartRepositoryPort } from '../ports/cart-repository.port';

@Injectable()
export class ClearCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY_PORT)
    private readonly cartRepository: CartRepositoryPort,
  ) {}

  async execute(customerId: string): Promise<{ cleared: boolean }> {
    await this.cartRepository.clearCart(customerId);
    return { cleared: true };
  }
}
