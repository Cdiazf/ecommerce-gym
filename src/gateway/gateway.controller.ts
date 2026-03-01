import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Headers,
  Inject,
  Param,
  Put,
  OnModuleInit,
  Post,
  UnauthorizedException,
  Req,
  UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AuthGuard } from './auth/auth.guard';
import { Roles } from './auth/roles.decorator';
import { RolesGuard } from './auth/roles.guard';
import type { AuthenticatedRequest } from './auth/auth.guard';
import { AuthUserRepository } from './auth/auth-user.repository';
import { ShippingAddressRepository } from './auth/shipping-address.repository';
import { IdempotencyService } from './idempotency.service';
import {
  CreateOrderDto,
  CreateOrderItemDto,
  ShippingAddressDto,
  ShippingQuoteDto,
  UpdateShipmentStatusDto,
  UpsertCartItemDto,
} from './gateway.dto';

interface UpsertInventoryItemDto {
  productId: string;
  variantId?: string | null;
  quantityOnHand: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

interface CreateCatalogProductDto {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description?: string | null;
  brand: string;
  status?: string;
}

interface UpdateCatalogProductDto {
  sku?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  brand?: string;
  status?: string;
}

interface CreateCatalogVariantDto {
  id: string;
  productId: string;
  sku: string;
  color?: string | null;
  size?: string | null;
  material?: string | null;
  barcode?: string | null;
  weightGrams?: number | null;
  status?: string;
}

interface UpdateCatalogVariantDto {
  sku?: string;
  color?: string | null;
  size?: string | null;
  material?: string | null;
  barcode?: string | null;
  weightGrams?: number | null;
  status?: string;
}

interface CreateCatalogPriceDto {
  id: string;
  variantId: string;
  currency: string;
  listPrice: number;
  salePrice?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
}

interface UpdateCatalogPriceDto {
  currency?: string;
  listPrice?: number;
  salePrice?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
}

interface CreateCatalogImageDto {
  id: string;
  productId: string;
  variantId?: string | null;
  url: string;
  altText?: string | null;
  sortOrder?: number;
  isPrimary?: boolean;
}

interface UpdateCatalogImageDto {
  url?: string;
  altText?: string | null;
  sortOrder?: number;
  isPrimary?: boolean;
  variantId?: string | null;
}

interface CreateCatalogCategoryDto {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
}

interface UpdateCatalogCategoryDto {
  name?: string;
  slug?: string;
  parentId?: string | null;
}

interface DeleteInventoryItemDto {
  productId: string;
  variantId?: string | null;
}

interface AdminOrderView {
  id: string;
  customerId: string;
}

interface CatalogPriceView {
  salePrice?: number | null;
  listPrice: number;
}

interface CatalogVariantView {
  prices: CatalogPriceView[];
}

interface CatalogProductView {
  id: string;
  variants: CatalogVariantView[];
}

@Controller()
export class GatewayController implements OnModuleInit {
  constructor(
    @Inject('CATALOG_SERVICE') private readonly catalogClient: ClientKafka,
    @Inject('ORDERS_SERVICE') private readonly ordersClient: ClientKafka,
    @Inject('INVENTORY_SERVICE') private readonly inventoryClient: ClientKafka,
    @Inject('PAYMENTS_SERVICE') private readonly paymentsClient: ClientKafka,
    @Inject('SHIPPING_SERVICE') private readonly shippingClient: ClientKafka,
    @Inject('CART_SERVICE') private readonly cartClient: ClientKafka,
    private readonly authUserRepository: AuthUserRepository,
    private readonly shippingAddressRepository: ShippingAddressRepository,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.catalogClient.subscribeToResponseOf('catalog.get_products');
    this.catalogClient.subscribeToResponseOf('catalog.create_product');
    this.catalogClient.subscribeToResponseOf('catalog.create_variant');
    this.catalogClient.subscribeToResponseOf('catalog.update_product');
    this.catalogClient.subscribeToResponseOf('catalog.delete_product');
    this.catalogClient.subscribeToResponseOf('catalog.get_product');
    this.catalogClient.subscribeToResponseOf('catalog.get_categories');
    this.catalogClient.subscribeToResponseOf('catalog.update_variant');
    this.catalogClient.subscribeToResponseOf('catalog.delete_variant');
    this.catalogClient.subscribeToResponseOf('catalog.create_price');
    this.catalogClient.subscribeToResponseOf('catalog.update_price');
    this.catalogClient.subscribeToResponseOf('catalog.delete_price');
    this.catalogClient.subscribeToResponseOf('catalog.create_image');
    this.catalogClient.subscribeToResponseOf('catalog.update_image');
    this.catalogClient.subscribeToResponseOf('catalog.delete_image');
    this.catalogClient.subscribeToResponseOf('catalog.create_category');
    this.catalogClient.subscribeToResponseOf('catalog.update_category');
    this.catalogClient.subscribeToResponseOf('catalog.delete_category');
    this.catalogClient.subscribeToResponseOf('catalog.assign_category');
    this.catalogClient.subscribeToResponseOf('catalog.unassign_category');
    this.ordersClient.subscribeToResponseOf('orders.create_order');
    this.ordersClient.subscribeToResponseOf('orders.get_all');
    this.ordersClient.subscribeToResponseOf('orders.get_by_customer');
    this.ordersClient.subscribeToResponseOf('orders.retry_payment');
    this.inventoryClient.subscribeToResponseOf('inventory.get_stock');
    this.inventoryClient.subscribeToResponseOf('inventory.upsert_stock_item');
    this.inventoryClient.subscribeToResponseOf('inventory.delete_stock_item');
    this.cartClient.subscribeToResponseOf('cart.get');
    this.cartClient.subscribeToResponseOf('cart.upsert_item');
    this.cartClient.subscribeToResponseOf('cart.remove_item');
    this.cartClient.subscribeToResponseOf('cart.clear');
    this.paymentsClient.subscribeToResponseOf('payments.get_by_order');
    this.paymentsClient.subscribeToResponseOf('payments.get_all');
    this.paymentsClient.subscribeToResponseOf('payments.start_yape');
    this.paymentsClient.subscribeToResponseOf('payments.confirm_yape');
    this.paymentsClient.subscribeToResponseOf('payments.fail_yape');
    this.paymentsClient.subscribeToResponseOf('payments.expire_yape');
    this.paymentsClient.subscribeToResponseOf('payments.retry_yape');
    this.paymentsClient.subscribeToResponseOf('payments.create_culqi_yape_charge');
    this.paymentsClient.subscribeToResponseOf('payments.process_culqi_webhook');
    this.shippingClient.subscribeToResponseOf('shipping.get_all');
    this.shippingClient.subscribeToResponseOf('shipping.get_by_order');
    this.shippingClient.subscribeToResponseOf('shipping.update_status');
    await this.catalogClient.connect();
    await this.ordersClient.connect();
    await this.inventoryClient.connect();
    await this.cartClient.connect();
    await this.paymentsClient.connect();
    await this.shippingClient.connect();
  }

