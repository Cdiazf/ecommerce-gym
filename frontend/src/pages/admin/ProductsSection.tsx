import type { Product } from '../../shared/types';

type ProductForm = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  brand: string;
  description: string;
};

type ProductsSectionProps = {
  products: Product[];
  productForm: ProductForm;
  productMessage: string;
  editingProductId: string | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onProductFormChange: (patch: Partial<ProductForm>) => void;
  onCancelEdit: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
};

export function ProductsSection(props: ProductsSectionProps) {
  const {
    products,
    productForm,
    productMessage,
    editingProductId,
    onSubmit,
    onProductFormChange,
    onCancelEdit,
    onEditProduct,
    onDeleteProduct,
  } = props;

  return (
    <>
      <section className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h2 className="h5 mb-3">{editingProductId ? 'Edit product' : 'Create product'}</h2>
          <form onSubmit={onSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">ID *</label>
                <input
                  className="form-control"
                  value={productForm.id}
                  disabled={editingProductId !== null}
                  onChange={(event) => onProductFormChange({ id: event.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">SKU *</label>
                <input
                  className="form-control"
                  value={productForm.sku}
                  onChange={(event) => onProductFormChange({ sku: event.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Name *</label>
                <input
                  className="form-control"
                  value={productForm.name}
                  onChange={(event) => onProductFormChange({ name: event.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Slug *</label>
                <input
                  className="form-control"
                  value={productForm.slug}
                  onChange={(event) => onProductFormChange({ slug: event.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Brand *</label>
                <input
                  className="form-control"
                  value={productForm.brand}
                  onChange={(event) => onProductFormChange({ brand: event.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Description</label>
                <input
                  className="form-control"
                  value={productForm.description}
                  onChange={(event) => onProductFormChange({ description: event.target.value })}
                />
              </div>
            </div>
            <div className="mt-3 d-flex gap-2">
              <button type="submit" className="btn btn-dark">
                {editingProductId ? 'Update product' : 'Create product'}
              </button>
              {editingProductId && (
                <button type="button" className="btn btn-outline-secondary" onClick={onCancelEdit}>
                  Cancel edit
                </button>
              )}
            </div>
          </form>
          {productMessage && <div className="alert alert-info mt-3 mb-0">{productMessage}</div>}
        </div>
      </section>

      <section className="card border-0 shadow-sm">
        <div className="card-body">
          <h2 className="h5 mb-3">Current products</h2>
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Brand</th>
                  <th>Slug</th>
                  <th>Variants</th>
                  <th style={{ width: 180 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="small">{product.id}</td>
                    <td>{product.name}</td>
                    <td>{product.brand}</td>
                    <td>{product.slug}</td>
                    <td>{product.variants.length}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-dark"
                          onClick={() => onEditProduct(product)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => onDeleteProduct(product.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-secondary">
                      No products found.
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
