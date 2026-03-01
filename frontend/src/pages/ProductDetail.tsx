import { Link, useParams } from 'react-router-dom';
import {
  FALLBACK_PRODUCT_IMAGE_LARGE,
  formatPrice,
  getProductPrice,
  resolveImageUrl,
} from '../shared/product-utils';
import type { Product, StockItem } from '../shared/types';

type ProductDetailProps = {
  products: Product[];
  inventoryByProduct: Map<string, StockItem>;
  loading: boolean;
  onAddToCart: (product: Product) => void;
};

export function ProductDetail(props: ProductDetailProps) {
  const { products, inventoryByProduct, loading, onAddToCart } = props;
  const { productId = '' } = useParams();

  const product = products.find((item) => item.id === productId) ?? null;
  const stock = product ? inventoryByProduct.get(product.id) : undefined;
  const isOutOfStock =
    !stock || !stock.isAvailable || stock.quantityAvailable <= 0;

  return (
    <main className="container py-5">
      <section className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <Link className="btn btn-outline-secondary btn-sm mb-4" to="/">
            Back to products
          </Link>

          {!product && !loading && (
            <div className="alert alert-warning mb-0">Product not found.</div>
          )}

          {loading && <div className="alert alert-info mb-0">Loading product...</div>}

          {product && (
            <div className="row g-4">
              <div className="col-lg-6">
                <img
                  src={resolveImageUrl(
                    product.images[0]?.url,
                    FALLBACK_PRODUCT_IMAGE_LARGE,
                  )}
                  alt={product.images[0]?.altText ?? product.name}
                  className="img-fluid rounded-4 border"
                  onError={(event) => {
                    event.currentTarget.src = FALLBACK_PRODUCT_IMAGE_LARGE;
                  }}
                />
              </div>
              <div className="col-lg-6">
                <p className="text-uppercase small text-secondary mb-2">{product.brand}</p>
                <h1 className="h3 mb-2">{product.name}</h1>
                <p className="text-secondary">{product.description}</p>

                <div className="mb-3">
                  <strong>{formatPrice(getProductPrice(product))}</strong>
                </div>

                {stock && stock.quantityAvailable > 0 && stock.quantityAvailable < 10 && (
                  <div className="alert alert-warning py-2">
                    Solo quedan {stock.quantityAvailable} unidades.
                  </div>
                )}

                {isOutOfStock && (
                  <div className="alert alert-danger py-2">Producto sin stock.</div>
                )}

                <div className="mb-3">
                  {product.categories.map((productCategory) => (
                    <span key={productCategory.id} className="badge text-bg-light me-2">
                      {productCategory.slug}
                    </span>
                  ))}
                </div>

                <div className="mb-4">
                  <h2 className="h6">Variants</h2>
                  <ul className="list-group">
                    {product.variants.map((variant) => (
                      <li className="list-group-item" key={variant.id}>
                        {variant.id}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  className="btn btn-dark"
                  disabled={isOutOfStock}
                  onClick={() => onAddToCart(product)}
                >
                  {isOutOfStock ? 'Out of stock' : 'Add to cart'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