  @Get('products')
  getProducts() {
    return firstValueFrom(this.catalogClient.send('catalog.get_products', {}));
  }

  @Post('catalog/products')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  createCatalogProduct(@Body() body: CreateCatalogProductDto) {
    return firstValueFrom(
      this.catalogClient.send('catalog.create_product', body),
    );
  }

  @Post('catalog/variants')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  createCatalogVariant(@Body() body: CreateCatalogVariantDto) {
    return firstValueFrom(
      this.catalogClient.send('catalog.create_variant', body),
    );
  }

  @Put('catalog/variants/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateCatalogVariant(
    @Param('id') id: string,
    @Body() body: UpdateCatalogVariantDto,
  ) {
    return firstValueFrom(
      this.catalogClient.send('catalog.update_variant', { id, ...body }),
    );
  }

  @Delete('catalog/variants/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  deleteCatalogVariant(@Param('id') id: string) {
    return firstValueFrom(this.catalogClient.send('catalog.delete_variant', { id }));
  }

  @Post('catalog/prices')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  createCatalogPrice(@Body() body: CreateCatalogPriceDto) {
    return firstValueFrom(this.catalogClient.send('catalog.create_price', body));
  }

  @Put('catalog/prices/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateCatalogPrice(@Param('id') id: string, @Body() body: UpdateCatalogPriceDto) {
    return firstValueFrom(
      this.catalogClient.send('catalog.update_price', {
        id,
        ...body,
      }),
    );
  }

