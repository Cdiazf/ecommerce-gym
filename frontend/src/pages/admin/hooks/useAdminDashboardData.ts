import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../../shared/api';
import type {
  AdminOrdersByUser,
  AdminUser,
  Order,
  Payment,
  Product,
  ProductCategory,
  Shipment,
} from '../../../shared/types';
import type { InventoryItem } from '../types';

function escapeCsv(value: string | number | boolean | null | undefined): string {
  const raw = value == null ? '' : String(value);
  const escaped = raw.replace(/"/g, '""');
  return `"${escaped}"`;
}

function downloadCsv(filename: string, rows: string[][]): void {
  const content = rows.map((row) => row.map((cell) => escapeCsv(cell)).join(',')).join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function useAdminDashboardData(token: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [byUser, setByUser] = useState<AdminOrdersByUser[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ordersCustomerQuery, setOrdersCustomerQuery] = useState('');
  const [ordersStatusFilter, setOrdersStatusFilter] = useState<
    'all' | 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED'
  >('all');
  const [paymentsCustomerQuery, setPaymentsCustomerQuery] = useState('');
  const [paymentsStatusFilter, setPaymentsStatusFilter] = useState<
    'all' | 'PENDING' | 'APPROVED' | 'FAILED' | 'EXPIRED'
  >('all');
  const [paymentsMethodFilter, setPaymentsMethodFilter] = useState<'all' | 'AUTO' | 'YAPE'>('all');

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [allOrders, allPayments, allShipments, grouped, allUsers, allProducts, allInventory, allCategories] =
          await Promise.all([
            apiFetch<Order[]>('/admin/orders', { headers }),
            apiFetch<Payment[]>('/admin/payments', { headers }),
            apiFetch<Shipment[]>('/admin/shipments', { headers }),
            apiFetch<AdminOrdersByUser[]>('/admin/orders/by-user', { headers }),
            apiFetch<AdminUser[]>('/admin/users', { headers }),
            apiFetch<Product[]>('/products', { headers }),
            apiFetch<InventoryItem[]>('/inventory', { headers }),
            apiFetch<ProductCategory[]>('/catalog/categories', { headers }),
          ]);

        if (!ignore) {
          setOrders(allOrders);
          setPayments(allPayments);
          setShipments(allShipments);
          setByUser(grouped);
          setUsers(allUsers);
          setProducts(allProducts);
          setInventoryItems(allInventory);
          setCategories(allCategories);
        }
      } catch (dashboardError) {
        if (!ignore) {
          setError(String(dashboardError));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      ignore = true;
    };
  }, [token]);

  const totals = useMemo(() => {
    const totalOrders = orders.length;
    const uniqueCustomers = new Set(orders.map((order) => order.customerId)).size;
    const totalItems = orders.reduce(
      (acc, order) => acc + order.items.reduce((sum, item) => sum + item.quantity, 0),
      0,
    );
    const totalShipping = orders.reduce((acc, order) => acc + order.shippingCost, 0);
    const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);
    const totalPaymentsCaptured = payments
      .filter((payment) => payment.status === 'APPROVED')
      .reduce((acc, payment) => acc + payment.amount, 0);

    return {
      totalOrders,
      uniqueCustomers,
      totalItems,
      totalShipping,
      totalRevenue,
      totalPaymentsCaptured,
    };
  }, [orders, payments]);

  const filteredOrders = useMemo(() => {
    const normalizedCustomer = ordersCustomerQuery.trim().toLowerCase();

    return orders.filter((order) => {
      const customerMatch =
        normalizedCustomer.length === 0 ||
        order.customerId.toLowerCase().includes(normalizedCustomer);
      const statusMatch =
        ordersStatusFilter === 'all' || order.status === ordersStatusFilter;

      return customerMatch && statusMatch;
    });
  }, [orders, ordersCustomerQuery, ordersStatusFilter]);

  const filteredPayments = useMemo(() => {
    const normalizedCustomer = paymentsCustomerQuery.trim().toLowerCase();

    return payments.filter((payment) => {
      const customerMatch =
        normalizedCustomer.length === 0 ||
        payment.customerId.toLowerCase().includes(normalizedCustomer);
      const statusMatch =
        paymentsStatusFilter === 'all' || payment.status === paymentsStatusFilter;
      const methodMatch =
        paymentsMethodFilter === 'all' || payment.method === paymentsMethodFilter;

      return customerMatch && statusMatch && methodMatch;
    });
  }, [payments, paymentsCustomerQuery, paymentsStatusFilter, paymentsMethodFilter]);

  const reconciliation = useMemo(() => {
    const approvedPayments = payments.filter((payment) => payment.status === 'APPROVED');
    const paidOrders = orders.filter((order) => order.status === 'PAID');
    const approvedByOrderId = new Map(approvedPayments.map((payment) => [payment.orderId, payment]));
    const paidByOrderId = new Map(paidOrders.map((order) => [order.id, order]));

    const paidOrdersWithoutPayment = paidOrders.filter((order) => !approvedByOrderId.has(order.id));
    const approvedPaymentsWithoutOrder = approvedPayments.filter(
      (payment) => !paidByOrderId.has(payment.orderId),
    );
    const amountMismatches = paidOrders.filter((order) => {
      const payment = approvedByOrderId.get(order.id);
      if (!payment) {
        return false;
      }

      return Math.abs(payment.amount - order.totalAmount) > 0.009;
    });

    return {
      paidOrdersWithoutPayment,
      approvedPaymentsWithoutOrder,
      amountMismatches,
    };
  }, [orders, payments]);

  async function refreshProductsAndCategories() {
    const headers = { Authorization: `Bearer ${token}` };
    const [allProducts, allCategories] = await Promise.all([
      apiFetch<Product[]>('/products', { headers }),
      apiFetch<ProductCategory[]>('/catalog/categories', { headers }),
    ]);
    setProducts(allProducts);
    setCategories(allCategories);
  }

  async function refreshInventory() {
    const refreshed = await apiFetch<InventoryItem[]>('/inventory', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setInventoryItems(refreshed);
  }

  async function refreshShipments() {
    const refreshed = await apiFetch<Shipment[]>('/admin/shipments', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setShipments(refreshed);
  }

  function exportOrdersCsv(): void {
    downloadCsv('orders-export.csv', [
      [
        'order_id',
        'customer_id',
        'status',
        'payment_method',
        'subtotal_amount',
        'shipping_cost',
        'total_amount',
        'shipping_label',
        'shipping_city',
        'shipping_region',
        'created_at',
      ],
      ...orders.map((order) => [
        order.id,
        order.customerId,
        order.status,
        order.paymentMethod,
        order.subtotalAmount.toFixed(2),
        order.shippingCost.toFixed(2),
        order.totalAmount.toFixed(2),
        order.shippingAddress.label,
        order.shippingAddress.city,
        order.shippingAddress.region,
        order.createdAt,
      ]),
    ]);
  }

  function exportPaymentsCsv(): void {
    downloadCsv('payments-export.csv', [
      [
        'payment_id',
        'order_id',
        'customer_id',
        'method',
        'status',
        'amount',
        'external_reference',
        'operation_code',
        'processed_at',
      ],
      ...payments.map((payment) => [
        payment.id,
        payment.orderId,
        payment.customerId,
        payment.method,
        payment.status,
        payment.amount.toFixed(2),
        payment.externalReference ?? '',
        payment.operationCode ?? '',
        payment.processedAt,
      ]),
    ]);
  }

  return {
    orders,
    byUser,
    users,
    payments,
    shipments,
    products,
    inventoryItems,
    categories,
    loading,
    error,
    setError,
    setProducts,
    setInventoryItems,
    setCategories,
    totals,
    filteredOrders,
    filteredPayments,
    reconciliation,
    ordersCustomerQuery,
    setOrdersCustomerQuery,
    ordersStatusFilter,
    setOrdersStatusFilter,
    paymentsCustomerQuery,
    setPaymentsCustomerQuery,
    paymentsStatusFilter,
    setPaymentsStatusFilter,
    paymentsMethodFilter,
    setPaymentsMethodFilter,
    refreshProductsAndCategories,
    refreshInventory,
    refreshShipments,
    exportOrdersCsv,
    exportPaymentsCsv,
  };
}
