import type { Product } from '../../shared/types';

type PriceForm = {
  id: string;
  variantId: string;
  currency: string;
  listPrice: number;
  salePrice: number;
  startsAt: string;
  endsAt: string;
};

type PricesSectionProps = {
  products: Product[];
  selectedProductId: string;
  selectedVariantId: string;
  selectedProduct: Product | null;
  selectedVariant: NonNullable<Product['variants'][number]> | null;
  priceForm: PriceForm;
  priceMessage: string;
  editingPriceId: string | null;
  onSelectProduct: (productId: string) => void;
  onSelectVariant: (variantId: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onPriceFormChange: (patch: Partial<PriceForm>) => void;
  onCancelEdit: () => void;
  onEditPrice: (priceId: string) => void;
  onDeletePrice: (priceId: string) => void;
};

export function PricesSection(props: PricesSectionProps) {
  const {
    products,
    selectedProductId,
    selectedVariantId,
    selectedProduct,
    selectedVariant,
    priceForm,
    priceMessage,
    editingPriceId,
    onSelectProduct,
    onSelectVariant,
    onSubmit,
    onPriceFormChange,
    onCancelEdit,
    onEditPrice,
    onDeletePrice,
  } = props;

  return (
    <>
      <section className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label">Product</label>
              <select
                className="form-select"
                value={selectedProductId}
                onChange={(event) => onSelectProduct(event.target.value)}
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
                  onSelectVariant(event.target.value);
                  onPriceFormChange({ variantId: event.target.value });
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
          <form onSubmit={onSubmit} className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Price ID *</label>
              <input
                className="form-control"
                value={priceForm.id}
                disabled={editingPriceId !== null}
                onChange={(event) => onPriceFormChange({ id: event.target.value })}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Currency *</label>
              <input
                className="form-control"
                value={priceForm.currency}
                onChange={(event) => onPriceFormChange({ currency: event.target.value })}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">List price *</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={priceForm.listPrice}
                onChange={(event) => onPriceFormChange({ listPrice: Number(event.target.value) })}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Sale price</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={priceForm.salePrice}
                onChange={(event) => onPriceFormChange({ salePrice: Number(event.target.value) })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Starts at (ISO)</label>
              <input
                className="form-control"
                value={priceForm.startsAt}
                onChange={(event) => onPriceFormChange({ startsAt: event.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Ends at (ISO)</label>
              <input
                className="form-control"
                value={priceForm.endsAt}
                onChange={(event) => onPriceFormChange({ endsAt: event.target.value })}
              />
            </div>
            <div className="col-12 d-flex gap-2">
              <button className="btn btn-dark" type="submit">
                {editingPriceId ? 'Update price' : 'Create price'}
              </button>
              {editingPriceId && (
                <button type="button" className="btn btn-outline-secondary" onClick={onCancelEdit}>
                  Cancel
                </button>
              )}
            </div>
          </form>
          {priceMessage && <div className="alert alert-info mt-3 mb-0">{priceMessage}</div>}
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
                          onClick={() => onEditPrice(price.id)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => onDeletePrice(price.id)}
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
  );
}
