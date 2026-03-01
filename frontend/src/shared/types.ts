export type UserRole = 'ADMIN' | 'USER';

export type ProductCategory = {
  id: string;
  name: string;
  slug: string;
};

export type ProductPrice = {
  id: string;
  currency: string;
  listPrice: number;
  salePrice: number | null;
  startsAt: string | null;
  endsAt: string | null;
};

export type ProductVariant = {
  id: string;
  sku: string;
  color: string | null;
  size: string | null;
  material: string | null;
  barcode: string | null;
  weightGrams: number | null;
  status: string;
  prices: ProductPrice[];
  images: ProductImage[];
};

export type ProductImage = {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
  variantId: string | null;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  brand: string;
  slug: string;
  description: string | null;
  status?: string;
  categories: ProductCategory[];
  variants: ProductVariant[];
  images: ProductImage[];
};

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export type StoredCartItem = {
  productId: string;
  quantity: number;
  updatedAt: string;
};

export type CartResponse = {
  customerId: string;
  items: StoredCartItem[];
};

export type ShippingAddress = {
  id: string;
  userId: string;
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
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ShippingQuote = {
  addressId: string;
  serviceLevel: 'EXPRESS' | 'STANDARD';
  estimatedDeliveryDays: string;
  totalUnits: number;
  shippingCost: number;
  currency: string;
};

export type LoginResponse = {
  accessToken: string;
  expiresIn: number;
  role: UserRole;
};

export type RegisterResponse = {
  id: string;
  username: string;
  role: UserRole;
};

export type OrderItem = {
  productId: string;
  quantity: number;
};

export type Order = {
  id: string;
  customerId: string;
  items: OrderItem[];
  paymentMethod: 'AUTO' | 'YAPE';
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
  status: 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED';
  createdAt: string;
};

export type AdminOrdersByUser = {
  customerId: string;
  totalOrders: number;
  orders: string[];
};

export type AdminUser = {
  id: string;
  username: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type Payment = {
  id: string;
  orderId: string;
  customerId: string;
  amount: number;
  method: 'AUTO' | 'YAPE';
  status: 'PENDING' | 'APPROVED' | 'FAILED' | 'EXPIRED';
  externalReference: string | null;
  operationCode: string | null;
  processedAt: string;
};

export type Shipment = {
  id: string;
  orderId: string;
  paymentId: string;
  customerId: string;
  trackingCode: string;
  status: 'CREATED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';
  events: Array<{
    status: 'CREATED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';
    note: string;
    happenedAt: string;
  }>;
  createdAt: string;
};

export type StockItem = {
  productId: string;
  variantId: string | null;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  status: 'ACTIVE' | 'INACTIVE';
  isAvailable: boolean;
  updatedAt: string;
};
