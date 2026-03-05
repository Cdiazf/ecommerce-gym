import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateOrderUseCase } from '../../application/use-cases/create-order.use-case';
import { GetAllOrdersUseCase } from '../../application/use-cases/get-all-orders.use-case';
import { GetBestSellerProductsUseCase } from '../../application/use-cases/get-best-seller-products.use-case';
import { GetOrdersByCustomerUseCase } from '../../application/use-cases/get-orders-by-customer.use-case';
import { RetryPaymentUseCase } from '../../application/use-cases/retry-payment.use-case';

interface CreateOrderPayload {
  customerId: string;
  items: { productId: string; quantity: number }[];
  paymentMethod?: 'AUTO' | 'YAPE';
  subtotalAmount: number;
  totalAmount: number;
  shippingAddress: {
    addressId: string;
    label: string;
    recipientName: string;
    phone: string;
    line1: string;
    line2: string | null;
    district: string;
    city: string;
    region: string;
    postalCode: string | null;
    reference: string | null;
  };
  shippingCost: number;
  shippingCurrency: string;
  shippingServiceLevel: 'EXPRESS' | 'STANDARD';
  estimatedDeliveryDays: string;
}

@Controller()
export class OrdersMessageController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly getAllOrdersUseCase: GetAllOrdersUseCase,
    private readonly getBestSellerProductsUseCase: GetBestSellerProductsUseCase,
    private readonly getOrdersByCustomerUseCase: GetOrdersByCustomerUseCase,
    private readonly retryPaymentUseCase: RetryPaymentUseCase,
  ) {}

  @MessagePattern('orders.create_order')
  createOrder(@Payload() payload: CreateOrderPayload) {
    return this.createOrderUseCase.execute(payload);
  }

  @MessagePattern('orders.get_all')
  getAllOrders() {
    return this.getAllOrdersUseCase.execute();
  }

  @MessagePattern('orders.get_by_customer')
  getOrdersByCustomer(@Payload() payload: { customerId: string }) {
    return this.getOrdersByCustomerUseCase.execute(payload.customerId);
  }

  @MessagePattern('orders.get_best_sellers')
  getBestSellerProducts(@Payload() payload?: { limit?: number }) {
    return this.getBestSellerProductsUseCase.execute(payload?.limit ?? 8);
  }

  @MessagePattern('orders.retry_payment')
  retryPayment(@Payload() payload: { orderId: string; customerId: string }) {
    return this.retryPaymentUseCase.execute(payload);
  }
}
