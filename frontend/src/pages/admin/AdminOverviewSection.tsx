import type { AdminOrdersByUser, Order, Payment } from '../../shared/types';

type AdminOverviewSectionProps = {
  loading: boolean;
  error: string;
  totals: {
    totalOrders: number;
    uniqueCustomers: number;
    totalItems: number;
    totalShipping: number;
    totalRevenue: number;
    totalPaymentsCaptured: number;
  };
  byUser: AdminOrdersByUser[];
  orders: Order[];
  reconciliation: {
    paidOrdersWithoutPayment: Order[];
    approvedPaymentsWithoutOrder: Payment[];
    amountMismatches: Order[];
  };
  onExportOrdersCsv: () => void;
  onExportPaymentsCsv: () => void;
};

export function AdminOverviewSection(props: AdminOverviewSectionProps) {
  const {
    loading,
    error,
    totals,
    byUser,
    orders,
    reconciliation,
    onExportOrdersCsv,
    onExportPaymentsCsv,
  } = props;

  return (
    <>
      <section className="mb-4">
        <h1 className="h3 mb-1">Admin Dashboard</h1>
        <p className="text-secondary mb-0">Orders overview and customer activity.</p>
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
                    <h2 className="h4 mb-0">${totals.totalPaymentsCaptured.toFixed(2)}</h2>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-dark"
                      onClick={onExportOrdersCsv}
                    >
                      Export Orders CSV
                    </button>
                    <button type="button" className="btn btn-sm btn-dark" onClick={onExportPaymentsCsv}>
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
                        <div className="small text-secondary">Paid orders without approved payment</div>
                        <div className="h5 mb-0">{reconciliation.paidOrdersWithoutPayment.length}</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="border rounded-3 p-3 h-100">
                        <div className="small text-secondary">Approved payments without paid order</div>
                        <div className="h5 mb-0">{reconciliation.approvedPaymentsWithoutOrder.length}</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="border rounded-3 p-3 h-100">
                        <div className="small text-secondary">Amount mismatches</div>
                        <div className="h5 mb-0">{reconciliation.amountMismatches.length}</div>
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
                        <td className="small text-secondary">{item.orders.join(', ')}</td>
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
  );
}
