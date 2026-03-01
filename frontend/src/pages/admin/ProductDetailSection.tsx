import type { Product } from '../../shared/types';

type ProductDetailSectionProps = {
  products: Product[];
  selectedProductId: string;
  selectedProduct: Product | null;
  onSelectProduct: (productId: string) => void;
};

export function ProductDetailSection(props: ProductDetailSectionProps) {
  const { products, selectedProductId, selectedProduct, onSelectProduct } = props;

  return (
    <section className="card border-0 shadow-sm">
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
        </div>
        <pre className="bg-light p-3 rounded border small overflow-auto mb-0">
          {JSON.stringify(selectedProduct, null, 2)}
        </pre>
      </div>
    </section>
  );
}
