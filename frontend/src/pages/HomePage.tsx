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
  bestSellers: Product[];
  newArrivals: Product[];
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
    bestSellers,
    newArrivals,
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
  const fallbackBestSellers = [...filteredProducts]
    .sort((left, right) => getProductPrice(right) - getProductPrice(left))
    .slice(0, 4);
  const fallbackNewArrivals = [...filteredProducts]
    .slice()
    .reverse()
    .slice(0, 4);
  const bestSellersToRender = bestSellers.length > 0 ? bestSellers : fallbackBestSellers;
  const newArrivalsToRender =
    newArrivals.length > 0 ? newArrivals : fallbackNewArrivals;
  const collectionCategories = categories.filter((value) => value !== 'All').slice(0, 4);
  const hasProducts = filteredProducts.length > 0;

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
        <section className="trust-strip card border-0 shadow-sm mb-4">
          <div className="card-body py-3">
            <div className="row g-3 text-center text-md-start">
              <div className="col-md-3">
                <p className="small text-secondary mb-1">Shipping</p>
                <p className="mb-0 fw-semibold">Entrega en 24-72 horas</p>
              </div>
              <div className="col-md-3">
                <p className="small text-secondary mb-1">Returns</p>
                <p className="mb-0 fw-semibold">Cambios en 30 dias</p>
              </div>
              <div className="col-md-3">
                <p className="small text-secondary mb-1">Payments</p>
                <p className="mb-0 fw-semibold">Pago seguro y protegido</p>
              </div>
              <div className="col-md-3">
                <p className="small text-secondary mb-1">Support</p>
                <p className="mb-0 fw-semibold">Atencion 24/7</p>
              </div>
            </div>
          </div>
        </section>

        <section id="collections" className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h3 mb-0">Colecciones</h2>
            <span className="text-secondary small">Compra por objetivo de entrenamiento</span>
          </div>
          <div className="row g-3">
            {collectionCategories.map((value) => (
              <div className="col-6 col-md-3" key={value}>
                <button
                  type="button"
                  className="btn btn-outline-dark w-100 py-3 collection-card"
                  onClick={() => onCategoryChange(value)}
                >
                  {value}
                </button>
              </div>
            ))}
            {collectionCategories.length === 0 && (
              <div className="col-12">
                <div className="alert alert-secondary mb-0">No hay colecciones disponibles.</div>
              </div>
            )}
          </div>
        </section>

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

        <section id="promo" className="promo-banner card border-0 shadow-sm mb-5">
          <div className="card-body p-4 p-lg-5">
            <div className="row g-4 align-items-center">
              <div className="col-lg-8">
                <p className="text-uppercase small text-secondary mb-1">Oferta destacada</p>
                <h2 className="h3 mb-2">Hasta 30% off en Running y Training</h2>
                <p className="mb-0 text-secondary">
                  Activa hoy en productos seleccionados. Valida disponibilidad por talla y stock.
                </p>
              </div>
              <div className="col-lg-4">
                <div className="d-flex gap-2 justify-content-lg-end">
                  <span className="promo-time-pill">09d</span>
                  <span className="promo-time-pill">14h</span>
                  <span className="promo-time-pill">38m</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="filters" className="card border-0 shadow-sm mb-5 sticky-filter-card">
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
            <div className="d-flex gap-2 mt-3">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  onQueryChange('');
                  onCategoryChange('All');
                  onBrandChange('All');
                  onMaxPriceChange(500);
                }}
              >
                Reset filters
              </button>
            </div>
          </div>
        </section>

        <section id="best-sellers" className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h3 mb-0">Best Sellers</h2>
            <span className="text-secondary small">Lo mas vendido</span>
          </div>
          <div className="row g-4">
            {bestSellersToRender.map((product) => {
              const imageUrl = resolveImageUrl(product.images[0]?.url, FALLBACK_PRODUCT_IMAGE);
              return (
                <div className="col-md-6 col-xl-3" key={`best-${product.id}`}>
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
                    <div className="card-body">
                      <p className="text-uppercase small text-secondary mb-2">{product.brand}</p>
                      <h3 className="h6 mb-2">{product.name}</h3>
                      <div className="d-flex justify-content-between align-items-center">
                        <strong>{formatPrice(getProductPrice(product))}</strong>
                        <button
                          className="btn btn-outline-dark btn-sm"
                          onClick={() => onAddToCart(product)}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}
            {bestSellersToRender.length === 0 && (
              <div className="col-12">
                <div className="alert alert-secondary mb-0">No hay best sellers disponibles.</div>
              </div>
            )}
          </div>
        </section>

        <section id="new-arrivals" className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h3 mb-0">New Arrivals</h2>
            <span className="text-secondary small">Nuevos ingresos en catalogo</span>
          </div>
          <div className="row g-3">
            {newArrivalsToRender.map((product) => (
              <div className="col-md-6" key={`new-${product.id}`}>
                <article className="card border-0 shadow-sm h-100">
                  <div className="card-body d-flex justify-content-between align-items-start gap-3">
                    <div>
                      <p className="small text-secondary text-uppercase mb-1">{product.brand}</p>
                      <h3 className="h6 mb-1">{product.name}</h3>
                      <p className="small text-secondary mb-0">
                        {product.description ?? 'No description available'}
                      </p>
                    </div>
                    <div className="text-end">
                      <strong className="d-block mb-2">{formatPrice(getProductPrice(product))}</strong>
                      <Link to={`/product/${product.id}`} className="btn btn-sm btn-dark">
                        Ver
                      </Link>
                    </div>
                  </div>
                </article>
              </div>
            ))}
            {newArrivalsToRender.length === 0 && (
              <div className="col-12">
                <div className="alert alert-secondary mb-0">No hay nuevos ingresos.</div>
              </div>
            )}
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
            {!loading && !error && !hasProducts && (
              <div className="col-12">
                <div className="alert alert-secondary mb-0">
                  No products match the current filters.
                </div>
              </div>
            )}
          </div>
        </section>

        <section id="social-proof" className="mt-5 mb-5">
          <div className="row g-4">
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <p className="small text-secondary mb-2">Clientes activos</p>
                  <p className="display-6 fw-bold mb-1">12K+</p>
                  <p className="mb-0 text-secondary">Compradores en Peru y LATAM.</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <p className="small text-secondary mb-2">Valoracion promedio</p>
                  <p className="display-6 fw-bold mb-1">4.8/5</p>
                  <p className="mb-0 text-secondary">Resenas verificadas de productos.</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <p className="small text-secondary mb-2">Entrega a tiempo</p>
                  <p className="display-6 fw-bold mb-1">97%</p>
                  <p className="mb-0 text-secondary">Cumplimiento logístico mensual.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="newsletter" className="newsletter card border-0 shadow-sm mt-4">
          <div className="card-body p-4 p-lg-5">
            <div className="row g-3 align-items-center">
              <div className="col-lg-7">
                <h2 className="h4 mb-2">Recibe ofertas y lanzamientos</h2>
                <p className="mb-0 text-secondary">
                  Suscribete y recibe un descuento para tu primera compra.
                </p>
              </div>
              <div className="col-lg-5">
                <form
                  className="d-flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                  }}
                >
                  <input
                    type="email"
                    className="form-control"
                    placeholder="tu-email@correo.com"
                    required
                  />
                  <button type="submit" className="btn btn-dark">
                    Suscribir
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
