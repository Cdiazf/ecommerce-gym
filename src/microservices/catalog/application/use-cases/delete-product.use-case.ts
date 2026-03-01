import { Inject, Injectable } from '@nestjs/common';
import {
  PRODUCT_COMMAND_PORT,
  type ProductCommandPort,
} from '../ports/product-command.port';

@Injectable()
export class DeleteProductUseCase {
  constructor(
    @Inject(PRODUCT_COMMAND_PORT)
    private readonly productCommand: ProductCommandPort,
  ) {}

  async execute(productId: string): Promise<{ deleted: boolean; productId: string }> {
    await this.productCommand.deleteProduct(productId);
    return { deleted: true, productId };
  }
}
