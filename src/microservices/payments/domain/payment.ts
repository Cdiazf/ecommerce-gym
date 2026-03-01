export interface Payment {
  id: string;
  orderId: string;
  customerId: string;
  amount: number;
  method: 'AUTO' | 'YAPE';
  status: 'PENDING' | 'APPROVED' | 'FAILED' | 'EXPIRED';
  externalReference: string | null;
  operationCode: string | null;
  processedAt: string;
}
