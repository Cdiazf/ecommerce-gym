import { Inject, Injectable } from '@nestjs/common';
import { CART_REPOSITORY_PORT } from '../ports/cart-repository.port';
import { Cart } from '../../domain/cart';
import type { CartRepositoryPort } from '../ports/cart-repository.port';

@Injectable()
export class GetCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY_PORT)
    private readonly cartRepository: CartRepositoryPort,
  ) {}

  async execute(customerId: string): Promise<Cart> {
    return this.cartRepository.getByCustomerId(customerId);
  }
}
