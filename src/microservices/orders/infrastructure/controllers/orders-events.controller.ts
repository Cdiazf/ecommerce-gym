import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CancelOrderUseCase } from '../../application/use-cases/cancel-order.use-case';
import { MarkOrderPaidUseCase } from '../../application/use-cases/mark-order-paid.use-case';

@Controller()
export class OrdersEventsController {
  constructor(
    private readonly markOrderPaidUseCase: MarkOrderPaidUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
  ) {}

  @EventPattern('payment.approved')
  async handlePaymentApproved(@Payload() payload: { orderId: string }): Promise<void> {
    await this.markOrderPaidUseCase.execute(payload.orderId);
  }

  @EventPattern('payment.failed')
  async handlePaymentFailed(@Payload() payload: { orderId: string }): Promise<void> {
    await this.cancelOrderUseCase.execute(payload.orderId);
  }

  @EventPattern('payment.expired')
  async handlePaymentExpired(@Payload() payload: { orderId: string }): Promise<void> {
    await this.cancelOrderUseCase.execute(payload.orderId);
  }
}
