import type { Shipment } from '../../shared/types';

type AdminShipmentsSectionProps = {
  loading: boolean;
  error: string;
  shipments: Shipment[];
  getShipmentStatusBadgeClass: (status: Shipment['status']) => string;
  getLatestShipmentNote: (shipment: Shipment) => string;
  getShipmentActions: (
    status: Shipment['status'],
  ) => Array<{ label: string; nextStatus: Shipment['status']; variant: string }>;
  onReportFailure: (orderId: string) => void;
  onUpdateStatus: (orderId: string, status: Shipment['status']) => void;
};

export function AdminShipmentsSection(props: AdminShipmentsSectionProps) {
  const {
    loading,
    error,
    shipments,
    getShipmentStatusBadgeClass,
    getLatestShipmentNote,
    getShipmentActions,
    onReportFailure,
    onUpdateStatus,
  } = props;

  return (
    <>
      <section className="mb-4">
        <h1 className="h3 mb-1">Shipments</h1>
        <p className="text-secondary mb-0">Update shipping lifecycle and tracking progress.</p>
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
                        <span className={`badge ${getShipmentStatusBadgeClass(shipment.status)}`}>
                          {shipment.status}
                        </span>
                      </td>
                      <td className="small text-secondary">{getLatestShipmentNote(shipment)}</td>
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
                                  ? onReportFailure(shipment.orderId)
                                  : onUpdateStatus(shipment.orderId, action.nextStatus)
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
  );
}
