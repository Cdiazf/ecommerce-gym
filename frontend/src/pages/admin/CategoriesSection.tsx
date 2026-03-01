import type { Product, ProductCategory } from '../../shared/types';

type CategoryForm = {
  id: string;
  name: string;
  slug: string;
};

type CategoriesSectionProps = {
  products: Product[];
  categories: ProductCategory[];
  selectedProductId: string;
  selectedProduct: Product | null;
  categoryForm: CategoryForm;
  categoryMessage: string;
  editingCategoryId: string | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onSelectProduct: (productId: string) => void;
  onCategoryFormChange: (patch: Partial<CategoryForm>) => void;
  onCancelEdit: () => void;
  onDeleteCategory: (categoryId: string) => void;
  onAssignCategory: (categoryId: string) => void;
  onUnassignCategory: (categoryId: string) => void;
  onEditCategory: (category: ProductCategory) => void;
};

export function CategoriesSection(props: CategoriesSectionProps) {
  const {
    products,
    categories,
    selectedProductId,
    selectedProduct,
    categoryForm,
    categoryMessage,
    editingCategoryId,
    onSubmit,
    onSelectProduct,
    onCategoryFormChange,
    onCancelEdit,
    onDeleteCategory,
    onAssignCategory,
    onUnassignCategory,
    onEditCategory,
  } = props;

  return (
    <>
      <section className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h2 className="h5 mb-3">{editingCategoryId ? 'Edit category' : 'Create category'}</h2>
          <form onSubmit={onSubmit} className="row g-3">
            <div className="col-md-4">
              <label className="form-label">ID *</label>
              <input
                className="form-control"
                value={categoryForm.id}
                disabled={editingCategoryId !== null}
                onChange={(event) => onCategoryFormChange({ id: event.target.value })}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Name *</label>
              <input
                className="form-control"
                value={categoryForm.name}
                onChange={(event) => onCategoryFormChange({ name: event.target.value })}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Slug *</label>
              <input
                className="form-control"
                value={categoryForm.slug}
                onChange={(event) => onCategoryFormChange({ slug: event.target.value })}
              />
            </div>
            <div className="col-12 d-flex gap-2">
              <button className="btn btn-dark" type="submit">
                {editingCategoryId ? 'Update category' : 'Create category'}
              </button>
              {editingCategoryId && (
                <button type="button" className="btn btn-outline-secondary" onClick={onCancelEdit}>
                  Cancel
                </button>
              )}
            </div>
          </form>
          {categoryMessage && <div className="alert alert-info mt-3 mb-0">{categoryMessage}</div>}
        </div>
      </section>

      <section className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h2 className="h5 mb-3">Assign category to product</h2>
          <div className="row g-3 align-items-end">
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
                    {product.name} ({product.id})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Assign</label>
              <select
                className="form-select"
                onChange={(event) => {
                  if (event.target.value) {
                    onAssignCategory(event.target.value);
                    event.target.value = '';
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>
                  Select category
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {selectedProduct && (
            <div className="mt-3">
              <h3 className="h6">Assigned categories</h3>
              <div className="d-flex flex-wrap gap-2">
                {selectedProduct.categories.map((category) => (
                  <span
                    key={category.id}
                    className="badge text-bg-light d-inline-flex align-items-center gap-2"
                  >
                    {category.name}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger py-0 px-1"
                      onClick={() => onUnassignCategory(category.id)}
                    >
                      x
                    </button>
                  </span>
                ))}
                {selectedProduct.categories.length === 0 && (
                  <span className="text-secondary small">No categories assigned.</span>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="card border-0 shadow-sm">
        <div className="card-body">
          <h2 className="h5 mb-3">All categories</h2>
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Slug</th>
                  <th style={{ width: 180 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="small">{category.id}</td>
                    <td>{category.name}</td>
                    <td>{category.slug}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-dark"
                          onClick={() => onEditCategory(category)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => onDeleteCategory(category.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
