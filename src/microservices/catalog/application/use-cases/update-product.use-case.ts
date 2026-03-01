import { Inject, Injectable } from '@nestjs/common';
import {
  PRODUCT_COMMAND_PORT,
  type ProductCommandPort,
  type UpdateProductRequest,
} from '../ports/product-command.port';
import { Product } from '../../domain/product';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_COMMAND_PORT)
    private readonly productCommand: ProductCommandPort,
  ) {}

  async execute(input: UpdateProductRequest): Promise<Product> {
    return this.productCommand.updateProduct(input);
  }
}
