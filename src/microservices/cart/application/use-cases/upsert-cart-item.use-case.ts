import { Inject, Injectable } from '@nestjs/common';
import { CART_REPOSITORY_PORT } from '../ports/cart-repository.port';
import { CartItem } from '../../domain/cart';
import type { CartRepositoryPort } from '../ports/cart-repository.port';

@Injectable()
export class UpsertCartItemUseCase {
  constructor(
    @Inject(CART_REPOSITORY_PORT)
    private readonly cartRepository: CartRepositoryPort,
  ) {}

  async execute(input: {
    customerId: string;
    productId: string;
    quantity: number;
  }): Promise<CartItem> {
    return this.cartRepository.upsertItem(input);
  }
}