  @Delete('catalog/prices/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  deleteCatalogPrice(@Param('id') id: string) {
    return firstValueFrom(this.catalogClient.send('catalog.delete_price', { id }));
  }

  @Post('catalog/images')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  createCatalogImage(@Body() body: CreateCatalogImageDto) {
    return firstValueFrom(this.catalogClient.send('catalog.create_image', body));
  }

  @Put('catalog/images/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateCatalogImage(@Param('id') id: string, @Body() body: UpdateCatalogImageDto) {
    return firstValueFrom(
      this.catalogClient.send('catalog.update_image', { id, ...body }),
    );
  }

  @Delete('catalog/images/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  deleteCatalogImage(@Param('id') id: string) {
    return firstValueFrom(this.catalogClient.send('catalog.delete_image', { id }));
  }

  @Post('catalog/categories')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  createCatalogCategory(@Body() body: CreateCatalogCategoryDto) {
    return firstValueFrom(this.catalogClient.send('catalog.create_category', body));
  }

  @Get('catalog/categories')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  getCatalogCategories() {
    return firstValueFrom(this.catalogClient.send('catalog.get_categories', {}));
  }

  @Put('catalog/categories/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateCatalogCategory(
    @Param('id') id: string,
    @Body() body: UpdateCatalogCategoryDto,
  ) {
    return firstValueFrom(
      this.catalogClient.send('catalog.update_category', { id, ...body }),
    );
  }

  @Delete('catalog/categories/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  deleteCatalogCategory(@Param('id') id: string) {
    return firstValueFrom(this.catalogClient.send('catalog.delete_category', { id }));
  }

  @Get('catalog/products/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  getCatalogProductById(@Param('id') id: string) {
    return firstValueFrom(this.catalogClient.send('catalog.get_product', { id }));
  }

  @Post('catalog/products/:id/categories')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  assignCategoryToProduct(
    @Param('id') id: string,
    @Body() body: { categoryId: string },
  ) {
    return firstValueFrom(
      this.catalogClient.send('catalog.assign_category', {
        productId: id,
        categoryId: body.categoryId,
      }),
    );
  }

  @Delete('catalog/products/:id/categories/:categoryId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  unassignCategoryFromProduct(
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
  ) {
    return firstValueFrom(
      this.catalogClient.send('catalog.unassign_category', {
        productId: id,
        categoryId,
      }),
    );
  }

  @Put('catalog/products/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateCatalogProduct(
    @Param('id') id: string,
    @Body() body: UpdateCatalogProductDto,
  ) {
    return firstValueFrom(
      this.catalogClient.send('catalog.update_product', {
        id,
        ...body,
      }),
    );
  }

  @Delete('catalog/products/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  deleteCatalogProduct(@Param('id') id: string) {
    return firstValueFrom(
      this.catalogClient.send('catalog.delete_product', { id }),
    );
  }

  @UseGuards(AuthGuard)
  @Post('orders')
  async createOrder(
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() body: CreateOrderDto,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized');
    }

    if (!body.shippingAddressId) {
      throw new ConflictException('Shipping address is required');
    }

    const address = await this.shippingAddressRepository.findByIdForUser(
      request.user.userId,
      body.shippingAddressId,
    );

    if (!address) {
      throw new ConflictException('Shipping address not found');
    }

    const shippingQuote = this.buildShippingQuote(address, body.items);
    const subtotalAmount = await this.calculateOrderSubtotal(body.items);

    const payload = {
      customerId: request.user.userId,
      items: body.items,
      paymentMethod: body.paymentMethod ?? 'AUTO',
      subtotalAmount,
      totalAmount: Number((subtotalAmount + shippingQuote.shippingCost).toFixed(2)),
      shippingAddress: {
        addressId: address.id,
        label: address.label,
        recipientName: address.recipientName,
        phone: address.phone,
        line1: address.line1,
        line2: address.line2,
        district: address.district,
        city: address.city,
        region: address.region,
        postalCode: address.postalCode,
        reference: address.reference,
      },
      shippingCost: shippingQuote.shippingCost,
      shippingCurrency: shippingQuote.currency,
      shippingServiceLevel: shippingQuote.serviceLevel,
      estimatedDeliveryDays: shippingQuote.estimatedDeliveryDays,
    };

