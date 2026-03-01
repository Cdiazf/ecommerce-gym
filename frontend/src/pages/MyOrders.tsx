import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../shared/api';
import type { Order, Payment, Shipment } from '../shared/types';

type MyOrdersProps = {
  token: string;
};

function getPaymentStatusBadgeClass(status: Payment['status'] | 'NOT_CREATED'): string {
  switch (status) {
    case 'APPROVED':
      return 'text-bg-success';
    case 'PENDING':
      return 'text-bg-warning';
    case 'FAILED':
    case 'EXPIRED':
      return 'text-bg-danger';
    default:
      return 'text-bg-secondary';
  }
}

function getShipmentStatusBadgeClass(
  status: Shipment['status'] | 'NOT_CREATED',
): string {
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

function getLatestShipmentNote(shipment: Shipment | null): string {
  return shipment?.events[shipment.events.length - 1]?.note ?? '';
}

export function MyOrders(props: MyOrdersProps) {
  const { token } = props;
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentsByOrder, setPaymentsByOrder] = useState<Record<string, Payment | null>>({});
  const [shipmentsByOrder, setShipmentsByOrder] = useState<Record<string, Shipment | null>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [retryPending, setRetryPending] = useState<{
    orderId: string;
    qrData: string;
    operationHint: string;
  } | null>(null);
  const [retryOperationCode, setRetryOperationCode] = useState('');

  const loadOrderStatuses = useCallback(
    async (ordersToLoad: Order[]) => {
      const paymentEntries = await Promise.all(
        ordersToLoad.map(async (order) => {
          try {
            const payment = await apiFetch<Payment>(`/payments/${order.id}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            return [order.id, payment] as const;
          } catch {
            return [order.id, null] as const;
          }
        }),
      );

      const shipmentEntries = await Promise.all(
        ordersToLoad.map(async (order) => {
          try {
            const shipment = await apiFetch<Shipment>(`/shipments/${order.id}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            return [order.id, shipment] as const;
          } catch {
            return [order.id, null] as const;
          }
        }),
      );

      setPaymentsByOrder(Object.fromEntries(paymentEntries));
      setShipmentsByOrder(Object.fromEntries(shipmentEntries));
    },
    [token],
  );

  const reloadOrders = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await apiFetch<Order[]>('/orders/my', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOrders(data);
      setSelectedOrderId((current) =>
        current && data.some((order) => order.id === current)
          ? current
          : data[0]?.id ?? '',
      );
      await loadOrderStatuses(data);
    } catch (ordersError) {
      setError(String(ordersError));
    } finally {
      setLoading(false);
    }
  }, [loadOrderStatuses, token]);

  useEffect(() => {
    void reloadOrders();
  }, [reloadOrders]);

  async function handleRetryPayment(orderId: string) {
    setMessage('');

    try {
      const result = await apiFetch<{
        orderId: string;
        yape: { qrData: string; operationHint: string };
      }>('/payments/yape/retry', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      });

      setRetryPending({
        orderId: result.orderId,
        qrData: result.yape.qrData,
        operationHint: result.yape.operationHint,
      });
      setRetryOperationCode('');
      setMessage('YAPE payment re-opened. Complete it and confirm the operation code.');
      await reloadOrders();
    } catch (retryError) {
      setMessage(String(retryError));
    }
  }

  async function handleOpenPendingYape(orderId: string) {
    setMessage('');

    try {
      const result = await apiFetch<{
        orderId: string;
        yape: { qrData: string; operationHint: string };
      }>('/payments/yape/start', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      });

      setRetryPending({
        orderId: result.orderId,
        qrData: result.yape.qrData,
        operationHint: result.yape.operationHint,
      });
      setRetryOperationCode('');
      setMessage('Resume your pending YAPE payment and confirm the operation code.');
    } catch (startError) {
      setMessage(String(startError));
    }
  }

  async function handleConfirmRetryPayment() {
    if (!retryPending) {
      return;
    }

    if (!retryOperationCode.trim()) {
      setMessage('Enter the YAPE operation code before confirming.');
      return;
    }

    try {
      await apiFetch('/payments/yape/confirm', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: retryPending.orderId,
          operationCode: retryOperationCode.trim(),
        }),
      });

      setMessage(`YAPE payment confirmed for order ${retryPending.orderId}.`);
      setRetryPending(null);
      setRetryOperationCode('');
      await reloadOrders();
    } catch (confirmError) {
      setMessage(String(confirmError));
    }
  }

  const selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? null;
  const selectedPayment = selectedOrder ? paymentsByOrder[selectedOrder.id] ?? null : null;
  const selectedShipment = selectedOrder ? shipmentsByOrder[selectedOrder.id] ?? null : null;

  return (
    <main className="container py-5">
      <section className="mb-4">
        <h1 className="h3 mb-1">My Orders</h1>
        <p className="text-secondary mb-0">
          History of your purchases, payment state and shipping progress.
        </p>
      </section>

      {retryPending && (
        <div className="alert alert-warning">
          <p className="mb-1">
            <strong>YAPE payment pending</strong>
          </p>
          <p className="mb-1 small">Order: {retryPending.orderId}</p>
          <p className="mb-1 small">Operation hint: {retryPending.operationHint}</p>
          <p className="mb-2 small text-break">QR data: {retryPending.qrData}</p>
          <div className="d-flex gap-2">
            <input
              className="form-control form-control-sm"
              placeholder="Operation code"
              value={retryOperationCode}
              onChange={(event) => setRetryOperationCode(event.target.value)}
            />
            <button
              type="button"
              className="btn btn-sm btn-dark"
              onClick={handleConfirmRetryPayment}
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {message && <div className="alert alert-info">{message}</div>}
      {loading && <div className="alert alert-info">Loading orders...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && (
        <div className="row g-4">
          <div className="col-lg-8">
            <section className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Order Status</th>
                        <th>Payment</th>
                        <th>Shipping</th>
                        <th>Items</th>
                        <th>Created</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => {
                        const payment = paymentsByOrder[order.id] ?? null;
                        const shipment = shipmentsByOrder[order.id] ?? null;
                        const latestShipmentNote = getLatestShipmentNote(shipment);
                        const canRetryYape =
                          order.paymentMethod === 'YAPE' &&
                          order.status === 'CANCELLED' &&
                          (payment?.status === 'FAILED' || payment?.status === 'EXPIRED');
                        const canResumePendingYape =
                          order.paymentMethod === 'YAPE' && payment?.status === 'PENDING';

                        return (
                          <tr key={order.id}>
                            <td className="small">
                              <div>{order.id}</div>
                              <div className="text-secondary">
                                {order.shippingAddress.label} · {order.shippingCurrency}{' '}
                                {order.totalAmount.toFixed(2)}
                              </div>
                            </td>
                            <td>
                              <span className="badge text-bg-primary">{order.status}</span>
                            </td>
                            <td>
                              <div className="small">
                                <div>{payment?.method ?? order.paymentMethod}</div>
                                <div>
                                  <span
                                    className={`badge ${getPaymentStatusBadgeClass(
                                      payment?.status ?? 'NOT_CREATED',
                                    )}`}
                                  >
                                    {payment?.status ?? 'NOT_CREATED'}
                                  </span>
                                </div>
                                {payment && (
                                  <div className="text-secondary">
                                    {payment.amount.toFixed(2)}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="small">
                                <div>
                                  <span
                                    className={`badge ${getShipmentStatusBadgeClass(
                                      shipment?.status ?? 'NOT_CREATED',
                                    )}`}
                                  >
                                    {shipment?.status ?? 'NOT_CREATED'}
                                  </span>
                                </div>
                                <div className="text-secondary">
                                  {shipment?.trackingCode ?? 'Tracking pending'}
                                </div>
                                {shipment?.status === 'FAILED' && latestShipmentNote && (
                                  <div className="text-danger">{latestShipmentNote}</div>
                                )}
                              </div>
                            </td>
                            <td>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                            <td>{new Date(order.createdAt).toLocaleString()}</td>
                            <td>
                              <div className="d-flex flex-column gap-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() =>
                                    setSelectedOrderId((current) =>
                                      current === order.id ? '' : order.id,
                                    )
                                  }
                                >
                                  {selectedOrderId === order.id ? 'Hide' : 'View'}
                                </button>
                                {canRetryYape ? (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-dark"
                                    onClick={() => handleRetryPayment(order.id)}
                                  >
                                    Retry YAPE
                                  </button>
                                ) : canResumePendingYape ? (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-dark"
                                    onClick={() => handleOpenPendingYape(order.id)}
                                  >
                                    Open YAPE
                                  </button>
                                ) : (
                                  <span className="small text-secondary">-</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-secondary">
                            You do not have orders yet.
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
                <h2 className="h5 mb-3">Order Tracking</h2>
                {!selectedOrder && (
                  <p className="text-secondary mb-0">
                    Select an order to view payment and shipment details.
                  </p>
                )}
                {selectedOrder && (
                  <>
                    <p className="mb-1 small">
                      <strong>Order:</strong> {selectedOrder.id}
                    </p>
                    <p className="mb-1 small">
                      <strong>Total:</strong> {selectedOrder.shippingCurrency}{' '}
                      {selectedOrder.totalAmount.toFixed(2)}
                    </p>
                    <p className="mb-3 small">
                      <strong>Address:</strong> {selectedOrder.shippingAddress.line1},{' '}
                      {selectedOrder.shippingAddress.district}, {selectedOrder.shippingAddress.city}
                    </p>

                    <div className="mb-3">
                      <h3 className="h6">Payment</h3>
                      <div className="small text-secondary">
                        <div>Method: {selectedPayment?.method ?? selectedOrder.paymentMethod}</div>
                        <div>
                          Status:{' '}
                          <span
                            className={`badge ${getPaymentStatusBadgeClass(
                              selectedPayment?.status ?? 'NOT_CREATED',
                            )}`}
                          >
                            {selectedPayment?.status ?? 'NOT_CREATED'}
                          </span>
                        </div>
                        <div>Amount: {selectedPayment?.amount.toFixed(2) ?? '0.00'}</div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <h3 className="h6">Shipment</h3>
                      <div className="small text-secondary">
                        <div>
                          Status:{' '}
                          <span
                            className={`badge ${getShipmentStatusBadgeClass(
                              selectedShipment?.status ?? 'NOT_CREATED',
                            )}`}
                          >
                            {selectedShipment?.status ?? 'NOT_CREATED'}
                          </span>
                        </div>
                        <div>Tracking: {selectedShipment?.trackingCode ?? 'Pending'}</div>
                      </div>
                    </div>

                    {selectedPayment?.status === 'PENDING' && (
                      <div className="alert alert-warning py-2 small">
                        Payment is still pending. Complete YAPE and confirm the operation code.
                      </div>
                    )}
                    {selectedPayment?.status === 'APPROVED' && (
                      <div className="alert alert-success py-2 small">
                        Payment approved. The order is moving through fulfillment.
                      </div>
                    )}
                    {selectedPayment &&
                      (selectedPayment.status === 'FAILED' ||
                        selectedPayment.status === 'EXPIRED') && (
                        <div className="alert alert-danger py-2 small">
                          Payment {selectedPayment.status.toLowerCase()}. Retry YAPE to reopen the
                          order.
                        </div>
                      )}
                    {selectedShipment?.status === 'FAILED' && (
                      <div className="alert alert-danger py-2 small">
                        Delivery failed: {getLatestShipmentNote(selectedShipment) || 'No reason provided.'}
                      </div>
                    )}
                    {selectedShipment?.status === 'DELIVERED' && (
                      <div className="alert alert-success py-2 small">
                        Shipment delivered successfully.
                      </div>
                    )}

                    <div>
                      <h3 className="h6">Timeline</h3>
                      {selectedShipment?.events && selectedShipment.events.length > 0 ? (
                        <ul className="list-group list-group-flush">
                          {selectedShipment.events.map((event, index) => (
                            <li
                              key={`${selectedShipment.id}-${event.happenedAt}-${index}`}
                              className="list-group-item px-0"
                            >
                              <div className="d-flex justify-content-between gap-3">
                                <strong className="small">{event.status}</strong>
                                <span className="small text-secondary">
                                  {new Date(event.happenedAt).toLocaleString()}
                                </span>
                              </div>
                              <div className="small text-secondary">{event.note}</div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="small text-secondary mb-0">
                          No shipment events yet.
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </main>
  );
}
