import { Link } from 'react-router-dom';
import {
  FALLBACK_PRODUCT_IMAGE,
  formatPrice,
  getProductPrice,
  resolveImageUrl,
} from '../shared/product-utils';
import type { Product, StockItem } from '../shared/types';

type HomePageProps = {
  loading: boolean;
  error: string;
  query: string;
  category: string;
  brand: string;
  maxPrice: number;
  categories: string[];
  brands: string[];
  filteredProducts: Product[];
  inventoryByProduct: Map<string, StockItem>;
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onMaxPriceChange: (value: number) => void;
  onAddToCart: (product: Product) => void;
};

export function HomePage(props: HomePageProps) {
  const {
    loading,
    error,
    query,
    category,
    brand,
    maxPrice,
    categories,
    brands,
    filteredProducts,
    inventoryByProduct,
    onQueryChange,
    onCategoryChange,
    onBrandChange,
    onMaxPriceChange,
    onAddToCart,
  } = props;

  const featuredProducts = [...filteredProducts]
    .sort((left, right) => {
      const leftScore = left.variants.length * 100 - getProductPrice(left);
      const rightScore = right.variants.length * 100 - getProductPrice(right);
      return rightScore - leftScore;
    })
    .slice(0, 3);

  return (
    <>
      <header id="top" className="hero text-white">
        <div className="container py-5">
          <div className="row align-items-center g-4">
            <div className="col-lg-7">
              <span className="badge text-bg-warning mb-3">Spring Collection</span>
              <h1 className="display-5 fw-bold mb-3">Sportswear that moves with you</h1>
              <p className="lead mb-4">
                Discover performance shoes, breathable shirts, and training gear built
                for daily workouts.
              </p>
              <a href="#products" className="btn btn-light btn-lg px-4">
                Explore products
              </a>
            </div>
            <div className="col-lg-5">
              <div className="hero-card p-4 rounded-4 bg-white text-dark shadow">
                <p className="text-uppercase small text-secondary mb-1">Now available</p>
                <h3 className="h4 mb-2">New arrivals this week</h3>
                <p className="mb-0">
                  Track style, size, and price across categories directly from your
                  backend catalog.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-5">
        <section id="featured-products" className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h3 mb-0">Productos Destacados</h2>
            <span className="text-secondary small">Top picks de la semana</span>
          </div>
          <div className="row g-4">
            {featuredProducts.map((product) => {
              const productPrice = getProductPrice(product);
              const stock = inventoryByProduct.get(product.id);
              const isOutOfStock = !stock || !stock.isAvailable || stock.quantityAvailable <= 0;
              const imageUrl = resolveImageUrl(
                product.images[0]?.url,
                FALLBACK_PRODUCT_IMAGE,
              );

              return (
                <div className="col-md-6 col-xl-4" key={`featured-${product.id}`}>
                  <article className="card border-0 shadow-sm featured-card h-100">
                    <div className="position-relative">
                      <img
                        src={imageUrl}
                        className="card-img-top featured-image"
                        alt={product.images[0]?.altText ?? product.name}
                        onError={(event) => {
                          event.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                        }}
                      />
                      <span className="badge text-bg-dark featured-badge">Destacado</span>
                    </div>
                    <div className="card-body">
                      <p className="text-uppercase small text-secondary mb-2">{product.brand}</p>
                      <h3 className="h5 mb-2">{product.name}</h3>
                      {stock && stock.quantityAvailable > 0 && stock.quantityAvailable < 10 && (
                        <p className="small text-danger fw-semibold mb-2">
                          Solo quedan {stock.quantityAvailable}
                        </p>
                      )}
                      {isOutOfStock && (
                        <p className="small text-danger fw-semibold mb-2">Sin stock</p>
                      )}
                      <p className="text-secondary small mb-3">
                        {product.description ?? 'No description available'}
                      </p>
                      <div className="d-flex justify-content-between align-items-center">
                        <strong>{formatPrice(productPrice)}</strong>
                        <div className="d-flex gap-2">
                          <Link to={`/product/${product.id}`} className="btn btn-outline-dark btn-sm">
                            Ver
                          </Link>
                          <button
                            className="btn btn-dark btn-sm"
                            disabled={isOutOfStock}
                            onClick={() => onAddToCart(product)}
                          >
                            {isOutOfStock ? 'Agotado' : 'Add'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}
            {featuredProducts.length === 0 && (
              <div className="col-12">
                <div className="alert alert-secondary mb-0">
                  No hay productos destacados disponibles.
                </div>
              </div>
            )}
          </div>
        </section>

        <section id="filters" className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <label className="form-label">Search</label>
                <input
                  className="form-control"
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  placeholder="Search by name or description"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(event) => onCategoryChange(event.target.value)}
                >
                  {categories.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Brand</label>
                <select
                  className="form-select"
                  value={brand}
                  onChange={(event) => onBrandChange(event.target.value)}
                >
                  {brands.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label">Max ${maxPrice}</label>
                <input
                  type="range"
                  className="form-range"
                  min={10}
                  max={500}
                  step={5}
                  value={maxPrice}
                  onChange={(event) => onMaxPriceChange(Number(event.target.value))}
                />
              </div>
            </div>
          </div>
        </section>

        <section id="products">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h3 mb-0">Products</h2>
            <span className="text-secondary">{filteredProducts.length} found</span>
          </div>

          {loading && <div className="alert alert-info">Loading products...</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="row g-4">
            {filteredProducts.map((product) => {
              const productPrice = getProductPrice(product);
              const stock = inventoryByProduct.get(product.id);
              const isOutOfStock = !stock || !stock.isAvailable || stock.quantityAvailable <= 0;
              const imageUrl = resolveImageUrl(
                product.images[0]?.url,
                FALLBACK_PRODUCT_IMAGE,
              );

              return (
                <div className="col-md-6 col-lg-4" key={product.id}>
                  <article className="card border-0 shadow-sm h-100 product-card">
                    <Link to={`/product/${product.id}`}>
                      <img
                        src={imageUrl}
                        className="card-img-top product-image"
                        alt={product.images[0]?.altText ?? product.name}
                        onError={(event) => {
                          event.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                        }}
                      />
                    </Link>
                    <div className="card-body d-flex flex-column">
                      <p className="text-uppercase small text-secondary mb-2">
                        {product.brand}
                      </p>
                      <h3 className="h5">
                        <Link className="text-decoration-none text-dark" to={`/product/${product.id}`}>
                          {product.name}
                        </Link>
                      </h3>
                      {stock && stock.quantityAvailable > 0 && stock.quantityAvailable < 10 && (
                        <p className="small text-danger fw-semibold mb-2">
                          Solo quedan {stock.quantityAvailable}
                        </p>
                      )}
                      {isOutOfStock && (
                        <p className="small text-danger fw-semibold mb-2">Sin stock</p>
                      )}
                      <p className="text-secondary small flex-grow-1">
                        {product.description ?? 'No description available'}
                      </p>
                      <div className="mb-3">
                        {product.categories.map((productCategory) => (
                          <span key={productCategory.id} className="badge text-bg-light me-2">
                            {productCategory.slug}
                          </span>
                        ))}
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <strong>{formatPrice(productPrice)}</strong>
                        <button
                          className="btn btn-outline-dark btn-sm"
                          disabled={isOutOfStock}
                          onClick={() => onAddToCart(product)}
                        >
                          {isOutOfStock ? 'Out of stock' : 'Add to cart'}
                        </button>
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}
