import { Inject, Injectable } from '@nestjs/common';
import { CART_REPOSITORY_PORT } from '../ports/cart-repository.port';
import type { CartRepositoryPort } from '../ports/cart-repository.port';

@Injectable()
export class RemoveCartItemUseCase {
  constructor(
    @Inject(CART_REPOSITORY_PORT)
    private readonly cartRepository: CartRepositoryPort,
  ) {}

  async execute(customerId: string, productId: string): Promise<{ removed: boolean }> {
    await this.cartRepository.removeItem(customerId, productId);
    return { removed: true };
  }
}
