export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface OrderShippingAddressSnapshot {
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
}

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  paymentMethod: 'AUTO' | 'YAPE';
  subtotalAmount: number;
  totalAmount: number;
  shippingAddress: OrderShippingAddressSnapshot;
  shippingCost: number;
  shippingCurrency: string;
  shippingServiceLevel: 'EXPRESS' | 'STANDARD';
  estimatedDeliveryDays: string;
  status: 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED';
  createdAt: string;
}
