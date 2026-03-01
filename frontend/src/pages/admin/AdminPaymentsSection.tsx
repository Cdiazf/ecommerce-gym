import type { Payment } from '../../shared/types';

type AdminPaymentsSectionProps = {
  loading: boolean;
  error: string;
  filteredPayments: Payment[];
  paymentsCustomerQuery: string;
  paymentsStatusFilter: 'all' | 'PENDING' | 'APPROVED' | 'FAILED' | 'EXPIRED';
  paymentsMethodFilter: 'all' | 'AUTO' | 'YAPE';
  reconciliation: {
    paidOrdersWithoutPayment: { length: number };
    approvedPaymentsWithoutOrder: { length: number };
    amountMismatches: { length: number };
  };
  onPaymentsCustomerQueryChange: (value: string) => void;
  onPaymentsStatusFilterChange: (value: 'all' | 'PENDING' | 'APPROVED' | 'FAILED' | 'EXPIRED') => void;
  onPaymentsMethodFilterChange: (value: 'all' | 'AUTO' | 'YAPE') => void;
  onExportPaymentsCsv: () => void;
};

export function AdminPaymentsSection(props: AdminPaymentsSectionProps) {
  const {
    loading,
    error,
    filteredPayments,
    paymentsCustomerQuery,
    paymentsStatusFilter,
    paymentsMethodFilter,
    reconciliation,
    onPaymentsCustomerQueryChange,
    onPaymentsStatusFilterChange,
    onPaymentsMethodFilterChange,
    onExportPaymentsCsv,
  } = props;

  return (
    <>
      <section className="mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between gap-3 align-items-md-center">
          <div>
            <h1 className="h3 mb-1">Payments</h1>
            <p className="text-secondary mb-0">
              View payment status, method and captured amount by order.
            </p>
          </div>
          <button type="button" className="btn btn-dark" onClick={onExportPaymentsCsv}>
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
                  onChange={(event) => onPaymentsCustomerQueryChange(event.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label mb-1">Status</label>
                <select
                  className="form-select"
                  value={paymentsStatusFilter}
                  onChange={(event) =>
                    onPaymentsStatusFilterChange(
                      event.target.value as 'all' | 'PENDING' | 'APPROVED' | 'FAILED' | 'EXPIRED',
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
                    onPaymentsMethodFilterChange(event.target.value as 'all' | 'AUTO' | 'YAPE')
                  }
                >
                  <option value="all">All</option>
                  <option value="AUTO">AUTO</option>
                  <option value="YAPE">YAPE</option>
                </select>
              </div>
            </div>

            <div className="alert alert-secondary small">
              <div>Paid orders without approved payment: {reconciliation.paidOrdersWithoutPayment.length}</div>
              <div>
                Approved payments without paid order: {reconciliation.approvedPaymentsWithoutOrder.length}
              </div>
              <div>Amount mismatches: {reconciliation.amountMismatches.length}</div>
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
                        <span className="badge text-bg-primary">{payment.status}</span>
                      </td>
                      <td>${payment.amount.toFixed(2)}</td>
                      <td className="small text-secondary">
                        {payment.operationCode ?? payment.externalReference ?? '-'}
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
  );
}
