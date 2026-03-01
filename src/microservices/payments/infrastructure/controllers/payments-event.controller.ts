import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ProcessPaymentUseCase } from '../../application/use-cases/process-payment.use-case';

interface OrderCreatedEvent {
  orderId: string;
  customerId: string;
  items: Array<{ productId: string; quantity: number }>;
  paymentMethod?: 'AUTO' | 'YAPE';
}

@Controller()
export class PaymentsEventController {
  constructor(private readonly processPaymentUseCase: ProcessPaymentUseCase) {}

  @EventPattern('order.created')
  async handleOrderCreated(@Payload() event: OrderCreatedEvent): Promise<void> {
    await this.processPaymentUseCase.execute(event);
  }
}
