import type { Product } from '../../shared/types';

type ImageForm = {
  id: string;
  productId: string;
  variantId: string;
  url: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
};

type ImagesSectionProps = {
  products: Product[];
  selectedProduct: Product | null;
  imageForm: ImageForm;
  imageMessage: string;
  editingImageId: string | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onImageFormChange: (patch: Partial<ImageForm>) => void;
  onCancelEdit: () => void;
  onEditImage: (imageId: string) => void;
  onDeleteImage: (imageId: string) => void;
};

export function ImagesSection(props: ImagesSectionProps) {
  const {
    products,
    selectedProduct,
    imageForm,
    imageMessage,
    editingImageId,
    onSubmit,
    onImageFormChange,
    onCancelEdit,
    onEditImage,
    onDeleteImage,
  } = props;

  return (
    <>
      <section className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <form onSubmit={onSubmit} className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Image ID *</label>
              <input
                className="form-control"
                value={imageForm.id}
                disabled={editingImageId !== null}
                onChange={(event) => onImageFormChange({ id: event.target.value })}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Product *</label>
              <select
                className="form-select"
                value={imageForm.productId}
                onChange={(event) => onImageFormChange({ productId: event.target.value })}
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
              <label className="form-label">Variant (optional)</label>
              <input
                className="form-control"
                value={imageForm.variantId}
                onChange={(event) => onImageFormChange({ variantId: event.target.value })}
              />
            </div>
            <div className="col-md-8">
              <label className="form-label">URL *</label>
              <input
                className="form-control"
                value={imageForm.url}
                onChange={(event) => onImageFormChange({ url: event.target.value })}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Alt text</label>
              <input
                className="form-control"
                value={imageForm.altText}
                onChange={(event) => onImageFormChange({ altText: event.target.value })}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Sort order</label>
              <input
                type="number"
                className="form-control"
                value={imageForm.sortOrder}
                onChange={(event) => onImageFormChange({ sortOrder: Number(event.target.value) })}
              />
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="isPrimaryImage"
                  checked={imageForm.isPrimary}
                  onChange={(event) => onImageFormChange({ isPrimary: event.target.checked })}
                />
                <label htmlFor="isPrimaryImage" className="form-check-label">
                  Is primary
                </label>
              </div>
            </div>
            <div className="col-12 d-flex gap-2">
              <button className="btn btn-dark" type="submit">
                {editingImageId ? 'Update image' : 'Create image'}
              </button>
              {editingImageId && (
                <button type="button" className="btn btn-outline-secondary" onClick={onCancelEdit}>
                  Cancel
                </button>
              )}
            </div>
          </form>
          {imageMessage && <div className="alert alert-info mt-3 mb-0">{imageMessage}</div>}
        </div>
      </section>
      <section className="card border-0 shadow-sm">
        <div className="card-body">
          <h2 className="h5 mb-3">Images of selected product</h2>
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>URL</th>
                  <th>Variant</th>
                  <th>Primary</th>
                  <th style={{ width: 180 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(selectedProduct?.images ?? []).map((image) => (
                  <tr key={image.id}>
                    <td className="small">{image.id}</td>
                    <td className="small text-truncate" style={{ maxWidth: 240 }}>
                      {image.url}
                    </td>
                    <td>{image.variantId ?? '-'}</td>
                    <td>{image.isPrimary ? 'Yes' : 'No'}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-dark"
                          onClick={() => onEditImage(image.id)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => onDeleteImage(image.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(selectedProduct?.images.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={5} className="text-secondary">
                      No images found for selected product.
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
