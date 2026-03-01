import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GetAllPaymentsUseCase } from '../../application/use-cases/get-all-payments.use-case';
import { GetPaymentByOrderUseCase } from '../../application/use-cases/get-payment-by-order.use-case';
import { StartYapePaymentUseCase } from '../../application/use-cases/start-yape-payment.use-case';
import { ConfirmYapePaymentUseCase } from '../../application/use-cases/confirm-yape-payment.use-case';
import { FailYapePaymentUseCase } from '../../application/use-cases/fail-yape-payment.use-case';
import { ExpireYapePaymentUseCase } from '../../application/use-cases/expire-yape-payment.use-case';
import { RetryYapePaymentUseCase } from '../../application/use-cases/retry-yape-payment.use-case';
import { CreateCulqiYapeChargeUseCase } from '../../application/use-cases/create-culqi-yape-charge.use-case';
import { ProcessCulqiWebhookUseCase } from '../../application/use-cases/process-culqi-webhook.use-case';

@Controller()
export class PaymentsMessageController {
  constructor(
    private readonly getAllPaymentsUseCase: GetAllPaymentsUseCase,
    private readonly getPaymentByOrderUseCase: GetPaymentByOrderUseCase,
    private readonly startYapePaymentUseCase: StartYapePaymentUseCase,
    private readonly confirmYapePaymentUseCase: ConfirmYapePaymentUseCase,
    private readonly failYapePaymentUseCase: FailYapePaymentUseCase,
    private readonly expireYapePaymentUseCase: ExpireYapePaymentUseCase,
    private readonly retryYapePaymentUseCase: RetryYapePaymentUseCase,
    private readonly createCulqiYapeChargeUseCase: CreateCulqiYapeChargeUseCase,
    private readonly processCulqiWebhookUseCase: ProcessCulqiWebhookUseCase,
  ) {}

  @MessagePattern('payments.get_by_order')
  getByOrder(@Payload() payload: { orderId: string }) {
    return this.getPaymentByOrderUseCase.execute(payload.orderId);
  }

  @MessagePattern('payments.get_all')
  getAll() {
    return this.getAllPaymentsUseCase.execute();
  }

  @MessagePattern('payments.start_yape')
  startYape(@Payload() payload: { orderId: string; phone?: string }) {
    return this.startYapePaymentUseCase.execute(payload);
  }

  @MessagePattern('payments.confirm_yape')
  confirmYape(@Payload() payload: { orderId: string; operationCode: string }) {
    return this.confirmYapePaymentUseCase.execute(payload);
  }

  @MessagePattern('payments.fail_yape')
  failYape(@Payload() payload: { orderId: string; reason?: string }) {
    return this.failYapePaymentUseCase.execute(payload);
  }

  @MessagePattern('payments.expire_yape')
  expireYape(@Payload() payload: { orderId: string }) {
    return this.expireYapePaymentUseCase.execute(payload);
  }

  @MessagePattern('payments.retry_yape')
  retryYape(@Payload() payload: { orderId: string }) {
    return this.retryYapePaymentUseCase.execute(payload);
  }

  @MessagePattern('payments.create_culqi_yape_charge')
  createCulqiYapeCharge(
    @Payload()
    payload: {
      orderId: string;
      email: string;
      phoneNumber: string;
      otp: string;
    },
  ) {
    return this.createCulqiYapeChargeUseCase.execute(payload);
  }

  @MessagePattern('payments.process_culqi_webhook')
  processCulqiWebhook(
    @Payload()
    payload: {
      signature?: string;
      body: unknown;
    },
  ) {
    return this.processCulqiWebhookUseCase.execute(payload);
  }
}
