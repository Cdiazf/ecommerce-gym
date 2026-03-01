import type { Product } from '../../shared/types';
import type { InventoryItem } from './types';

type StockForm = {
  productId: string;
  variantId: string;
  quantityOnHand: number;
  status: 'ACTIVE' | 'INACTIVE';
};

type InventorySectionProps = {
  products: Product[];
  inventoryItems: InventoryItem[];
  stockForm: StockForm;
  stockMessage: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onStockFormChange: (patch: Partial<StockForm>) => void;
  onEditStock: (item: InventoryItem) => void;
  onDeleteStockItem: (item: InventoryItem) => void;
};

export function InventorySection(props: InventorySectionProps) {
  const {
    products,
    inventoryItems,
    stockForm,
    stockMessage,
    onSubmit,
    onStockFormChange,
    onEditStock,
    onDeleteStockItem,
  } = props;

  return (
    <>
      <section className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h2 className="h5 mb-3">Upsert stock</h2>
          <form onSubmit={onSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Product *</label>
                <select
                  className="form-select"
                  value={stockForm.productId}
                  onChange={(event) => onStockFormChange({ productId: event.target.value })}
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
                  onChange={(event) => onStockFormChange({ variantId: event.target.value })}
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
                    onStockFormChange({ quantityOnHand: Number(event.target.value) })
                  }
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={stockForm.status}
                  onChange={(event) =>
                    onStockFormChange({ status: event.target.value as 'ACTIVE' | 'INACTIVE' })
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
          {stockMessage && <div className="alert alert-info mt-3 mb-0">{stockMessage}</div>}
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
                          item.status === 'ACTIVE' ? 'text-bg-success' : 'text-bg-secondary'
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
                          onClick={() => onEditStock(item)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => onDeleteStockItem(item)}
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
  );
}