    try {
      return await this.idempotencyService.execute({
        key: idempotencyKey,
        routeScope: 'POST:/orders',
        userScope: request.user.userId,
        payload,
        handler: () =>
          firstValueFrom(this.ordersClient.send('orders.create_order', payload)),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);

      if (message.toLowerCase().includes('out of stock')) {
        throw new ConflictException('Some items are out of stock');
      }

      throw error;
    }
  }

  @UseGuards(AuthGuard)
  @Get('me/addresses')
  getMyShippingAddresses(@Req() request: AuthenticatedRequest) {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.shippingAddressRepository.listByUserId(request.user.userId);
  }

  @UseGuards(AuthGuard)
  @Post('me/addresses')
  createMyShippingAddress(
    @Req() request: AuthenticatedRequest,
    @Body() body: ShippingAddressDto,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.shippingAddressRepository.create({
      id: randomUUID(),
      userId: request.user.userId,
      ...body,
    });
  }

  @UseGuards(AuthGuard)
  @Put('me/addresses/:id')
  updateMyShippingAddress(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: Partial<ShippingAddressDto>,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.shippingAddressRepository.update(request.user.userId, id, body);
  }

  @UseGuards(AuthGuard)
  @Delete('me/addresses/:id')
  async deleteMyShippingAddress(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized');
    }

    await this.shippingAddressRepository.delete(request.user.userId, id);
    return { deleted: true };
  }

  @UseGuards(AuthGuard)
  @Post('shipping/quote')
  async quoteShipping(
    @Req() request: AuthenticatedRequest,
    @Body() body: ShippingQuoteDto,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized');
    }

    const address = await this.shippingAddressRepository.findByIdForUser(
      request.user.userId,
      body.addressId,
    );

    if (!address) {
      throw new ConflictException('Shipping address not found');
    }

