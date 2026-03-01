import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CreateShipmentUseCase } from '../../application/use-cases/create-shipment.use-case';

interface PaymentApprovedEvent {
  paymentId: string;
  orderId: string;
  customerId: string;
}

@Controller()
export class ShippingEventController {
  constructor(private readonly createShipmentUseCase: CreateShipmentUseCase) {}

  @EventPattern('payment.approved')
  async handlePaymentApproved(
    @Payload() event: PaymentApprovedEvent,
  ): Promise<void> {
    await this.createShipmentUseCase.execute(event);
  }
}
