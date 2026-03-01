import type { Order } from '../../shared/types';

type AdminOrdersSectionProps = {
  loading: boolean;
  error: string;
  filteredOrders: Order[];
  selectedOrder: Order | null;
  ordersCustomerQuery: string;
  ordersStatusFilter: 'all' | 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED';
  onOrdersCustomerQueryChange: (value: string) => void;
  onOrdersStatusFilterChange: (value: 'all' | 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED') => void;
  onSelectOrder: (order: Order) => void;
  onExportOrdersCsv: () => void;
};

export function AdminOrdersSection(props: AdminOrdersSectionProps) {
  const {
    loading,
    error,
    filteredOrders,
    selectedOrder,
    ordersCustomerQuery,
    ordersStatusFilter,
    onOrdersCustomerQueryChange,
    onOrdersStatusFilterChange,
    onSelectOrder,
    onExportOrdersCsv,
  } = props;

  return (
    <>
      <section className="mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between gap-3 align-items-md-center">
          <div>
            <h1 className="h3 mb-1">Orders</h1>
            <p className="text-secondary mb-0">View all orders, owner and line-item details.</p>
          </div>
          <button type="button" className="btn btn-dark" onClick={onExportOrdersCsv}>
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
                      onChange={(event) => onOrdersCustomerQueryChange(event.target.value)}
                    />
                  </div>
                  <div className="col-md-5">
                    <label className="form-label mb-1">Status</label>
                    <select
                      className="form-select"
                      value={ordersStatusFilter}
                      onChange={(event) =>
                        onOrdersStatusFilterChange(
                          event.target.value as 'all' | 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED',
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
                            <span className="badge text-bg-primary">{order.status}</span>
                          </td>
                          <td>{order.paymentMethod}</td>
                          <td>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
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
                              onClick={() => onSelectOrder(order)}
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
                  <p className="text-secondary mb-0">Select an order to see details.</p>
                )}
                {selectedOrder && (
                  <>
                    <p className="mb-1">
                      <strong>Order:</strong> <span className="small">{selectedOrder.id}</span>
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
                      <strong>Created:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}
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
                        {selectedOrder.shippingAddress.recipientName} · {selectedOrder.shippingAddress.phone}
                      </p>
                      <p className="mb-1">{selectedOrder.shippingAddress.line1}</p>
                      <p className="mb-0 text-secondary">
                        {selectedOrder.shippingAddress.district}, {selectedOrder.shippingAddress.city},{' '}
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
                        <li className="list-group-item px-0 text-secondary">No items found.</li>
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
  );
}