    return {
      addressId: address.id,
      ...this.buildShippingQuote(address, body.items),
    };
  }

  @Get('inventory')
  getInventory() {
    return firstValueFrom(this.inventoryClient.send('inventory.get_stock', {}));
  }

  @Post('inventory/stock')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  upsertInventoryStock(@Body() body: UpsertInventoryItemDto) {
    return firstValueFrom(
      this.inventoryClient.send('inventory.upsert_stock_item', body),
    );
  }

  @Delete('inventory/stock')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  deleteInventoryStock(@Body() body: DeleteInventoryItemDto) {
    return firstValueFrom(
      this.inventoryClient.send('inventory.delete_stock_item', body),
    );
  }

  @UseGuards(AuthGuard)
  @Get('cart')
  getCart(@Req() request: AuthenticatedRequest) {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized');
    }

    return firstValueFrom(
      this.cartClient.send('cart.get', {
        customerId: request.user.userId,
      }),
    );
  }

  @UseGuards(AuthGuard)
  @Post('cart/items')
  upsertCartItem(
    @Req() request: AuthenticatedRequest,
    @Body() body: UpsertCartItemDto,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized');
    }

    return firstValueFrom(
      this.cartClient.send('cart.upsert_item', {
        customerId: request.user.userId,
        productId: body.productId,
        quantity: body.quantity,
      }),
    );
  }

  @UseGuards(AuthGuard)
  @Put('cart/items/:productId')
  updateCartItem(
    @Req() request: AuthenticatedRequest,
    @Param('productId') productId: string,
    @Body() body: { quantity: number },
  ) {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized');
    }

    return firstValueFrom(
      this.cartClient.send('cart.upsert_item', {
        customerId: request.user.userId,
        productId,
        quantity: body.quantity,
      }),
    );
  }

  @UseGuards(AuthGuard)
  @Delete('cart/items/:productId')
  removeCartItem(
    @Req() request: AuthenticatedRequest,
    @Param('productId') productId: string,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized');
    }

    return firstValueFrom(
      this.cartClient.send('cart.remove_item', {
        customerId: request.user.userId,
        productId,
      }),
    );
  }

  @UseGuards(AuthGuard)
  @Delete('cart')
  clearCart(@Req() request: AuthenticatedRequest) {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized');
    }

    return firstValueFrom(
      this.cartClient.send('cart.clear', {
        customerId: request.user.userId,
      }),
    );
  }

  @Get('payments/:orderId')
  getPaymentByOrder(@Param('orderId') orderId: string) {
    return firstValueFrom(
      this.paymentsClient.send('payments.get_by_order', { orderId }),
    );
  }

  @UseGuards(AuthGuard)
  @Post('payments/yape/start')
  startYapePayment(
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() body: { orderId: string; phone?: string },
  ) {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized');
    }

    const payload = {
      orderId: body.orderId,
      phone: body.phone,
    };

    return this.idempotencyService.execute({
      key: idempotencyKey ?? `payments.start_yape:${body.orderId}`,
      routeScope: 'POST:/payments/yape/start',
      userScope: request.user.userId,
      payload,
      handler: () =>
        firstValueFrom(this.paymentsClient.send('payments.start_yape', payload)),
    });
  }

  @UseGuards(AuthGuard)
  @Post('payments/yape/confirm')
  confirmYapePayment(
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() body: { orderId: string; operationCode: string },
  ) {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized');
    }

    const payload = {
      orderId: body.orderId,
      operationCode: body.operationCode,
    };

    return this.idempotencyService.execute({
      key: idempotencyKey ?? `payments.confirm_yape:${body.orderId}`,
      routeScope: 'POST:/payments/yape/confirm',
      userScope: request.user.userId,
      payload,
      handler: () =>
        firstValueFrom(this.paymentsClient.send('payments.confirm_yape', payload)),
    });
  }

  @UseGuards(AuthGuard)
  @Post('payments/yape/retry')
  async retryYapePayment(
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() body: { orderId: string; phone?: string },
  ) {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized');
    }

    const payload = {
      orderId: body.orderId,
      phone: body.phone,
      customerId: request.user.userId,
    };

    return this.idempotencyService.execute({
      key: idempotencyKey ?? `payments.retry_yape:${body.orderId}`,
      routeScope: 'POST:/payments/yape/retry',
      userScope: request.user.userId,
      payload,
      handler: async () => {
        await firstValueFrom(
          this.ordersClient.send('orders.retry_payment', {
            orderId: body.orderId,
            customerId: request.user?.userId,
          }),
        );

        await firstValueFrom(
          this.paymentsClient.send('payments.retry_yape', {
            orderId: body.orderId,
          }),
        );

        return firstValueFrom(
          this.paymentsClient.send('payments.start_yape', {
            orderId: body.orderId,
            phone: body.phone,
          }),
        );
      },
    });
  }

  @UseGuards(AuthGuard)
  @Post('payments/yape/fail')
  failYapePayment(
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() body: { orderId: string; reason?: string },
  ) {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized');
    }

    const payload = {
      orderId: body.orderId,
      reason: body.reason,
    };

    return this.idempotencyService.execute({
      key: idempotencyKey ?? `payments.fail_yape:${body.orderId}`,
      routeScope: 'POST:/payments/yape/fail',
      userScope: request.user.userId,
      payload,
      handler: () =>
        firstValueFrom(this.paymentsClient.send('payments.fail_yape', payload)),
    });
  }

  @UseGuards(AuthGuard)
  @Post('payments/yape/expire')
  expireYapePayment(
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() body: { orderId: string },
  ) {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized');
    }

    const payload = {
      orderId: body.orderId,
    };

    return this.idempotencyService.execute({
      key: idempotencyKey ?? `payments.expire_yape:${body.orderId}`,
      routeScope: 'POST:/payments/yape/expire',
      userScope: request.user.userId,
      payload,
      handler: () =>
        firstValueFrom(this.paymentsClient.send('payments.expire_yape', payload)),
    });
  }

  @UseGuards(AuthGuard)
  @Post('payments/culqi/yape/charge')
  createCulqiYapeCharge(
    @Req() request: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() body: {
      orderId: string;
      email: string;
      phoneNumber: string;
      otp: string;
    },
  ) {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized');
    }

    const payload = {
      orderId: body.orderId,
      email: body.email,
      phoneNumber: body.phoneNumber,
      otp: body.otp,
    };

    return this.idempotencyService.execute({
      key: idempotencyKey ?? `payments.culqi_yape_charge:${body.orderId}`,
      routeScope: 'POST:/payments/culqi/yape/charge',
      userScope: request.user.userId,
      payload,
      handler: () =>
        firstValueFrom(
          this.paymentsClient.send('payments.create_culqi_yape_charge', payload),
        ),
    });
  }

  @Post('payments/culqi/webhook')
  processCulqiWebhook(
    @Headers('x-culqi-signature') signature: string | undefined,
    @Body() body: unknown,
  ) {
    return firstValueFrom(
      this.paymentsClient.send('payments.process_culqi_webhook', {
        signature,
        body,
      }),
    );
  }

  @Get('shipments/:orderId')
  getShipmentByOrder(@Param('orderId') orderId: string) {
    return firstValueFrom(
      this.shippingClient.send('shipping.get_by_order', { orderId }),
    );
  }

  @UseGuards(AuthGuard)
  @Get('orders/my')
  getMyOrders(@Req() request: AuthenticatedRequest) {
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized');
    }

    return firstValueFrom(
      this.ordersClient.send('orders.get_by_customer', {
        customerId: request.user.userId,
      }),
    );
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/shipments')
  getAllShipments() {
    return firstValueFrom(this.shippingClient.send('shipping.get_all', {}));
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Put('admin/shipments/:orderId/status')
  updateShipmentStatus(
    @Param('orderId') orderId: string,
    @Body() body: UpdateShipmentStatusDto,
  ) {
    return firstValueFrom(
      this.shippingClient.send('shipping.update_status', {
        orderId,
        status: body.status,
        note: body.note,
      }),
    );
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/orders')
  getAllOrders() {
    return firstValueFrom(this.ordersClient.send('orders.get_all', {}));
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/payments')
  getAllPayments() {
    return firstValueFrom(this.paymentsClient.send('payments.get_all', {}));
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/users')
  getAllUsers() {
    return this.authUserRepository.listUsers();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/orders/by-user')
  async getOrdersByUserDashboard() {
    const orders = (await firstValueFrom(
      this.ordersClient.send('orders.get_all', {}),
    )) as AdminOrderView[];

    const grouped = new Map<
      string,
      { customerId: string; totalOrders: number; orders: string[] }
    >();

    for (const order of orders) {
      const current: { customerId: string; totalOrders: number; orders: string[] } =
        grouped.get(order.customerId) ?? {
        customerId: order.customerId,
        totalOrders: 0,
        orders: [],
      };

      current.totalOrders += 1;
      current.orders.push(order.id);
      grouped.set(order.customerId, current);
    }

    return Array.from(grouped.values());
  }

  private buildShippingQuote(
    address: {
      region: string;
      city: string;
    },
    items: CreateOrderItemDto[],
  ): {
    serviceLevel: 'EXPRESS' | 'STANDARD';
    estimatedDeliveryDays: string;
    totalUnits: number;
    shippingCost: number;
    currency: string;
  } {
    const totalUnits = items.reduce(
      (total, item) => total + Math.max(0, item.quantity),
      0,
    );
    const normalizedRegion = address.region.trim().toLowerCase();
    const normalizedCity = address.city.trim().toLowerCase();
    const isLimaMetro =
      normalizedRegion === 'lima' &&
      ['lima', 'miraflores', 'san isidro', 'surco', 'la molina', 'san borja'].includes(
        normalizedCity,
      );
    const base = isLimaMetro ? 7.9 : 12.9;
    const perUnit = isLimaMetro ? 1.1 : 1.8;
    const fuelSurcharge = normalizedRegion === 'lima' ? 0 : 2.5;
    const shippingCost = Number(
      Math.max(0, base + Math.max(0, totalUnits - 1) * perUnit + fuelSurcharge).toFixed(
        2,
      ),
    );

    return {
      serviceLevel: isLimaMetro ? 'EXPRESS' : 'STANDARD',
      estimatedDeliveryDays: isLimaMetro ? '1-2' : '3-5',
      totalUnits,
      shippingCost,
      currency: 'USD',
    };
  }

  private async calculateOrderSubtotal(items: CreateOrderItemDto[]): Promise<number> {
    const products = (await firstValueFrom(
      this.catalogClient.send('catalog.get_products', {}),
    )) as CatalogProductView[];

    const productsById = new Map(products.map((product) => [product.id, product]));
    const subtotal = items.reduce((total, item) => {
      const product = productsById.get(item.productId);
      const firstVariant = product?.variants[0];
      const firstPrice = firstVariant?.prices[0];
      const unitPrice = firstPrice?.salePrice ?? firstPrice?.listPrice ?? 0;
      return total + unitPrice * item.quantity;
    }, 0);

    return Number(subtotal.toFixed(2));
  }
}
