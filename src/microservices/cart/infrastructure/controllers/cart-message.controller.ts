import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GetCartUseCase } from '../../application/use-cases/get-cart.use-case';
import { UpsertCartItemUseCase } from '../../application/use-cases/upsert-cart-item.use-case';
import { RemoveCartItemUseCase } from '../../application/use-cases/remove-cart-item.use-case';
import { ClearCartUseCase } from '../../application/use-cases/clear-cart.use-case';

@Controller()
export class CartMessageController {
  constructor(
    private readonly getCartUseCase: GetCartUseCase,
    private readonly upsertCartItemUseCase: UpsertCartItemUseCase,
    private readonly removeCartItemUseCase: RemoveCartItemUseCase,
    private readonly clearCartUseCase: ClearCartUseCase,
  ) {}

  @MessagePattern('cart.get')
  getCart(@Payload() payload: { customerId: string }) {
    return this.getCartUseCase.execute(payload.customerId);
  }

  @MessagePattern('cart.upsert_item')
  upsertItem(
    @Payload() payload: { customerId: string; productId: string; quantity: number },
  ) {
    return this.upsertCartItemUseCase.execute(payload);
  }

  @MessagePattern('cart.remove_item')
  removeItem(@Payload() payload: { customerId: string; productId: string }) {
    return this.removeCartItemUseCase.execute(payload.customerId, payload.productId);
  }

  @MessagePattern('cart.clear')
  clearCart(@Payload() payload: { customerId: string }) {
    return this.clearCartUseCase.execute(payload.customerId);
  }
}
