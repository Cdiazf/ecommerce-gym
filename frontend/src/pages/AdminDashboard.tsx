import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../shared/api';
import type {
  AdminOrdersByUser,
  AdminUser,
  Order,
  Payment,
  Product,
  ProductCategory,
  Shipment,
} from '../shared/types';

type AdminDashboardProps = {
  token: string;
};

type InventoryItem = {
  productId: string;
  variantId: string | null;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  status: 'ACTIVE' | 'INACTIVE';
  isAvailable: boolean;
  updatedAt: string;
};

const shipmentFailurePresets = [
  'Customer unavailable',
  'Bad address',
  'Damaged package',
  'Carrier issue',
];

function getShipmentStatusBadgeClass(status: Shipment['status']): string {
  switch (status) {
    case 'DELIVERED':
      return 'text-bg-success';
    case 'IN_TRANSIT':
      return 'text-bg-info';
    case 'FAILED':
      return 'text-bg-danger';
    default:
      return 'text-bg-secondary';
  }
}

function getLatestShipmentNote(shipment: Shipment): string {
  return shipment.events[shipment.events.length - 1]?.note ?? '-';
}

function getShipmentActions(
  status: Shipment['status'],
): Array<{ label: string; nextStatus: Shipment['status']; variant: string }> {
  switch (status) {
    case 'CREATED':
      return [
        { label: 'Mark In Transit', nextStatus: 'IN_TRANSIT', variant: 'btn-outline-info' },
        { label: 'Report Failure', nextStatus: 'FAILED', variant: 'btn-outline-danger' },
      ];
    case 'IN_TRANSIT':
      return [
        { label: 'Mark Delivered', nextStatus: 'DELIVERED', variant: 'btn-outline-success' },
        { label: 'Report Failure', nextStatus: 'FAILED', variant: 'btn-outline-danger' },
      ];
    case 'FAILED':
      return [
        { label: 'Reopen Shipment', nextStatus: 'CREATED', variant: 'btn-outline-secondary' },
      ];
    default:
      return [];
  }
}

