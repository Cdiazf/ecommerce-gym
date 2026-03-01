import type { Product } from '../../shared/types';

type VariantForm = {
  id: string;
  productId: string;
  sku: string;
  color: string;
  size: string;
  material: string;
  barcode: string;
  weightGrams: number;
  status: 'ACTIVE' | 'INACTIVE';
};

type VariantsSectionProps = {
  products: Product[];
  selectedProductId: string;
  selectedProduct: Product | null;
  variantForm: VariantForm;
  variantMessage: string;
  editingVariantId: string | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onVariantFormChange: (patch: Partial<VariantForm>) => void;
  onCancelEdit: () => void;
  onEditVariant: (variantId: string) => void;
  onDeleteVariant: (variantId: string) => void;
};

export function VariantsSection(props: VariantsSectionProps) {
  const {
    products,
    selectedProductId,
    selectedProduct,
    variantForm,
    variantMessage,
    editingVariantId,
    onSubmit,
    onVariantFormChange,
    onCancelEdit,
    onEditVariant,
    onDeleteVariant,
  } = props;

  return (
    <>
      <section className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <form onSubmit={onSubmit} className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Product *</label>
              <select
                className="form-select"
                value={variantForm.productId || selectedProductId}
                onChange={(event) => onVariantFormChange({ productId: event.target.value })}
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
                onChange={(event) => onVariantFormChange({ id: event.target.value })}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">SKU *</label>
              <input
                className="form-control"
                value={variantForm.sku}
                onChange={(event) => onVariantFormChange({ sku: event.target.value })}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Color</label>
              <input
                className="form-control"
                value={variantForm.color}
                onChange={(event) => onVariantFormChange({ color: event.target.value })}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Size</label>
              <input
                className="form-control"
                value={variantForm.size}
                onChange={(event) => onVariantFormChange({ size: event.target.value })}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Material</label>
              <input
                className="form-control"
                value={variantForm.material}
                onChange={(event) => onVariantFormChange({ material: event.target.value })}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Barcode</label>
              <input
                className="form-control"
                value={variantForm.barcode}
                onChange={(event) => onVariantFormChange({ barcode: event.target.value })}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Weight (grams)</label>
              <input
                type="number"
                className="form-control"
                value={variantForm.weightGrams}
                onChange={(event) => onVariantFormChange({ weightGrams: Number(event.target.value) })}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={variantForm.status}
                onChange={(event) =>
                  onVariantFormChange({ status: event.target.value as 'ACTIVE' | 'INACTIVE' })
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
                <button type="button" className="btn btn-outline-secondary" onClick={onCancelEdit}>
                  Cancel
                </button>
              )}
            </div>
          </form>
          {variantMessage && <div className="alert alert-info mt-3 mb-0">{variantMessage}</div>}
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
                          onClick={() => onEditVariant(variant.id)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => onDeleteVariant(variant.id)}
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
  );
}
