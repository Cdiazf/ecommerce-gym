import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GetAllShipmentsUseCase } from '../../application/use-cases/get-all-shipments.use-case';
import { GetShipmentByOrderUseCase } from '../../application/use-cases/get-shipment-by-order.use-case';
import { UpdateShipmentStatusUseCase } from '../../application/use-cases/update-shipment-status.use-case';

@Controller()
export class ShippingMessageController {
  constructor(
    private readonly getAllShipmentsUseCase: GetAllShipmentsUseCase,
    private readonly getShipmentByOrderUseCase: GetShipmentByOrderUseCase,
    private readonly updateShipmentStatusUseCase: UpdateShipmentStatusUseCase,
  ) {}

  @MessagePattern('shipping.get_all')
  getAll() {
    return this.getAllShipmentsUseCase.execute();
  }

  @MessagePattern('shipping.get_by_order')
  getByOrder(@Payload() payload: { orderId: string }) {
    return this.getShipmentByOrderUseCase.execute(payload.orderId);
  }

  @MessagePattern('shipping.update_status')
  updateStatus(
    @Payload()
    payload: {
      orderId: string;
      status: 'CREATED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';
      note?: string;
    },
  ) {
    return this.updateShipmentStatusUseCase.execute(
      payload.orderId,
      payload.status,
      payload.note,
    );
  }
}