export function AdminDashboard(props: AdminDashboardProps) {
  const { token } = props;
  const [orders, setOrders] = useState<Order[]>([]);
  const [byUser, setByUser] = useState<AdminOrdersByUser[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [section, setSection] = useState<
    | 'dashboard'
    | 'orders'
    | 'payments'
    | 'shipments'
    | 'users'
    | 'products'
    | 'inventory'
    | 'categories'
    | 'variants'
    | 'prices'
    | 'images'
    | 'product-detail'
  >('dashboard');
  const [productForm, setProductForm] = useState({
    id: '',
    sku: '',
    name: '',
    slug: '',
    brand: '',
    description: '',
  });
  const [productMessage, setProductMessage] = useState('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [stockForm, setStockForm] = useState({
    productId: '',
    variantId: '',
    quantityOnHand: 0,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });
  const [stockMessage, setStockMessage] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [ordersCustomerQuery, setOrdersCustomerQuery] = useState('');
  const [ordersStatusFilter, setOrdersStatusFilter] = useState<
    'all' | 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED'
  >('all');
  const [paymentsCustomerQuery, setPaymentsCustomerQuery] = useState('');
  const [paymentsStatusFilter, setPaymentsStatusFilter] = useState<
    'all' | 'PENDING' | 'APPROVED' | 'FAILED' | 'EXPIRED'
  >('all');
  const [paymentsMethodFilter, setPaymentsMethodFilter] = useState<
    'all' | 'AUTO' | 'YAPE'
  >('all');
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [categoryMessage, setCategoryMessage] = useState('');
  const [variantMessage, setVariantMessage] = useState('');
  const [priceMessage, setPriceMessage] = useState('');
  const [imageMessage, setImageMessage] = useState('');
  const [categoryForm, setCategoryForm] = useState({
    id: '',
    name: '',
    slug: '',
  });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [variantForm, setVariantForm] = useState({
    id: '',
    productId: '',
    sku: '',
    color: '',
    size: '',
    material: '',
    barcode: '',
    weightGrams: 0,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [priceForm, setPriceForm] = useState({
    id: '',
    variantId: '',
    currency: 'USD',
    listPrice: 0,
    salePrice: 0,
    startsAt: '',
    endsAt: '',
  });
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [imageForm, setImageForm] = useState({
    id: '',
    productId: '',
    variantId: '',
    url: '',
    altText: '',
    sortOrder: 0,
    isPrimary: false,
  });
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [shipmentFailureModal, setShipmentFailureModal] = useState<{
    orderId: string;
    preset: string;
    customNote: string;
  } | null>(null);

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
          if (allProducts.length > 0) {
            setSelectedProductId((current) => current || allProducts[0].id);
          }
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
    const totalShipping = orders.reduce(
      (acc, order) => acc + order.shippingCost,
      0,
    );
    const totalRevenue = orders.reduce(
      (acc, order) => acc + order.totalAmount,
      0,
    );
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
    const approvedByOrderId = new Map(
      approvedPayments.map((payment) => [payment.orderId, payment]),
    );
    const paidByOrderId = new Map(paidOrders.map((order) => [order.id, order]));

    const paidOrdersWithoutPayment = paidOrders.filter(
      (order) => !approvedByOrderId.has(order.id),
    );
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

  const selectedProduct =
    products.find((product) => product.id === selectedProductId) ?? null;

  const selectedVariant =
    selectedProduct?.variants.find((variant) => variant.id === selectedVariantId) ?? null;

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

  async function refreshProductsAndCategories() {
    const headers = { Authorization: `Bearer ${token}` };
    const [allProducts, allCategories] = await Promise.all([
      apiFetch<Product[]>('/products', { headers }),
      apiFetch<ProductCategory[]>('/catalog/categories', { headers }),
    ]);
    setProducts(allProducts);
    setCategories(allCategories);
    if (allProducts.length > 0) {
      setSelectedProductId((current) => current || allProducts[0].id);
    }
  }

  async function handleUpdateShipmentStatus(
    orderId: string,
    status: Shipment['status'],
    note?: string,
  ) {
    setError('');

    try {
      await apiFetch<Shipment>(`/admin/shipments/${orderId}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          note: note?.trim() || undefined,
        }),
      });

      const refreshed = await apiFetch<Shipment[]>('/admin/shipments', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setShipments(refreshed);
    } catch (shipmentError) {
      setError(String(shipmentError));
    }
  }

  function openShipmentFailureModal(orderId: string): void {
    setShipmentFailureModal({
      orderId,
      preset: shipmentFailurePresets[0],
      customNote: '',
    });
  }

  function closeShipmentFailureModal(): void {
    setShipmentFailureModal(null);
  }

  async function handleConfirmShipmentFailure(): Promise<void> {
    if (!shipmentFailureModal) {
      return;
    }

    const detail = shipmentFailureModal.customNote.trim();
    const note = detail
      ? `${shipmentFailureModal.preset}: ${detail}`
      : shipmentFailureModal.preset;

    await handleUpdateShipmentStatus(shipmentFailureModal.orderId, 'FAILED', note);
    closeShipmentFailureModal();
  }

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProductMessage('');

    if (
      !productForm.id.trim() ||
      !productForm.sku.trim() ||
      !productForm.name.trim() ||
      !productForm.slug.trim() ||
      !productForm.brand.trim()
    ) {
      setProductMessage('Please complete required fields: id, sku, name, slug, brand.');
      return;
    }

    const isEdit = editingProductId !== null;

    try {
      if (isEdit) {
        await apiFetch(`/catalog/products/${editingProductId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sku: productForm.sku.trim(),
            name: productForm.name.trim(),
            slug: productForm.slug.trim(),
            brand: productForm.brand.trim(),
            description: productForm.description.trim() || null,
          }),
        });
      } else {
        await apiFetch('/catalog/products', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: productForm.id.trim(),
            sku: productForm.sku.trim(),
            name: productForm.name.trim(),
            slug: productForm.slug.trim(),
            brand: productForm.brand.trim(),
            description: productForm.description.trim() || null,
          }),
        });
      }

      const refreshed = await apiFetch<Product[]>('/products', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProducts(refreshed);
      setProductMessage(
        isEdit ? 'Product updated successfully.' : 'Product created successfully.',
      );
      setEditingProductId(null);
      setProductForm({
        id: '',
        sku: '',
        name: '',
        slug: '',
        brand: '',
        description: '',
      });
    } catch (createError) {
      setProductMessage(String(createError));
    }
  }

  async function handleCreateOrUpdateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCategoryMessage('');

    if (!categoryForm.id.trim() || !categoryForm.name.trim() || !categoryForm.slug.trim()) {
      setCategoryMessage('Please complete required fields: id, name and slug.');
      return;
    }

    try {
      if (editingCategoryId) {
        await apiFetch(`/catalog/categories/${editingCategoryId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            name: categoryForm.name.trim(),
            slug: categoryForm.slug.trim(),
          }),
        });
      } else {
        await apiFetch('/catalog/categories', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            id: categoryForm.id.trim(),
            name: categoryForm.name.trim(),
            slug: categoryForm.slug.trim(),
          }),
        });
      }

      await refreshProductsAndCategories();
      setCategoryMessage(
        editingCategoryId ? 'Category updated successfully.' : 'Category created successfully.',
      );
      setEditingCategoryId(null);
      setCategoryForm({ id: '', name: '', slug: '' });
    } catch (categoryError) {
      setCategoryMessage(String(categoryError));
    }
  }

  async function handleDeleteCategory(categoryId: string) {
    setCategoryMessage('');
    try {
      await apiFetch(`/catalog/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await refreshProductsAndCategories();
      setCategoryMessage('Category deleted successfully.');
    } catch (categoryError) {
      setCategoryMessage(String(categoryError));
    }
  }

  async function handleAssignCategory(categoryId: string) {
    if (!selectedProductId) {
      setCategoryMessage('Select a product first.');
      return;
    }
    setCategoryMessage('');
    try {
      await apiFetch(`/catalog/products/${selectedProductId}/categories`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ categoryId }),
      });
      await refreshProductsAndCategories();
      setCategoryMessage('Category assigned to product.');
    } catch (categoryError) {
      setCategoryMessage(String(categoryError));
    }
  }

  async function handleUnassignCategory(categoryId: string) {
    if (!selectedProductId) {
      setCategoryMessage('Select a product first.');
      return;
    }
    setCategoryMessage('');
    try {
      await apiFetch(`/catalog/products/${selectedProductId}/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await refreshProductsAndCategories();
      setCategoryMessage('Category unassigned from product.');
    } catch (categoryError) {
      setCategoryMessage(String(categoryError));
    }
  }

  async function handleCreateOrUpdateVariant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVariantMessage('');

    const productId = variantForm.productId.trim() || selectedProductId;
    if (!productId || !variantForm.id.trim() || !variantForm.sku.trim()) {
      setVariantMessage('Please complete required fields: product, id, sku.');
      return;
    }

    try {
      if (editingVariantId) {
        await apiFetch(`/catalog/variants/${editingVariantId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            sku: variantForm.sku.trim(),
            color: variantForm.color.trim() || null,
            size: variantForm.size.trim() || null,
            material: variantForm.material.trim() || null,
            barcode: variantForm.barcode.trim() || null,
            weightGrams: Number(variantForm.weightGrams),
            status: variantForm.status,
          }),
        });
      } else {
        await apiFetch('/catalog/variants', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            id: variantForm.id.trim(),
            productId,
            sku: variantForm.sku.trim(),
            color: variantForm.color.trim() || null,
            size: variantForm.size.trim() || null,
            material: variantForm.material.trim() || null,
            barcode: variantForm.barcode.trim() || null,
            weightGrams: Number(variantForm.weightGrams),
            status: variantForm.status,
          }),
        });
      }

      await refreshProductsAndCategories();
      setVariantMessage(
        editingVariantId ? 'Variant updated successfully.' : 'Variant created successfully.',
      );
      setEditingVariantId(null);
      setVariantForm({
        id: '',
        productId,
        sku: '',
        color: '',
        size: '',
        material: '',
        barcode: '',
        weightGrams: 0,
        status: 'ACTIVE',
      });
    } catch (variantError) {
      setVariantMessage(String(variantError));
    }
  }

  async function handleDeleteVariant(variantId: string) {
    setVariantMessage('');
    try {
      await apiFetch(`/catalog/variants/${variantId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await refreshProductsAndCategories();
      setVariantMessage('Variant deleted successfully.');
    } catch (variantError) {
      setVariantMessage(String(variantError));
    }
  }

  async function handleCreateOrUpdatePrice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPriceMessage('');
    if (!priceForm.id.trim() || !priceForm.variantId.trim() || !priceForm.currency.trim()) {
      setPriceMessage('Please complete required fields: id, variantId, currency.');
      return;
    }

    try {
      if (editingPriceId) {
        await apiFetch(`/catalog/prices/${editingPriceId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            currency: priceForm.currency.trim(),
            listPrice: Number(priceForm.listPrice),
            salePrice: Number(priceForm.salePrice) || null,
            startsAt: priceForm.startsAt || null,
            endsAt: priceForm.endsAt || null,
          }),
        });
      } else {
        await apiFetch('/catalog/prices', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            id: priceForm.id.trim(),
            variantId: priceForm.variantId.trim(),
            currency: priceForm.currency.trim(),
            listPrice: Number(priceForm.listPrice),
            salePrice: Number(priceForm.salePrice) || null,
            startsAt: priceForm.startsAt || null,
            endsAt: priceForm.endsAt || null,
          }),
        });
      }

      await refreshProductsAndCategories();
      setPriceMessage(editingPriceId ? 'Price updated successfully.' : 'Price created successfully.');
      setEditingPriceId(null);
      setPriceForm({
        id: '',
        variantId: priceForm.variantId,
        currency: 'USD',
        listPrice: 0,
        salePrice: 0,
        startsAt: '',
        endsAt: '',
      });
    } catch (priceError) {
      setPriceMessage(String(priceError));
    }
  }

  async function handleDeletePrice(priceId: string) {
    setPriceMessage('');
    try {
      await apiFetch(`/catalog/prices/${priceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await refreshProductsAndCategories();
      setPriceMessage('Price deleted successfully.');
    } catch (priceError) {
      setPriceMessage(String(priceError));
    }
  }

  async function handleCreateOrUpdateImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setImageMessage('');
    if (!imageForm.id.trim() || !imageForm.productId.trim() || !imageForm.url.trim()) {
      setImageMessage('Please complete required fields: id, productId, url.');
      return;
    }

    try {
      if (editingImageId) {
        await apiFetch(`/catalog/images/${editingImageId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            url: imageForm.url.trim(),
            altText: imageForm.altText.trim() || null,
            sortOrder: Number(imageForm.sortOrder),
            isPrimary: imageForm.isPrimary,
            variantId: imageForm.variantId.trim() || null,
          }),
        });
      } else {
        await apiFetch('/catalog/images', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            id: imageForm.id.trim(),
            productId: imageForm.productId.trim(),
            variantId: imageForm.variantId.trim() || null,
            url: imageForm.url.trim(),
            altText: imageForm.altText.trim() || null,
            sortOrder: Number(imageForm.sortOrder),
            isPrimary: imageForm.isPrimary,
          }),
        });
      }

      await refreshProductsAndCategories();
      setImageMessage(editingImageId ? 'Image updated successfully.' : 'Image created successfully.');
      setEditingImageId(null);
      setImageForm({
        id: '',
        productId: imageForm.productId,
        variantId: '',
        url: '',
        altText: '',
        sortOrder: 0,
        isPrimary: false,
      });
    } catch (imageError) {
      setImageMessage(String(imageError));
    }
  }

  async function handleDeleteImage(imageId: string) {
    setImageMessage('');
    try {
      await apiFetch(`/catalog/images/${imageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await refreshProductsAndCategories();
      setImageMessage('Image deleted successfully.');
    } catch (imageError) {
      setImageMessage(String(imageError));
    }
  }

  async function handleUpsertStock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStockMessage('');

    if (!stockForm.productId.trim()) {
      setStockMessage('Please choose a product.');
      return;
    }

    if (stockForm.quantityOnHand < 0) {
      setStockMessage('Quantity on hand cannot be negative.');
      return;
    }

    try {
      await apiFetch('/inventory/stock', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: stockForm.productId.trim(),
          variantId: stockForm.variantId.trim() || null,
          quantityOnHand: Number(stockForm.quantityOnHand),
          status: stockForm.status,
        }),
      });

      const refreshed = await apiFetch<InventoryItem[]>('/inventory', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setInventoryItems(refreshed);
      setStockMessage('Stock updated successfully.');
      setStockForm((current) => ({
        ...current,
        quantityOnHand: 0,
      }));
    } catch (upsertError) {
      setStockMessage(String(upsertError));
    }
  }

  async function handleDeleteProduct(productId: string) {
    setProductMessage('');

    try {
      await apiFetch(`/catalog/products/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const refreshed = await apiFetch<Product[]>('/products', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProducts(refreshed);
      if (editingProductId === productId) {
        setEditingProductId(null);
        setProductForm({
          id: '',
          sku: '',
          name: '',
          slug: '',
          brand: '',
          description: '',
        });
      }
      setProductMessage('Product deleted successfully.');
    } catch (deleteError) {
      setProductMessage(String(deleteError));
    }
  }

  function handleEditProduct(product: Product) {
    setSection('products');
    setEditingProductId(product.id);
    setProductMessage('');
    setProductForm({
      id: product.id,
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      description: product.description ?? '',
    });
  }

  function handleEditStock(item: InventoryItem) {
    setSection('inventory');
    setStockMessage('');
    setStockForm({
      productId: item.productId,
      variantId: item.variantId ?? '',
      quantityOnHand: item.quantityOnHand,
      status: item.status,
    });
  }

  async function handleDeleteStockItem(item: InventoryItem) {
    setStockMessage('');

    try {
      await apiFetch('/inventory/stock', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: item.productId,
          variantId: item.variantId,
        }),
      });

      const refreshed = await apiFetch<InventoryItem[]>('/inventory', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setInventoryItems(refreshed);
      setStockMessage('Stock item deleted successfully.');
    } catch (deleteError) {
      setStockMessage(String(deleteError));
    }
  }

  return (
    <main className="container py-5">
      <div className="row g-4">
        <aside className="col-lg-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h2 className="h6 mb-3">Admin Panel</h2>
              <div className="d-grid gap-2">
                <button
                  type="button"
                  className={`btn btn-sm ${
                    section === 'dashboard' ? 'btn-dark' : 'btn-outline-dark'
                  }`}
                  onClick={() => setSection('dashboard')}
                >
                  Admin Dashboard
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${
                    section === 'orders' ? 'btn-dark' : 'btn-outline-dark'
                  }`}
                  onClick={() => setSection('orders')}
                >
                  Orders
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${
                    section === 'payments' ? 'btn-dark' : 'btn-outline-dark'
                  }`}
                  onClick={() => setSection('payments')}
                >
                  Payments
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${
                    section === 'shipments' ? 'btn-dark' : 'btn-outline-dark'
                  }`}
                  onClick={() => setSection('shipments')}
                >
                  Shipments
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${
                    section === 'users' ? 'btn-dark' : 'btn-outline-dark'
                  }`}
                  onClick={() => setSection('users')}
                >
                  Users
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${
                    section === 'products' ? 'btn-dark' : 'btn-outline-dark'
                  }`}
                  onClick={() => setSection('products')}
                >
                  Products
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${
                    section === 'categories' ? 'btn-dark' : 'btn-outline-dark'
                  }`}
                  onClick={() => setSection('categories')}
                >
                  Categories
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${
                    section === 'variants' ? 'btn-dark' : 'btn-outline-dark'
                  }`}
                  onClick={() => setSection('variants')}
                >
                  Variants
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${
                    section === 'prices' ? 'btn-dark' : 'btn-outline-dark'
                  }`}
                  onClick={() => setSection('prices')}
                >
                  Prices
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${
                    section === 'images' ? 'btn-dark' : 'btn-outline-dark'
                  }`}
                  onClick={() => setSection('images')}
                >
                  Images
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${
                    section === 'product-detail' ? 'btn-dark' : 'btn-outline-dark'
                  }`}
                  onClick={() => setSection('product-detail')}
                >
                  Product Detail
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${
                    section === 'inventory' ? 'btn-dark' : 'btn-outline-dark'
                  }`}
                  onClick={() => setSection('inventory')}
                >
                  Inventory
                </button>
              </div>
            </div>
          </div>
        </aside>

        <section className="col-lg-9">
          {section === 'dashboard' && (
            <>
              <section className="mb-4">
                <h1 className="h3 mb-1">Admin Dashboard</h1>
                <p className="text-secondary mb-0">
                  Orders overview and customer activity.
                </p>
              </section>

              {loading && <div className="alert alert-info">Loading dashboard...</div>}
              {error && <div className="alert alert-danger">{error}</div>}

              {!loading && !error && (
                <>
                  <section className="row g-3 mb-4">
                    <div className="col-md-3">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                          <p className="text-secondary small mb-1">Total orders</p>
                          <h2 className="h4 mb-0">{totals.totalOrders}</h2>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                          <p className="text-secondary small mb-1">Unique customers</p>
                          <h2 className="h4 mb-0">{totals.uniqueCustomers}</h2>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                          <p className="text-secondary small mb-1">Items sold</p>
                          <h2 className="h4 mb-0">{totals.totalItems}</h2>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                          <p className="text-secondary small mb-1">Shipping collected</p>
                          <h2 className="h4 mb-0">${totals.totalShipping.toFixed(2)}</h2>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                          <p className="text-secondary small mb-1">Gross revenue</p>
                          <h2 className="h4 mb-0">${totals.totalRevenue.toFixed(2)}</h2>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                          <p className="text-secondary small mb-1">Merchandise subtotal</p>
                          <h2 className="h4 mb-0">
                            ${(totals.totalRevenue - totals.totalShipping).toFixed(2)}
                          </h2>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                          <div>
                            <p className="text-secondary small mb-1">Approved payments captured</p>
                            <h2 className="h4 mb-0">
                              ${totals.totalPaymentsCaptured.toFixed(2)}
                            </h2>
                          </div>
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-dark"
                              onClick={exportOrdersCsv}
                            >
                              Export Orders CSV
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-dark"
                              onClick={exportPaymentsCsv}
                            >
                              Export Payments CSV
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                          <p className="text-secondary small mb-2">Reconciliation</p>
                          <div className="row g-3">
                            <div className="col-md-4">
                              <div className="border rounded-3 p-3 h-100">
                                <div className="small text-secondary">
                                  Paid orders without approved payment
                                </div>
                                <div className="h5 mb-0">
                                  {reconciliation.paidOrdersWithoutPayment.length}
                                </div>
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="border rounded-3 p-3 h-100">
                                <div className="small text-secondary">
                                  Approved payments without paid order
                                </div>
                                <div className="h5 mb-0">
                                  {reconciliation.approvedPaymentsWithoutOrder.length}
                                </div>
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="border rounded-3 p-3 h-100">
                                <div className="small text-secondary">Amount mismatches</div>
                                <div className="h5 mb-0">
                                  {reconciliation.amountMismatches.length}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="card border-0 shadow-sm mb-4">
                    <div className="card-body">
                      <h2 className="h5 mb-3">Orders by user</h2>
                      <div className="table-responsive">
                        <table className="table table-sm align-middle mb-0">
                          <thead>
                            <tr>
                              <th>Customer</th>
                              <th>Total Orders</th>
                              <th>Order IDs</th>
                            </tr>
                          </thead>
                          <tbody>
                            {byUser.map((item) => (
                              <tr key={item.customerId}>
                                <td>{item.customerId}</td>
                                <td>{item.totalOrders}</td>
                                <td className="small text-secondary">
                                  {item.orders.join(', ')}
                                </td>
                              </tr>
                            ))}
                            {byUser.length === 0 && (
                              <tr>
                                <td colSpan={3} className="text-secondary">
                                  No orders found.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>

                  <section className="card border-0 shadow-sm">
                    <div className="card-body">
                      <h2 className="h5 mb-3">Latest orders</h2>
                      <div className="table-responsive">
                        <table className="table align-middle mb-0">
                          <thead>
                            <tr>
                              <th>Order</th>
                              <th>Customer</th>
                              <th>Status</th>
                              <th>Payment</th>
                              <th>Items</th>
                              <th>Shipping</th>
                              <th>Total</th>
                              <th>Created</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.map((order) => (
                              <tr key={order.id}>
                                <td className="small">{order.id}</td>
                                <td>{order.customerId}</td>
                                <td>
                                  <span className="badge text-bg-primary">
                                    {order.status}
                                  </span>
                                </td>
                                <td>{order.paymentMethod}</td>
                                <td>
                                  {order.items.reduce(
                                    (sum, item) => sum + item.quantity,
                                    0,
                                  )}
                                </td>
                                <td>
                                  <div className="small">
                                    <div>{order.shippingAddress.label}</div>
                                    <div className="text-secondary">
                                      {order.shippingCurrency} {order.shippingCost.toFixed(2)}
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  {order.shippingCurrency} {order.totalAmount.toFixed(2)}
                                </td>
                                <td>{new Date(order.createdAt).toLocaleString()}</td>
                              </tr>
                            ))}
                            {orders.length === 0 && (
                              <tr>
                                <td colSpan={8} className="text-secondary">
                                  No orders found.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                </>
              )}
            </>
          )}

          {section === 'payments' && (
            <>
              <section className="mb-4">
                <div className="d-flex flex-column flex-md-row justify-content-between gap-3 align-items-md-center">
                  <div>
                    <h1 className="h3 mb-1">Payments</h1>
                    <p className="text-secondary mb-0">
                      View payment status, method and captured amount by order.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-dark"
                    onClick={exportPaymentsCsv}
                  >
                    Export Payments CSV
                  </button>
                </div>
              </section>

              {loading && <div className="alert alert-info">Loading payments...</div>}
              {error && <div className="alert alert-danger">{error}</div>}

              {!loading && !error && (
                <section className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="row g-3 mb-3">
                      <div className="col-md-4">
                        <label className="form-label mb-1">Search by customerId</label>
                        <input
                          className="form-control"
                          placeholder="customer-001"
                          value={paymentsCustomerQuery}
                          onChange={(event) => setPaymentsCustomerQuery(event.target.value)}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label mb-1">Status</label>
                        <select
                          className="form-select"
                          value={paymentsStatusFilter}
                          onChange={(event) =>
                            setPaymentsStatusFilter(
                              event.target.value as
                                | 'all'
                                | 'PENDING'
                                | 'APPROVED'
                                | 'FAILED'
                                | 'EXPIRED',
                            )
                          }
                        >
                          <option value="all">All</option>
                          <option value="PENDING">PENDING</option>
                          <option value="APPROVED">APPROVED</option>
                          <option value="FAILED">FAILED</option>
                          <option value="EXPIRED">EXPIRED</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label mb-1">Method</label>
                        <select
                          className="form-select"
                          value={paymentsMethodFilter}
                          onChange={(event) =>
                            setPaymentsMethodFilter(
                              event.target.value as 'all' | 'AUTO' | 'YAPE',
                            )
                          }
                        >
                          <option value="all">All</option>
                          <option value="AUTO">AUTO</option>
                          <option value="YAPE">YAPE</option>
                        </select>
                      </div>
                    </div>

                    <div className="alert alert-secondary small">
                      <div>
                        Paid orders without approved payment:{' '}
                        {reconciliation.paidOrdersWithoutPayment.length}
                      </div>
                      <div>
                        Approved payments without paid order:{' '}
                        {reconciliation.approvedPaymentsWithoutOrder.length}
                      </div>
                      <div>
                        Amount mismatches: {reconciliation.amountMismatches.length}
                      </div>
                    </div>

                    <div className="table-responsive">
                      <table className="table align-middle mb-0">
                        <thead>
                          <tr>
                            <th>Payment ID</th>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Method</th>
                            <th>Status</th>
                            <th>Amount</th>
                            <th>Reference</th>
                            <th>Processed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPayments.map((payment) => (
                            <tr key={payment.id}>
                              <td className="small">{payment.id}</td>
                              <td className="small">{payment.orderId}</td>
                              <td>{payment.customerId}</td>
                              <td>{payment.method}</td>
                              <td>
                                <span className="badge text-bg-primary">
                                  {payment.status}
                                </span>
                              </td>
                              <td>${payment.amount.toFixed(2)}</td>
                              <td className="small text-secondary">
                                {payment.operationCode ??
                                  payment.externalReference ??
                                  '-'}
                              </td>
                              <td>{new Date(payment.processedAt).toLocaleString()}</td>
                            </tr>
                          ))}
                          {filteredPayments.length === 0 && (
                            <tr>
                              <td colSpan={8} className="text-secondary">
                                No payments found with current filters.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}

          {section === 'shipments' && (
            <>
              <section className="mb-4">
                <h1 className="h3 mb-1">Shipments</h1>
                <p className="text-secondary mb-0">
                  Update shipping lifecycle and tracking progress.
                </p>
              </section>

              {loading && <div className="alert alert-info">Loading shipments...</div>}
              {error && <div className="alert alert-danger">{error}</div>}

              {!loading && !error && (
                <section className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table align-middle mb-0">
                        <thead>
                          <tr>
                            <th>Shipment ID</th>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Tracking</th>
                            <th>Status</th>
                            <th>Latest Event</th>
                            <th>Created</th>
                            <th>Update</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shipments.map((shipment) => (
                            <tr key={shipment.id}>
                              <td className="small">{shipment.id}</td>
                              <td className="small">{shipment.orderId}</td>
                              <td>{shipment.customerId}</td>
                              <td>{shipment.trackingCode}</td>
                              <td>
                                <span
                                  className={`badge ${getShipmentStatusBadgeClass(
                                    shipment.status,
                                  )}`}
                                >
                                  {shipment.status}
                                </span>
                              </td>
                              <td className="small text-secondary">
                                {getLatestShipmentNote(shipment)}
                              </td>
                              <td>{new Date(shipment.createdAt).toLocaleString()}</td>
                              <td style={{ width: 220 }}>
                                <div className="d-flex flex-wrap gap-2">
                                  {getShipmentActions(shipment.status).map((action) => (
                                    <button
                                      key={`${shipment.id}-${action.nextStatus}`}
                                      type="button"
                                      className={`btn btn-sm ${action.variant}`}
                                      onClick={() =>
                                        action.nextStatus === 'FAILED'
                                          ? openShipmentFailureModal(shipment.orderId)
                                          : void handleUpdateShipmentStatus(
                                              shipment.orderId,
                                              action.nextStatus,
                                            )
                                      }
                                    >
                                      {action.label}
                                    </button>
                                  ))}
                                  {shipment.status === 'DELIVERED' && (
                                    <span className="small text-secondary">Completed</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {shipments.length === 0 && (
                            <tr>
                              <td colSpan={8} className="text-secondary">
                                No shipments found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}

          {shipmentFailureModal && (
            <div
              className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', zIndex: 1080 }}
            >
              <div className="card border-0 shadow-lg" style={{ width: 'min(92vw, 520px)' }}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h2 className="h5 mb-1">Mark Shipment as Failed</h2>
                      <p className="text-secondary small mb-0">
                        Provide a clear reason for support and customer tracking.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-close"
                      aria-label="Close"
                      onClick={closeShipmentFailureModal}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Failure reason</label>
                    <select
                      className="form-select"
                      value={shipmentFailureModal.preset}
                      onChange={(event) =>
                        setShipmentFailureModal((current) =>
                          current
                            ? {
                                ...current,
                                preset: event.target.value,
                              }
                            : current,
                        )
                      }
                    >
                      {shipmentFailurePresets.map((preset) => (
                        <option key={preset} value={preset}>
                          {preset}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="form-label">Additional detail</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Optional details for operations and customer support."
                      value={shipmentFailureModal.customNote}
                      onChange={(event) =>
                        setShipmentFailureModal((current) =>
                          current
                            ? {
                                ...current,
                                customNote: event.target.value,
                              }
                            : current,
                        )
                      }
                    />
                  </div>

                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={closeShipmentFailureModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => void handleConfirmShipmentFailure()}
                    >
                      Mark Failed
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {section === 'users' && (
            <>
              <section className="mb-4">
                <h1 className="h3 mb-1">Users</h1>
                <p className="text-secondary mb-0">
                  Registered users and assigned roles.
                </p>
              </section>

              {loading && <div className="alert alert-info">Loading users...</div>}
              {error && <div className="alert alert-danger">{error}</div>}

              {!loading && !error && (
                <section className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table align-middle mb-0">
                        <thead>
                          <tr>
                            <th>Username</th>
                            <th>Role</th>
                            <th>Created</th>
                            <th>Updated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user.id}>
                              <td>{user.username}</td>
                              <td>
                                <span
                                  className={`badge ${
                                    user.role === 'ADMIN'
                                      ? 'text-bg-dark'
                                      : 'text-bg-secondary'
                                  }`}
                                >
                                  {user.role}
                                </span>
                              </td>
                              <td>{new Date(user.createdAt).toLocaleString()}</td>
                              <td>{new Date(user.updatedAt).toLocaleString()}</td>
                            </tr>
                          ))}
                          {users.length === 0 && (
                            <tr>
                              <td colSpan={4} className="text-secondary">
                                No users found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}

          {section === 'orders' && (
            <>
              <section className="mb-4">
                <div className="d-flex flex-column flex-md-row justify-content-between gap-3 align-items-md-center">
                  <div>
                    <h1 className="h3 mb-1">Orders</h1>
                    <p className="text-secondary mb-0">
                      View all orders, owner and line-item details.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-dark"
                    onClick={exportOrdersCsv}
                  >
                    Export Orders CSV
                  </button>
                </div>
              </section>

              {loading && <div className="alert alert-info">Loading orders...</div>}
              {error && <div className="alert alert-danger">{error}</div>}

              {!loading && !error && (
                <div className="row g-4">
                  <div className="col-lg-8">
                    <section className="card border-0 shadow-sm">
                      <div className="card-body">
                        <div className="row g-3 mb-3">
                          <div className="col-md-7">
                            <label className="form-label mb-1">Search by customerId</label>
                            <input
                              className="form-control"
                              placeholder="customer-001"
                              value={ordersCustomerQuery}
                              onChange={(event) =>
                                setOrdersCustomerQuery(event.target.value)
                              }
                            />
                          </div>
                          <div className="col-md-5">
                            <label className="form-label mb-1">Status</label>
                            <select
                              className="form-select"
                              value={ordersStatusFilter}
                              onChange={(event) =>
                                setOrdersStatusFilter(
                                  event.target.value as
                                    | 'all'
                                    | 'PENDING_PAYMENT'
                                    | 'PAID'
                                    | 'CANCELLED',
                                )
                              }
                            >
                              <option value="all">All</option>
                              <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                              <option value="PAID">PAID</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          </div>
                        </div>
                        <div className="table-responsive">
                          <table className="table align-middle mb-0">
                            <thead>
                              <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Status</th>
                                <th>Payment</th>
                                <th>Items</th>
                                <th>Shipping</th>
                                <th>Total</th>
                                <th>Created</th>
                                <th style={{ width: 120 }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredOrders.map((order) => (
                                <tr key={order.id}>
                                  <td className="small">{order.id}</td>
                                  <td>{order.customerId}</td>
                                  <td>
                                    <span className="badge text-bg-primary">
                                      {order.status}
                                    </span>
                                  </td>
                                  <td>{order.paymentMethod}</td>
                                  <td>
                                    {order.items.reduce(
                                      (sum, item) => sum + item.quantity,
                                      0,
                                    )}
                                  </td>
                                  <td>
                                    <div className="small">
                                      <div>{order.shippingAddress.label}</div>
                                      <div className="text-secondary">
                                        {order.shippingCurrency} {order.shippingCost.toFixed(2)}
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    {order.shippingCurrency} {order.totalAmount.toFixed(2)}
                                  </td>
                                  <td>{new Date(order.createdAt).toLocaleString()}</td>
                                  <td>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-dark"
                                      onClick={() => setSelectedOrder(order)}
                                    >
                                      Details
                                    </button>
                                  </td>
                                </tr>
                              ))}
                              {filteredOrders.length === 0 && (
                                <tr>
                                  <td colSpan={9} className="text-secondary">
                                    No orders found with current filters.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="col-lg-4">
                    <section className="card border-0 shadow-sm">
                      <div className="card-body">
                        <h2 className="h5 mb-3">Order detail</h2>
                        {!selectedOrder && (
                          <p className="text-secondary mb-0">
                            Select an order to see details.
                          </p>
                        )}
                        {selectedOrder && (
                          <>
                            <p className="mb-1">
                              <strong>Order:</strong>{' '}
                              <span className="small">{selectedOrder.id}</span>
                            </p>
                            <p className="mb-1">
                              <strong>Customer:</strong> {selectedOrder.customerId}
                            </p>
                            <p className="mb-1">
                              <strong>Status:</strong> {selectedOrder.status}
                            </p>
                            <p className="mb-1">
                              <strong>Payment:</strong> {selectedOrder.paymentMethod}
                            </p>
                            <p className="mb-3">
                              <strong>Created:</strong>{' '}
                              {new Date(selectedOrder.createdAt).toLocaleString()}
                            </p>
                            <div className="mb-3 small">
                              <p className="mb-1">
                                <strong>Subtotal:</strong> {selectedOrder.shippingCurrency}{' '}
                                {selectedOrder.subtotalAmount.toFixed(2)}
                              </p>
                              <p className="mb-1">
                                <strong>Shipping:</strong> {selectedOrder.shippingServiceLevel} ·{' '}
                                {selectedOrder.shippingCurrency} {selectedOrder.shippingCost.toFixed(2)}
                              </p>
                              <p className="mb-1">
                                <strong>Total:</strong> {selectedOrder.shippingCurrency}{' '}
                                {selectedOrder.totalAmount.toFixed(2)}
                              </p>
                              <p className="mb-1">
                                <strong>ETA:</strong> {selectedOrder.estimatedDeliveryDays} days
                              </p>
                              <p className="mb-1">
                                <strong>Address:</strong> {selectedOrder.shippingAddress.label}
                              </p>
                              <p className="mb-1">
                                {selectedOrder.shippingAddress.recipientName} ·{' '}
                                {selectedOrder.shippingAddress.phone}
                              </p>
                              <p className="mb-1">
                                {selectedOrder.shippingAddress.line1}
                              </p>
                              <p className="mb-0 text-secondary">
                                {selectedOrder.shippingAddress.district},{' '}
                                {selectedOrder.shippingAddress.city},{' '}
                                {selectedOrder.shippingAddress.region}
                              </p>
                            </div>
                            <h3 className="h6">Items</h3>
                            <ul className="list-group list-group-flush">
                              {selectedOrder.items.map((item, index) => (
                                <li
                                  key={`${selectedOrder.id}-${item.productId}-${index}`}
                                  className="list-group-item px-0 d-flex justify-content-between"
                                >
                                  <span>{item.productId}</span>
                                  <span>x{item.quantity}</span>
                                </li>
                              ))}
                              {selectedOrder.items.length === 0 && (
                                <li className="list-group-item px-0 text-secondary">
                                  No items found.
                                </li>
                              )}
                            </ul>
                          </>
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              )}
            </>
          )}

          {section === 'products' && (
            <>
              <section className="mb-4">
                <h1 className="h3 mb-1">Products</h1>
                <p className="text-secondary mb-0">
                  Create new catalog products and review current items.
                </p>
              </section>

              <section className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                  <h2 className="h5 mb-3">
                    {editingProductId ? 'Edit product' : 'Create product'}
                  </h2>
                  <form onSubmit={handleCreateProduct}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">ID *</label>
                        <input
                          className="form-control"
                          value={productForm.id}
                          disabled={editingProductId !== null}
                          onChange={(event) =>
                            setProductForm((current) => ({
                              ...current,
                              id: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">SKU *</label>
                        <input
                          className="form-control"
                          value={productForm.sku}
                          onChange={(event) =>
                            setProductForm((current) => ({
                              ...current,
                              sku: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Name *</label>
                        <input
                          className="form-control"
                          value={productForm.name}
                          onChange={(event) =>
                            setProductForm((current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Slug *</label>
                        <input
                          className="form-control"
                          value={productForm.slug}
                          onChange={(event) =>
                            setProductForm((current) => ({
                              ...current,
                              slug: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Brand *</label>
                        <input
                          className="form-control"
                          value={productForm.brand}
                          onChange={(event) =>
                            setProductForm((current) => ({
                              ...current,
                              brand: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Description</label>
                        <input
                          className="form-control"
                          value={productForm.description}
                          onChange={(event) =>
                            setProductForm((current) => ({
                              ...current,
                              description: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="mt-3 d-flex gap-2">
                      <button type="submit" className="btn btn-dark">
                        {editingProductId ? 'Update product' : 'Create product'}
                      </button>
                      {editingProductId && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            setEditingProductId(null);
                            setProductForm({
                              id: '',
                              sku: '',
                              name: '',
                              slug: '',
                              brand: '',
                              description: '',
                            });
                          }}
                        >
                          Cancel edit
                        </button>
                      )}
                    </div>
                  </form>
                  {productMessage && (
                    <div className="alert alert-info mt-3 mb-0">{productMessage}</div>
                  )}
                </div>
              </section>

              <section className="card border-0 shadow-sm">
                <div className="card-body">
                  <h2 className="h5 mb-3">Current products</h2>
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Brand</th>
                          <th>Slug</th>
                          <th>Variants</th>
                          <th style={{ width: 180 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <tr key={product.id}>
                            <td className="small">{product.id}</td>
                            <td>{product.name}</td>
                            <td>{product.brand}</td>
                            <td>{product.slug}</td>
                            <td>{product.variants.length}</td>
                            <td>
                              <div className="d-flex gap-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-dark"
                                  onClick={() => handleEditProduct(product)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDeleteProduct(product.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {products.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-secondary">
                              No products found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </>
          )}

          {section === 'categories' && (
            <>
              <section className="mb-4">
                <h1 className="h3 mb-1">Categories</h1>
                <p className="text-secondary mb-0">CRUD for product categories.</p>
              </section>

              <section className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                  <h2 className="h5 mb-3">
                    {editingCategoryId ? 'Edit category' : 'Create category'}
                  </h2>
                  <form onSubmit={handleCreateOrUpdateCategory} className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label">ID *</label>
                      <input
                        className="form-control"
                        value={categoryForm.id}
                        disabled={editingCategoryId !== null}
                        onChange={(event) =>
                          setCategoryForm((current) => ({
                            ...current,
                            id: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Name *</label>
                      <input
                        className="form-control"
                        value={categoryForm.name}
                        onChange={(event) =>
                          setCategoryForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Slug *</label>
                      <input
                        className="form-control"
                        value={categoryForm.slug}
                        onChange={(event) =>
                          setCategoryForm((current) => ({
                            ...current,
                            slug: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="col-12 d-flex gap-2">
                      <button className="btn btn-dark" type="submit">
                        {editingCategoryId ? 'Update category' : 'Create category'}
                      </button>
                      {editingCategoryId && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            setEditingCategoryId(null);
                            setCategoryForm({ id: '', name: '', slug: '' });
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                  {categoryMessage && (
                    <div className="alert alert-info mt-3 mb-0">{categoryMessage}</div>
                  )}
                </div>
              </section>

              <section className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                  <h2 className="h5 mb-3">Assign category to product</h2>
                  <div className="row g-3 align-items-end">
                    <div className="col-md-6">
                      <label className="form-label">Product</label>
                      <select
                        className="form-select"
                        value={selectedProductId}
                        onChange={(event) => setSelectedProductId(event.target.value)}
                      >
                        <option value="">Select product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.id})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Assign</label>
                      <select
                        className="form-select"
                        onChange={(event) => {
                          if (event.target.value) {
                            void handleAssignCategory(event.target.value);
                            event.target.value = '';
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Select category
                        </option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {selectedProduct && (
                    <div className="mt-3">
                      <h3 className="h6">Assigned categories</h3>
                      <div className="d-flex flex-wrap gap-2">
                        {selectedProduct.categories.map((category) => (
                          <span
                            key={category.id}
                            className="badge text-bg-light d-inline-flex align-items-center gap-2"
                          >
                            {category.name}
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger py-0 px-1"
                              onClick={() => void handleUnassignCategory(category.id)}
                            >
                              x
                            </button>
                          </span>
                        ))}
                        {selectedProduct.categories.length === 0 && (
                          <span className="text-secondary small">No categories assigned.</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className="card border-0 shadow-sm">
                <div className="card-body">
                  <h2 className="h5 mb-3">All categories</h2>
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Slug</th>
                          <th style={{ width: 180 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((category) => (
                          <tr key={category.id}>
                            <td className="small">{category.id}</td>
                            <td>{category.name}</td>
                            <td>{category.slug}</td>
                            <td>
                              <div className="d-flex gap-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-dark"
                                  onClick={() => {
                                    setEditingCategoryId(category.id);
                                    setCategoryForm({
                                      id: category.id,
                                      name: category.name,
                                      slug: category.slug,
                                    });
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => void handleDeleteCategory(category.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </>
          )}

          {section === 'variants' && (
            <>
              <section className="mb-4">
                <h1 className="h3 mb-1">Variants</h1>
                <p className="text-secondary mb-0">CRUD for product variants.</p>
              </section>
              <section className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                  <form onSubmit={handleCreateOrUpdateVariant} className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label">Product *</label>
                      <select
                        className="form-select"
                        value={variantForm.productId || selectedProductId}
                        onChange={(event) =>
                          setVariantForm((current) => ({
                            ...current,
                            productId: event.target.value,
                          }))
                        }
                      >
                        <option value="">Select product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Variant ID *</label>
                      <input
                        className="form-control"
                        value={variantForm.id}
                        disabled={editingVariantId !== null}
                        onChange={(event) =>
                          setVariantForm((current) => ({ ...current, id: event.target.value }))
                        }
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">SKU *</label>
                      <input
                        className="form-control"
                        value={variantForm.sku}
                        onChange={(event) =>
                          setVariantForm((current) => ({ ...current, sku: event.target.value }))
                        }
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Color</label>
                      <input
                        className="form-control"
                        value={variantForm.color}
                        onChange={(event) =>
                          setVariantForm((current) => ({ ...current, color: event.target.value }))
                        }
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Size</label>
                      <input
                        className="form-control"
                        value={variantForm.size}
                        onChange={(event) =>
                          setVariantForm((current) => ({ ...current, size: event.target.value }))
                        }
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Material</label>
                      <input
                        className="form-control"
                        value={variantForm.material}
                        onChange={(event) =>
                          setVariantForm((current) => ({
                            ...current,
                            material: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Barcode</label>
                      <input
                        className="form-control"
                        value={variantForm.barcode}
                        onChange={(event) =>
                          setVariantForm((current) => ({
                            ...current,
                            barcode: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Weight (grams)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={variantForm.weightGrams}
                        onChange={(event) =>
                          setVariantForm((current) => ({
                            ...current,
                            weightGrams: Number(event.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={variantForm.status}
                        onChange={(event) =>
                          setVariantForm((current) => ({
                            ...current,
                            status: event.target.value as 'ACTIVE' | 'INACTIVE',
                          }))
                        }
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>
                    <div className="col-md-4 d-flex align-items-end gap-2">
                      <button className="btn btn-dark" type="submit">
                        {editingVariantId ? 'Update variant' : 'Create variant'}
                      </button>
                      {editingVariantId && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            setEditingVariantId(null);
                            setVariantForm({
                              id: '',
                              productId: selectedProductId,
                              sku: '',
                              color: '',
                              size: '',
                              material: '',
                              barcode: '',
                              weightGrams: 0,
                              status: 'ACTIVE',
                            });
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                  {variantMessage && (
                    <div className="alert alert-info mt-3 mb-0">{variantMessage}</div>
                  )}
                </div>
              </section>
              <section className="card border-0 shadow-sm">
                <div className="card-body">
                  <h2 className="h5 mb-3">Variants for selected product</h2>
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>SKU</th>
                          <th>Color</th>
                          <th>Size</th>
                          <th>Status</th>
                          <th style={{ width: 180 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedProduct?.variants ?? []).map((variant) => (
                          <tr key={variant.id}>
                            <td className="small">{variant.id}</td>
                            <td>{variant.sku}</td>
                            <td>{variant.color ?? '-'}</td>
                            <td>{variant.size ?? '-'}</td>
                            <td>{variant.status}</td>
                            <td>
                              <div className="d-flex gap-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-dark"
                                  onClick={() => {
                                    setEditingVariantId(variant.id);
                                    setVariantForm({
                                      id: variant.id,
                                      productId: selectedProduct?.id ?? '',
                                      sku: variant.sku,
                                      color: variant.color ?? '',
                                      size: variant.size ?? '',
                                      material: variant.material ?? '',
                                      barcode: variant.barcode ?? '',
                                      weightGrams: variant.weightGrams ?? 0,
                                      status:
                                        (variant.status as 'ACTIVE' | 'INACTIVE') ?? 'ACTIVE',
                                    });
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => void handleDeleteVariant(variant.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {(selectedProduct?.variants.length ?? 0) === 0 && (
                          <tr>
                            <td colSpan={6} className="text-secondary">
                              No variants found for selected product.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </>
          )}

          {section === 'prices' && (
            <>
              <section className="mb-4">
                <h1 className="h3 mb-1">Prices</h1>
                <p className="text-secondary mb-0">CRUD for variant prices.</p>
              </section>
              <section className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Product</label>
                      <select
                        className="form-select"
                        value={selectedProductId}
                        onChange={(event) => setSelectedProductId(event.target.value)}
                      >
                        <option value="">Select product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Variant</label>
                      <select
                        className="form-select"
                        value={priceForm.variantId || selectedVariantId}
                        onChange={(event) => {
                          setSelectedVariantId(event.target.value);
                          setPriceForm((current) => ({
                            ...current,
                            variantId: event.target.value,
                          }));
                        }}
                      >
                        <option value="">Select variant</option>
                        {(selectedProduct?.variants ?? []).map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.sku}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <form onSubmit={handleCreateOrUpdatePrice} className="row g-3">
                    <div className="col-md-3">
                      <label className="form-label">Price ID *</label>
                      <input
                        className="form-control"
                        value={priceForm.id}
                        disabled={editingPriceId !== null}
                        onChange={(event) =>
                          setPriceForm((current) => ({ ...current, id: event.target.value }))
                        }
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Currency *</label>
                      <input
                        className="form-control"
                        value={priceForm.currency}
                        onChange={(event) =>
                          setPriceForm((current) => ({
                            ...current,
                            currency: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">List price *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={priceForm.listPrice}
                        onChange={(event) =>
                          setPriceForm((current) => ({
                            ...current,
                            listPrice: Number(event.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Sale price</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={priceForm.salePrice}
                        onChange={(event) =>
                          setPriceForm((current) => ({
                            ...current,
                            salePrice: Number(event.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Starts at (ISO)</label>
                      <input
                        className="form-control"
                        value={priceForm.startsAt}
                        onChange={(event) =>
                          setPriceForm((current) => ({
                            ...current,
                            startsAt: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Ends at (ISO)</label>
                      <input
                        className="form-control"
                        value={priceForm.endsAt}
                        onChange={(event) =>
                          setPriceForm((current) => ({
                            ...current,
                            endsAt: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="col-12 d-flex gap-2">
                      <button className="btn btn-dark" type="submit">
                        {editingPriceId ? 'Update price' : 'Create price'}
                      </button>
                      {editingPriceId && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            setEditingPriceId(null);
                            setPriceForm({
                              id: '',
                              variantId: selectedVariantId,
                              currency: 'USD',
                              listPrice: 0,
                              salePrice: 0,
                              startsAt: '',
                              endsAt: '',
                            });
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                  {priceMessage && (
                    <div className="alert alert-info mt-3 mb-0">{priceMessage}</div>
                  )}
                </div>
              </section>
              <section className="card border-0 shadow-sm">
                <div className="card-body">
                  <h2 className="h5 mb-3">Prices for selected variant</h2>
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Currency</th>
                          <th>List</th>
                          <th>Sale</th>
                          <th style={{ width: 180 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedVariant?.prices ?? []).map((price) => (
                          <tr key={price.id}>
                            <td className="small">{price.id}</td>
                            <td>{price.currency}</td>
                            <td>{price.listPrice}</td>
                            <td>{price.salePrice ?? '-'}</td>
                            <td>
                              <div className="d-flex gap-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-dark"
                                  onClick={() => {
                                    setEditingPriceId(price.id);
                                    setPriceForm({
                                      id: price.id,
                                      variantId: selectedVariant?.id ?? '',
                                      currency: price.currency,
                                      listPrice: price.listPrice,
                                      salePrice: price.salePrice ?? 0,
                                      startsAt: price.startsAt ?? '',
                                      endsAt: price.endsAt ?? '',
                                    });
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => void handleDeletePrice(price.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {(selectedVariant?.prices.length ?? 0) === 0 && (
                          <tr>
                            <td colSpan={5} className="text-secondary">
                              No prices found for selected variant.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </>
          )}

          {section === 'images' && (
            <>
              <section className="mb-4">
                <h1 className="h3 mb-1">Images</h1>
                <p className="text-secondary mb-0">CRUD for product and variant images.</p>
              </section>
              <section className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                  <form onSubmit={handleCreateOrUpdateImage} className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label">Image ID *</label>
                      <input
                        className="form-control"
                        value={imageForm.id}
                        disabled={editingImageId !== null}
                        onChange={(event) =>
                          setImageForm((current) => ({ ...current, id: event.target.value }))
                        }
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Product *</label>
                      <select
                        className="form-select"
                        value={imageForm.productId}
                        onChange={(event) =>
                          setImageForm((current) => ({
                            ...current,
                            productId: event.target.value,
                          }))
                        }
                      >
                        <option value="">Select product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Variant (optional)</label>
                      <input
                        className="form-control"
                        value={imageForm.variantId}
                        onChange={(event) =>
                          setImageForm((current) => ({
                            ...current,
                            variantId: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="col-md-8">
                      <label className="form-label">URL *</label>
                      <input
                        className="form-control"
                        value={imageForm.url}
                        onChange={(event) =>
                          setImageForm((current) => ({ ...current, url: event.target.value }))
                        }
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Alt text</label>
                      <input
                        className="form-control"
                        value={imageForm.altText}
                        onChange={(event) =>
                          setImageForm((current) => ({
                            ...current,
                            altText: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Sort order</label>
                      <input
                        type="number"
                        className="form-control"
                        value={imageForm.sortOrder}
                        onChange={(event) =>
                          setImageForm((current) => ({
                            ...current,
                            sortOrder: Number(event.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className="col-md-4 d-flex align-items-end">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="isPrimaryImage"
                          checked={imageForm.isPrimary}
                          onChange={(event) =>
                            setImageForm((current) => ({
                              ...current,
                              isPrimary: event.target.checked,
                            }))
                          }
                        />
                        <label htmlFor="isPrimaryImage" className="form-check-label">
                          Is primary
                        </label>
                      </div>
                    </div>
                    <div className="col-12 d-flex gap-2">
                      <button className="btn btn-dark" type="submit">
                        {editingImageId ? 'Update image' : 'Create image'}
                      </button>
                      {editingImageId && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            setEditingImageId(null);
                            setImageForm({
                              id: '',
                              productId: selectedProductId,
                              variantId: '',
                              url: '',
                              altText: '',
                              sortOrder: 0,
                              isPrimary: false,
                            });
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                  {imageMessage && (
                    <div className="alert alert-info mt-3 mb-0">{imageMessage}</div>
                  )}
                </div>
              </section>
              <section className="card border-0 shadow-sm">
                <div className="card-body">
                  <h2 className="h5 mb-3">Images of selected product</h2>
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>URL</th>
                          <th>Variant</th>
                          <th>Primary</th>
                          <th style={{ width: 180 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedProduct?.images ?? []).map((image) => (
                          <tr key={image.id}>
                            <td className="small">{image.id}</td>
                            <td className="small text-truncate" style={{ maxWidth: 240 }}>
                              {image.url}
                            </td>
                            <td>{image.variantId ?? '-'}</td>
                            <td>{image.isPrimary ? 'Yes' : 'No'}</td>
                            <td>
                              <div className="d-flex gap-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-dark"
                                  onClick={() => {
                                    setEditingImageId(image.id);
                                    setImageForm({
                                      id: image.id,
                                      productId: selectedProduct?.id ?? '',
                                      variantId: image.variantId ?? '',
                                      url: image.url,
                                      altText: image.altText ?? '',
                                      sortOrder: image.sortOrder,
                                      isPrimary: image.isPrimary,
                                    });
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => void handleDeleteImage(image.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {(selectedProduct?.images.length ?? 0) === 0 && (
                          <tr>
                            <td colSpan={5} className="text-secondary">
                              No images found for selected product.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </>
          )}

          {section === 'product-detail' && (
            <>
              <section className="mb-4">
                <h1 className="h3 mb-1">Product Detail</h1>
                <p className="text-secondary mb-0">
                  Consolidated admin view of a product object.
                </p>
              </section>
              <section className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Product</label>
                      <select
                        className="form-select"
                        value={selectedProductId}
                        onChange={(event) => setSelectedProductId(event.target.value)}
                      >
                        <option value="">Select product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <pre className="bg-light p-3 rounded border small overflow-auto mb-0">
                    {JSON.stringify(selectedProduct, null, 2)}
                  </pre>
                </div>
              </section>
            </>
          )}

          {section === 'inventory' && (
            <>
              <section className="mb-4">
                <h1 className="h3 mb-1">Inventory</h1>
                <p className="text-secondary mb-0">
                  Update stock availability for catalog products.
                </p>
              </section>

              <section className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                  <h2 className="h5 mb-3">Upsert stock</h2>
                  <form onSubmit={handleUpsertStock}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Product *</label>
                        <select
                          className="form-select"
                          value={stockForm.productId}
                          onChange={(event) =>
                            setStockForm((current) => ({
                              ...current,
                              productId: event.target.value,
                            }))
                          }
                        >
                          <option value="">Select product</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} ({product.id})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Variant ID (optional)</label>
                        <input
                          className="form-control"
                          value={stockForm.variantId}
                          onChange={(event) =>
                            setStockForm((current) => ({
                              ...current,
                              variantId: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Quantity on hand *</label>
                        <input
                          type="number"
                          className="form-control"
                          min={0}
                          value={stockForm.quantityOnHand}
                          onChange={(event) =>
                            setStockForm((current) => ({
                              ...current,
                              quantityOnHand: Number(event.target.value),
                            }))
                          }
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Status</label>
                        <select
                          className="form-select"
                          value={stockForm.status}
                          onChange={(event) =>
                            setStockForm((current) => ({
                              ...current,
                              status: event.target.value as 'ACTIVE' | 'INACTIVE',
                            }))
                          }
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-3">
                      <button type="submit" className="btn btn-dark">
                        Save stock
                      </button>
                    </div>
                  </form>
                  {stockMessage && (
                    <div className="alert alert-info mt-3 mb-0">{stockMessage}</div>
                  )}
                </div>
              </section>

              <section className="card border-0 shadow-sm">
                <div className="card-body">
                  <h2 className="h5 mb-3">Current stock</h2>
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Variant</th>
                          <th>On hand</th>
                          <th>Reserved</th>
                          <th>Available</th>
                          <th>Status</th>
                          <th style={{ width: 180 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryItems.map((item) => (
                          <tr key={`${item.productId}:${item.variantId ?? ''}`}>
                            <td>{item.productId}</td>
                            <td>{item.variantId || '-'}</td>
                            <td>{item.quantityOnHand}</td>
                            <td>{item.quantityReserved}</td>
                            <td>{item.quantityAvailable}</td>
                            <td>
                              <span
                                className={`badge ${
                                  item.status === 'ACTIVE'
                                    ? 'text-bg-success'
                                    : 'text-bg-secondary'
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-dark"
                                  onClick={() => handleEditStock(item)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDeleteStockItem(item)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {inventoryItems.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-secondary">
                              No stock records found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
