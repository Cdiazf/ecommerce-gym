import { Order } from '../../domain/order';

export const ORDER_REPOSITORY_PORT = Symbol('ORDER_REPOSITORY_PORT');

export interface BestSellerProductStat {
  productId: string;
  totalSold: number;
}

export interface OrderRepositoryPort {
  save(order: Order): Promise<Order>;
  findById(orderId: string): Promise<Order | null>;
  updateStatus(
    orderId: string,
    status: Order['status'],
  ): Promise<Order>;
  findAll(): Promise<Order[]>;
  findByCustomerId(customerId: string): Promise<Order[]>;
  findBestSellerProducts(limit: number): Promise<BestSellerProductStat[]>;
}
