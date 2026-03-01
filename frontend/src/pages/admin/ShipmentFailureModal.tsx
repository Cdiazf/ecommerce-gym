type ShipmentFailureModalState = {
  orderId: string;
  preset: string;
  customNote: string;
};

type ShipmentFailureModalProps = {
  modal: ShipmentFailureModalState | null;
  presets: string[];
  onClose: () => void;
  onConfirm: () => void;
  onPresetChange: (value: string) => void;
  onCustomNoteChange: (value: string) => void;
};

export function ShipmentFailureModal(props: ShipmentFailureModalProps) {
  const { modal, presets, onClose, onConfirm, onPresetChange, onCustomNoteChange } = props;

  if (!modal) {
    return null;
  }

  return (
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
              onClick={onClose}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Failure reason</label>
            <select
              className="form-select"
              value={modal.preset}
              onChange={(event) => onPresetChange(event.target.value)}
            >
              {presets.map((preset) => (
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
              value={modal.customNote}
              onChange={(event) => onCustomNoteChange(event.target.value)}
            />
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" onClick={onConfirm}>
              Mark Failed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
