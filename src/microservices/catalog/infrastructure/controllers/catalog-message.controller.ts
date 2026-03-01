import { Inject } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateProductUseCase } from '../../application/use-cases/create-product.use-case';
import { CreateProductVariantUseCase } from '../../application/use-cases/create-product-variant.use-case';
import { UpdateProductUseCase } from '../../application/use-cases/update-product.use-case';
import { DeleteProductUseCase } from '../../application/use-cases/delete-product.use-case';
import {
  PRODUCT_COMMAND_PORT,
  type CreateProductCategoryRequest,
  type CreateProductImageRequest,
  type CreateProductPriceRequest,
  type ProductCommandPort,
  type UpdateProductCategoryRequest,
  type UpdateProductImageRequest,
  type UpdateProductPriceRequest,
  type UpdateProductVariantRequest,
} from '../../application/ports/product-command.port';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case';
import type {
  CreateProductRequest,
  CreateProductVariantRequest,
  UpdateProductRequest,
} from '../../application/ports/product-command.port';
import {
  PRODUCT_QUERY_PORT,
  type ProductQueryPort,
} from '../../application/ports/product-query.port';

@Controller()
export class CatalogMessageController {
  constructor(
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly createProductVariantUseCase: CreateProductVariantUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
    @Inject(PRODUCT_COMMAND_PORT)
    private readonly productCommand: ProductCommandPort,
    @Inject(PRODUCT_QUERY_PORT)
    private readonly productQuery: ProductQueryPort,
  ) {}

  @MessagePattern('catalog.get_products')
  getProducts() {
    return this.listProductsUseCase.execute();
  }

  @MessagePattern('catalog.get_product')
  getProduct(@Payload() payload: { id: string }) {
    return this.productQuery.findById(payload.id);
  }

  @MessagePattern('catalog.get_categories')
  getCategories() {
    return this.productQuery.listCategories();
  }

  @MessagePattern('catalog.create_product')
  createProduct(@Payload() payload: CreateProductRequest) {
    return this.createProductUseCase.execute(payload);
  }

  @MessagePattern('catalog.create_variant')
  createVariant(@Payload() payload: CreateProductVariantRequest) {
    return this.createProductVariantUseCase.execute(payload);
  }

  @MessagePattern('catalog.update_product')
  updateProduct(@Payload() payload: UpdateProductRequest) {
    return this.updateProductUseCase.execute(payload);
  }

  @MessagePattern('catalog.delete_product')
  deleteProduct(@Payload() payload: { id: string }) {
    return this.deleteProductUseCase.execute(payload.id);
  }

  @MessagePattern('catalog.update_variant')
  updateVariant(@Payload() payload: UpdateProductVariantRequest) {
    return this.productCommand.updateVariant(payload);
  }

  @MessagePattern('catalog.delete_variant')
  deleteVariant(@Payload() payload: { id: string }) {
    return this.productCommand.deleteVariant(payload.id);
  }

  @MessagePattern('catalog.create_price')
  createPrice(@Payload() payload: CreateProductPriceRequest) {
    return this.productCommand.createPrice(payload);
  }

  @MessagePattern('catalog.update_price')
  updatePrice(@Payload() payload: UpdateProductPriceRequest) {
    return this.productCommand.updatePrice(payload);
  }

  @MessagePattern('catalog.delete_price')
  deletePrice(@Payload() payload: { id: string }) {
    return this.productCommand.deletePrice(payload.id);
  }

  @MessagePattern('catalog.create_image')
  createImage(@Payload() payload: CreateProductImageRequest) {
    return this.productCommand.createImage(payload);
  }

  @MessagePattern('catalog.update_image')
  updateImage(@Payload() payload: UpdateProductImageRequest) {
    return this.productCommand.updateImage(payload);
  }

  @MessagePattern('catalog.delete_image')
  deleteImage(@Payload() payload: { id: string }) {
    return this.productCommand.deleteImage(payload.id);
  }

  @MessagePattern('catalog.create_category')
  createCategory(@Payload() payload: CreateProductCategoryRequest) {
    return this.productCommand.createCategory(payload);
  }

  @MessagePattern('catalog.update_category')
  updateCategory(@Payload() payload: UpdateProductCategoryRequest) {
    return this.productCommand.updateCategory(payload);
  }

  @MessagePattern('catalog.delete_category')
  deleteCategory(@Payload() payload: { id: string }) {
    return this.productCommand.deleteCategory(payload.id);
  }

  @MessagePattern('catalog.assign_category')
  assignCategory(@Payload() payload: { productId: string; categoryId: string }) {
    return this.productCommand.assignCategoryToProduct(
      payload.productId,
      payload.categoryId,
    );
  }

  @MessagePattern('catalog.unassign_category')
  unassignCategory(@Payload() payload: { productId: string; categoryId: string }) {
    return this.productCommand.unassignCategoryFromProduct(
      payload.productId,
      payload.categoryId,
    );
  }
}
