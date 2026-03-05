import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { AdminDashboard } from './pages/AdminDashboard';
import { HomePage } from './pages/HomePage';
import { ProductDetail } from './pages/ProductDetail';
import { MyOrders } from './pages/MyOrders';
import { useAuthSession } from './hooks/useAuthSession';
import { apiFetch } from './shared/api';
import { getCartStorageKey, hydrateCartItems } from './shared/cart-utils';
import { formatPrice, getProductPrice } from './shared/product-utils';
import type {
  CartResponse,
  CartItem,
  Product,
  ShippingAddress,
  ShippingQuote,
  StockItem,
  StoredCartItem,
} from './shared/types';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [bestSellerProducts, setBestSellerProducts] = useState<Product[]>([]);
  const [newArrivalProducts, setNewArrivalProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isNavbarOpen, setIsNavbarOpen] = useState(false);
  const {
    token,
    role,
    authUsername,
    isAuthenticated,
    authMode,
    username,
    password,
    authError,
    authMessage,
    setAuthMode,
    setUsername,
    setPassword,
    setAuthError,
    setAuthMessage,
    login,
    register,
    logout,
  } = useAuthSession();

  const [guestCartItems, setGuestCartItems] = useState<CartItem[]>([]);
  const [serverCartItems, setServerCartItems] = useState<StoredCartItem[]>([]);
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'AUTO' | 'YAPE'>('AUTO');
  const [yapePending, setYapePending] = useState<{
    orderId: string;
    qrData: string;
    operationHint: string;
  } | null>(null);
  const [yapeOperationCode, setYapeOperationCode] = useState('');
  const [shippingAddresses, setShippingAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [addressMessage, setAddressMessage] = useState('');
  const [addressForm, setAddressForm] = useState({
    label: 'Casa',
    recipientName: '',
    phone: '',
    line1: '',
    district: '',
    city: 'Lima',
    region: 'Lima',
  });

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [brand, setBrand] = useState('all');
  const [maxPrice, setMaxPrice] = useState<number>(500);

  const notifyCartSync = useCallback(() => {
    if (typeof BroadcastChannel === 'undefined') {
      return;
    }

    const channel = new BroadcastChannel(
      `fitstore-cart-sync:${authUsername || 'guest'}`,
    );
    channel.postMessage({ type: 'cart-updated' });
    channel.close();
  }, [authUsername]);

  const loadServerCart = useCallback(async () => {
    if (!token) {
      setServerCartItems([]);
      return;
    }

    const data = await apiFetch<CartResponse>('/cart', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setServerCartItems(data.items);
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) {
      return;
    }

    const usernameKey = authUsername || 'guest';
    const storageKey = getCartStorageKey(usernameKey);
    const raw = localStorage.getItem(storageKey);

    if (!raw) {
      setGuestCartItems([]);
      return;
    }

    try {
      setGuestCartItems(JSON.parse(raw) as CartItem[]);
    } catch {
      setGuestCartItems([]);
    }
  }, [authUsername, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      return;
    }

    const usernameKey = authUsername || 'guest';
    const storageKey = getCartStorageKey(usernameKey);
    localStorage.setItem(storageKey, JSON.stringify(guestCartItems));
  }, [guestCartItems, authUsername, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setServerCartItems([]);
      return;
    }

    let ignore = false;

    async function syncAuthenticatedCart() {
      try {
        const data = await apiFetch<CartResponse>('/cart', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!ignore) {
          setServerCartItems(data.items);
        }
      } catch {
        if (!ignore) {
          setServerCartItems([]);
        }
      }
    }

    void syncAuthenticatedCart();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, token]);

  useEffect(() => {
    const usernameKey = authUsername || 'guest';
    const storageKey = getCartStorageKey(usernameKey);
    const channel =
      typeof BroadcastChannel !== 'undefined'
        ? new BroadcastChannel(`fitstore-cart-sync:${usernameKey}`)
        : null;

    function syncFromStorage() {
      const raw = localStorage.getItem(storageKey);

      if (!raw) {
        setGuestCartItems([]);
        return;
      }

      try {
        setGuestCartItems(JSON.parse(raw) as CartItem[]);
      } catch {
        setGuestCartItems([]);
      }
    }

    function handleStorage(event: StorageEvent) {
      if (!isAuthenticated && event.key === storageKey) {
        syncFromStorage();
      }
    }

    function handleMessage() {
      if (isAuthenticated) {
        loadServerCart().catch(() => undefined);
        return;
      }

      syncFromStorage();
    }

    window.addEventListener('storage', handleStorage);
    channel?.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      channel?.removeEventListener('message', handleMessage);
      channel?.close();
    };
  }, [authUsername, isAuthenticated, loadServerCart]);

  useEffect(() => {
    let ignore = false;

    async function loadProducts() {
      setLoading(true);
      setError('');

      try {
        const [productsData, inventoryData, bestSellersData, newArrivalsData] =
          await Promise.all([
          apiFetch<Product[]>('/products'),
          apiFetch<StockItem[]>('/inventory'),
          apiFetch<Product[]>('/products/best-sellers?limit=4'),
          apiFetch<Product[]>('/products/new-arrivals?limit=4'),
        ]);
        if (!ignore) {
          setProducts(productsData);
          setInventory(inventoryData);
          setBestSellerProducts(bestSellersData);
          setNewArrivalProducts(newArrivalsData);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(String(loadError));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    let ignore = false;

    async function loadAddresses() {
      try {
        const data = await apiFetch<ShippingAddress[]>('/me/addresses', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (ignore) {
          return;
        }

        setShippingAddresses(data);
        const defaultAddress = data.find((address) => address.isDefault) ?? data[0];
        setSelectedAddressId((current) =>
          current && data.some((address) => address.id === current)
            ? current
            : defaultAddress?.id ?? '',
        );
      } catch {
        if (!ignore) {
          setShippingAddresses([]);
          setSelectedAddressId('');
        }
      }
    }

    void loadAddresses();

    return () => {
      ignore = true;
    };
  }, [token]);

  const categories = useMemo(() => {
    const names = new Set<string>();
    products.forEach((product) => {
      product.categories.forEach((productCategory) => {
        names.add(productCategory.slug);
      });
    });

    return ['all', ...Array.from(names).sort()];
  }, [products]);

  const brands = useMemo(() => {
    const names = new Set<string>();
    products.forEach((product) => names.add(product.brand));
    return ['all', ...Array.from(names).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchQuery =
        normalizedQuery.length === 0 ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.description?.toLowerCase().includes(normalizedQuery) ||
        false;

      const matchCategory =
        category === 'all' ||
        product.categories.some(
          (productCategory) => productCategory.slug === category,
        );

      const matchBrand = brand === 'all' || product.brand === brand;
      const matchPrice = getProductPrice(product) <= maxPrice;

      return matchQuery && matchCategory && matchBrand && matchPrice;
    });
  }, [products, query, category, brand, maxPrice]);

  const inventoryByProduct = useMemo(() => {
    const map = new Map<string, StockItem>();

    for (const item of inventory) {
      if (item.variantId === null) {
        map.set(item.productId, item);
      }
    }

    return map;
  }, [inventory]);

  const cartItems = useMemo(
    () =>
      isAuthenticated
        ? hydrateCartItems(serverCartItems, products)
        : guestCartItems,
    [isAuthenticated, serverCartItems, products, guestCartItems],
  );

  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems],
  );

  const cartTotal = useMemo(
    () => cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
    [cartItems],
  );

  const checkoutTotal = useMemo(
    () => cartTotal + (shippingQuote?.shippingCost ?? 0),
    [cartTotal, shippingQuote],
  );

  useEffect(() => {
    if (!token || !selectedAddressId || cartItems.length === 0) {
      setShippingQuote(null);
      return;
    }

    let ignore = false;

    async function loadQuote() {
      setShippingLoading(true);

      try {
        const quote = await apiFetch<ShippingQuote>('/shipping/quote', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            addressId: selectedAddressId,
            items: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          }),
        });

        if (!ignore) {
          setShippingQuote(quote);
        }
      } catch {
        if (!ignore) {
          setShippingQuote(null);
        }
      } finally {
        if (!ignore) {
          setShippingLoading(false);
        }
      }
    }

    void loadQuote();

    return () => {
      ignore = true;
    };
  }, [token, selectedAddressId, cartItems]);

  function upsertServerCartState(item: StoredCartItem) {
    setServerCartItems((current) => {
      const next = current.filter(
        (currentItem) => currentItem.productId !== item.productId,
      );
      return [item, ...next];
    });
  }

  async function addToCart(product: Product) {
    const stock = inventoryByProduct.get(product.id);
    if (!stock || !stock.isAvailable || stock.quantityAvailable <= 0) {
      setCheckoutMessage('This product is out of stock.');
      return;
    }

    const currentQuantity =
      cartItems.find((item) => item.productId === product.id)?.quantity ?? 0;

    if (currentQuantity >= stock.quantityAvailable) {
      setCheckoutMessage(`Only ${stock.quantityAvailable} units available.`);
      return;
    }

    const nextQuantity = currentQuantity + 1;

    if (isAuthenticated) {
      try {
        const item = await apiFetch<StoredCartItem>('/cart/items', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: product.id,
            quantity: nextQuantity,
          }),
        });

        upsertServerCartState(item);
        notifyCartSync();
        setCheckoutMessage('');
      } catch (cartError) {
        setCheckoutMessage(String(cartError));
      }
      return;
    }

    const price = getProductPrice(product);

    setGuestCartItems((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (!existing) {
        return [
          ...current,
          {
            productId: product.id,
            name: product.name,
            price,
            quantity: 1,
          },
        ];
      }

      return current.map((item) =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      );
    });

    notifyCartSync();
    setCheckoutMessage('');
  }

  async function updateCartQuantity(productId: string, quantity: number) {
    const stock = inventoryByProduct.get(productId);

    if (quantity > 0 && stock && quantity > stock.quantityAvailable) {
      setCheckoutMessage(`Only ${stock.quantityAvailable} units available.`);
      return;
    }

    if (quantity <= 0) {
      if (isAuthenticated) {
        try {
          await apiFetch(`/cart/items/${productId}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setServerCartItems((current) =>
            current.filter((item) => item.productId !== productId),
          );
          notifyCartSync();
          setCheckoutMessage('');
        } catch (cartError) {
          setCheckoutMessage(String(cartError));
        }
        return;
      }

      setGuestCartItems((current) =>
        current.filter((item) => item.productId !== productId),
      );
      notifyCartSync();
      setCheckoutMessage('');
      return;
    }

    if (isAuthenticated) {
      try {
        const item = await apiFetch<StoredCartItem>(`/cart/items/${productId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ quantity }),
        });
        upsertServerCartState(item);
        notifyCartSync();
        setCheckoutMessage('');
      } catch (cartError) {
        setCheckoutMessage(String(cartError));
      }
      return;
    }

    setGuestCartItems((current) =>
      current.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
    );
    notifyCartSync();
    setCheckoutMessage('');
  }

  async function handleAuthSubmit(event: FormEvent) {
    event.preventDefault();

    if (authMode === 'login') {
      const success = await login();
      if (success) {
        setIsLoginModalOpen(false);
      }
      return;
    }

    await register();
  }

  function handleLogout() {
    logout();
    setServerCartItems([]);
    setShippingAddresses([]);
    setSelectedAddressId('');
    setShippingQuote(null);
  }

  async function handleCreateAddress(event: FormEvent) {
    event.preventDefault();

    if (!token) {
      setAddressMessage('Login required to save addresses.');
      return;
    }

    try {
      const created = await apiFetch<ShippingAddress>('/me/addresses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...addressForm,
          isDefault: shippingAddresses.length === 0,
        }),
      });

      setShippingAddresses((current) => {
        const next = [created, ...current.filter((item) => item.id !== created.id)];
        return next.sort((left, right) => Number(right.isDefault) - Number(left.isDefault));
      });
      setSelectedAddressId(created.id);
      setAddressMessage('Shipping address saved.');
      setAddressForm((current) => ({
        ...current,
        line1: '',
        district: '',
      }));
    } catch (addressError) {
      setAddressMessage(String(addressError));
    }
  }

  async function handleDeleteAddress(addressId: string) {
    if (!token) {
      return;
    }

    try {
      await apiFetch(`/me/addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const nextAddresses = shippingAddresses.filter((address) => address.id !== addressId);
      setShippingAddresses(nextAddresses);
      if (selectedAddressId === addressId) {
        const nextDefault =
          nextAddresses.find((address) => address.isDefault) ?? nextAddresses[0];
        setSelectedAddressId(nextDefault?.id ?? '');
      }
      setAddressMessage('Shipping address removed.');
    } catch (addressError) {
      setAddressMessage(String(addressError));
    }
  }

  async function handleCheckout() {
    if (cartItems.length === 0) {
      setCheckoutMessage('Your cart is empty.');
      return;
    }

    if (!token) {
      setCheckoutMessage('You need to login before checkout.');
      setIsLoginModalOpen(true);
      return;
    }

    if (!selectedAddressId) {
      setCheckoutMessage('Select a shipping address before checkout.');
      return;
    }

    setCheckoutMessage('Processing order...');

    try {
      const data = await apiFetch<{ id: string }>('/orders', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentMethod,
          shippingAddressId: selectedAddressId,
          items: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      if (paymentMethod === 'YAPE') {
        const yapeStart = await apiFetch<{
          orderId: string;
          yape: { qrData: string; operationHint: string };
        }>('/payments/yape/start', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId: data.id,
          }),
        });

        await apiFetch('/cart', {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setServerCartItems([]);
        notifyCartSync();
        setShippingQuote(null);

        setYapePending({
          orderId: yapeStart.orderId,
          qrData: yapeStart.yape.qrData,
          operationHint: yapeStart.yape.operationHint,
        });
        setCheckoutMessage(
          `Order created with YAPE. Complete payment and confirm operation code.`,
        );
      } else {
        setCheckoutMessage(`Order created successfully. Order ID: ${data.id}`);
        await apiFetch('/cart', {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setServerCartItems([]);
        notifyCartSync();
        setShippingQuote(null);
      }
    } catch (checkoutError) {
      setCheckoutMessage(String(checkoutError));
    }
  }

  async function handleConfirmYapePayment() {
    if (!yapePending) {
      return;
    }

    if (!yapeOperationCode.trim()) {
      setCheckoutMessage('Enter YAPE operation code before confirming.');
      return;
    }

    try {
      await apiFetch('/payments/yape/confirm', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: yapePending.orderId,
          operationCode: yapeOperationCode.trim(),
        }),
      });

      setCheckoutMessage(
        `YAPE payment confirmed. Order ID: ${yapePending.orderId}`,
      );
      setYapePending(null);
      setYapeOperationCode('');
    } catch (confirmError) {
      setCheckoutMessage(String(confirmError));
    }
  }

  return (
    <div className="landing-page">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-sm">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">
            FitStore
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            onClick={() => setIsNavbarOpen((current) => !current)}
            aria-controls="navbarMain"
            aria-expanded={isNavbarOpen}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>
          <div
            className={`collapse navbar-collapse ${isNavbarOpen ? 'show' : ''}`}
            id="navbarMain"
          >
            <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
              <li className="nav-item">
                <Link
                  className="nav-link"
                  to="/"
                  onClick={() => setIsNavbarOpen(false)}
                >
                  Products
                </Link>
              </li>
              {token && (
                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to="/orders/my"
                    onClick={() => setIsNavbarOpen(false)}
                  >
                    My Orders
                  </Link>
                </li>
              )}
              {role === 'ADMIN' && (
                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to="/admin/dashboard"
                    onClick={() => setIsNavbarOpen(false)}
                  >
                    Dashboard
                  </Link>
                </li>
              )}
              <li className="nav-item">
                <button
                  className="btn btn-outline-light btn-sm"
                  onClick={() => {
                    setAuthError('');
                    setAuthMessage('');
                    setIsLoginModalOpen(true);
                  }}
                >
                  {token ? authUsername || 'Account' : 'Login'}
                </button>
              </li>
              <li className="nav-item">
                <button
                  className="btn btn-light btn-sm position-relative"
                  onClick={() => setIsCartModalOpen(true)}
                  aria-label="Open cart"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M0 1.5A.5.5 0 0 1 .5 1h1a.5.5 0 0 1 .485.379L2.89 5H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 14H4a.5.5 0 0 1-.49-.408L1.01 2H.5a.5.5 0 0 1-.5-.5M3.102 6l1.313 7h8.17l1.313-7zM5 16a1 1 0 1 0 0-2 1 1 0 0 0 0 2m7 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2" />
                  </svg>
                  {cartCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill text-bg-danger">
                      {cartCount}
                    </span>
                  )}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              loading={loading}
              error={error}
              query={query}
              category={category}
              brand={brand}
              maxPrice={maxPrice}
              categories={categories}
              brands={brands}
              filteredProducts={filteredProducts}
              bestSellers={bestSellerProducts}
              newArrivals={newArrivalProducts}
              inventoryByProduct={inventoryByProduct}
              onQueryChange={setQuery}
              onCategoryChange={setCategory}
              onBrandChange={setBrand}
              onMaxPriceChange={setMaxPrice}
              onAddToCart={addToCart}
            />
          }
        />
        <Route
          path="/product/:productId"
          element={
            <ProductDetail
              products={products}
              inventoryByProduct={inventoryByProduct}
              loading={loading}
              onAddToCart={addToCart}
            />
          }
        />
        <Route
          path="/orders/my"
          element={token ? <MyOrders token={token} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/admin/dashboard"
          element={
            role === 'ADMIN' && token ? (
              <AdminDashboard token={token} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <footer id="footer" className="site-footer text-light mt-5 pt-5 pb-4">
        <div className="container">
          <div className="row g-4 mb-4">
            <div className="col-lg-4">
              <h4 className="h5 mb-3">FitStore</h4>
              <p className="text-light-emphasis mb-3">
                E-commerce deportivo conectado a microservicios NestJS, pensado para
                escalar catalogo, ordenes, pagos e inventario.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <span className="footer-pill">Catalog</span>
                <span className="footer-pill">Inventory</span>
                <span className="footer-pill">Orders</span>
                <span className="footer-pill">Payments</span>
              </div>
            </div>

            <div className="col-sm-6 col-lg-2">
              <h5 className="h6 text-uppercase mb-3">Shop</h5>
              <ul className="list-unstyled mb-0 footer-links">
                <li><a href="#featured-products">Destacados</a></li>
                <li><a href="#products">Productos</a></li>
                <li><a href="#filters">Filtros</a></li>
              </ul>
            </div>

            <div className="col-sm-6 col-lg-3">
              <h5 className="h6 text-uppercase mb-3">Cuenta</h5>
              <ul className="list-unstyled mb-0 footer-links">
                <li><span>{token ? `Sesion: ${authUsername}` : 'No has iniciado sesion'}</span></li>
                <li><span>{token ? `Rol: ${role || 'USER'}` : 'Acceso invitado'}</span></li>
                <li><span>Carrito: {cartCount} items</span></li>
              </ul>
            </div>

            <div className="col-lg-3">
              <h5 className="h6 text-uppercase mb-3">Contacto</h5>
              <ul className="list-unstyled mb-3 footer-links">
                <li><span>support@fitstore.dev</span></li>
                <li><span>Lima, Peru</span></li>
                <li><span>Atencion 24/7 para integraciones</span></li>
              </ul>
              <div className="footer-status">
                <strong>API:</strong> {error ? 'Disconnected' : 'Connected'}
              </div>
            </div>
          </div>

          <div className="footer-bottom d-flex flex-column flex-md-row justify-content-between gap-2">
            <small className="text-light-emphasis">
              © 2026 FitStore. Frontend React + backend NestJS.
            </small>
            <small className="text-light-emphasis">
              Checkout, auth y panel admin integrados.
            </small>
          </div>
        </div>
      </footer>

      {isLoginModalOpen && (
        <>
          <div className="modal d-block" role="dialog" tabIndex={-1}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {authMode === 'login' ? 'Login' : 'Register'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setIsLoginModalOpen(false)}
                  />
                </div>

                <div className="px-3 pt-3">
                  <div className="btn-group w-100" role="group" aria-label="Auth mode">
                    <button
                      type="button"
                      className={`btn btn-sm ${
                        authMode === 'login' ? 'btn-dark' : 'btn-outline-dark'
                      }`}
                      onClick={() => {
                        setAuthMode('login');
                        setAuthError('');
                        setAuthMessage('');
                      }}
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${
                        authMode === 'register' ? 'btn-dark' : 'btn-outline-dark'
                      }`}
                      onClick={() => {
                        setAuthMode('register');
                        setAuthError('');
                        setAuthMessage('');
                      }}
                    >
                      Register
                    </button>
                  </div>
                </div>

                <form onSubmit={handleAuthSubmit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Username</label>
                      <input
                        className="form-control"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                      />
                      {authMode === 'register' && (
                        <small className="text-secondary">
                          Password must be at least 6 characters.
                        </small>
                      )}
                    </div>
                    {authMessage && (
                      <div className="alert alert-success mb-3">{authMessage}</div>
                    )}
                    {authError && <div className="alert alert-danger mb-0">{authError}</div>}
                  </div>
                  <div className="modal-footer">
                    {token && (
                      <button
                        type="button"
                        className="btn btn-outline-danger me-auto"
                        onClick={handleLogout}
                      >
                        Logout
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setIsLoginModalOpen(false)}
                    >
                      Close
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {authMode === 'login' ? 'Login' : 'Create account'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" />
        </>
      )}

      {isCartModalOpen && (
        <>
          <div className="modal d-block" role="dialog" tabIndex={-1}>
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Shopping cart</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setIsCartModalOpen(false)}
                  />
                </div>
                <div className="modal-body">
                  {cartItems.length === 0 ? (
                    <p className="text-secondary mb-0">Your cart is empty.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table align-middle">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Price</th>
                            <th style={{ width: 120 }}>Qty</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cartItems.map((item) => (
                            <tr key={item.productId}>
                              <td>{item.name}</td>
                              <td>{formatPrice(item.price)}</td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  min={0}
                                  value={item.quantity}
                                  onChange={(event) =>
                                    updateCartQuantity(
                                      item.productId,
                                      Number(event.target.value),
                                    )
                                  }
                                />
                              </td>
                              <td>{formatPrice(item.price * item.quantity)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {token && (
                    <div className="card border-0 bg-light mb-3">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="mb-0">Shipping address</h6>
                          {shippingLoading && (
                            <small className="text-secondary">Calculating quote...</small>
                          )}
                        </div>

                        {shippingAddresses.length > 0 ? (
                          <div className="mb-3">
                            <label className="form-label">Select address</label>
                            <select
                              className="form-select"
                              value={selectedAddressId}
                              onChange={(event) => setSelectedAddressId(event.target.value)}
                            >
                              <option value="">Select address</option>
                              {shippingAddresses.map((address) => (
                                <option key={address.id} value={address.id}>
                                  {address.label} - {address.district}, {address.city}
                                  {address.isDefault ? ' (Default)' : ''}
                                </option>
                              ))}
                            </select>
                            {selectedAddressId && (
                              <div className="mt-2">
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => handleDeleteAddress(selectedAddressId)}
                                >
                                  Delete selected address
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="small text-secondary mb-3">
                            No saved addresses yet. Add one to continue.
                          </p>
                        )}

                        <form onSubmit={handleCreateAddress}>
                          <div className="row g-2">
                            <div className="col-md-4">
                              <input
                                className="form-control form-control-sm"
                                placeholder="Label"
                                value={addressForm.label}
                                onChange={(event) =>
                                  setAddressForm((current) => ({
                                    ...current,
                                    label: event.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="col-md-4">
                              <input
                                className="form-control form-control-sm"
                                placeholder="Recipient"
                                value={addressForm.recipientName}
                                onChange={(event) =>
                                  setAddressForm((current) => ({
                                    ...current,
                                    recipientName: event.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="col-md-4">
                              <input
                                className="form-control form-control-sm"
                                placeholder="Phone"
                                value={addressForm.phone}
                                onChange={(event) =>
                                  setAddressForm((current) => ({
                                    ...current,
                                    phone: event.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="col-12">
                              <input
                                className="form-control form-control-sm"
                                placeholder="Address line"
                                value={addressForm.line1}
                                onChange={(event) =>
                                  setAddressForm((current) => ({
                                    ...current,
                                    line1: event.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="col-md-4">
                              <input
                                className="form-control form-control-sm"
                                placeholder="District"
                                value={addressForm.district}
                                onChange={(event) =>
                                  setAddressForm((current) => ({
                                    ...current,
                                    district: event.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="col-md-4">
                              <input
                                className="form-control form-control-sm"
                                placeholder="City"
                                value={addressForm.city}
                                onChange={(event) =>
                                  setAddressForm((current) => ({
                                    ...current,
                                    city: event.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="col-md-4">
                              <input
                                className="form-control form-control-sm"
                                placeholder="Region"
                                value={addressForm.region}
                                onChange={(event) =>
                                  setAddressForm((current) => ({
                                    ...current,
                                    region: event.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="col-12 d-flex justify-content-between align-items-center">
                              <small className="text-secondary">
                                Save addresses to quote delivery before checkout.
                              </small>
                              <button type="submit" className="btn btn-outline-dark btn-sm">
                                Save address
                              </button>
                            </div>
                          </div>
                        </form>

                        {addressMessage && (
                          <div className="alert alert-secondary mt-3 mb-0 py-2">
                            {addressMessage}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {token && selectedAddressId && shippingQuote && (
                    <div className="alert alert-secondary">
                      <div className="d-flex justify-content-between">
                        <span>
                          Shipping ({shippingQuote.serviceLevel}, {shippingQuote.estimatedDeliveryDays}{' '}
                          days)
                        </span>
                        <strong>{formatPrice(shippingQuote.shippingCost)}</strong>
                      </div>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label">Payment method</label>
                    <select
                      className="form-select"
                      value={paymentMethod}
                      onChange={(event) =>
                        setPaymentMethod(event.target.value as 'AUTO' | 'YAPE')
                      }
                    >
                      <option value="AUTO">Card/Auto approval (demo)</option>
                      <option value="YAPE">YAPE (Peru - simulated)</option>
                    </select>
                  </div>

                  {yapePending && (
                    <div className="alert alert-warning">
                      <p className="mb-1">
                        <strong>YAPE pending payment</strong>
                      </p>
                      <p className="mb-1 small">
                        Order: {yapePending.orderId}
                      </p>
                      <p className="mb-1 small">
                        Operation hint: {yapePending.operationHint}
                      </p>
                      <p className="mb-2 small text-break">
                        QR data: {yapePending.qrData}
                      </p>
                      <div className="d-flex gap-2">
                        <input
                          className="form-control form-control-sm"
                          placeholder="Operation code"
                          value={yapeOperationCode}
                          onChange={(event) =>
                            setYapeOperationCode(event.target.value)
                          }
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-dark"
                          onClick={handleConfirmYapePayment}
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  )}

                  {checkoutMessage && (
                    <div className="alert alert-info mb-0">{checkoutMessage}</div>
                  )}
                </div>
                <div className="modal-footer d-flex justify-content-between">
                  <div>
                    <div className="small text-secondary">
                      Subtotal: {formatPrice(cartTotal)}
                    </div>
                    <strong>Total: {formatPrice(checkoutTotal)}</strong>
                  </div>
                  <div>
                    <button
                      type="button"
                      className="btn btn-secondary me-2"
                      onClick={() => setIsCartModalOpen(false)}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleCheckout}
                    >
                      Checkout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" />
        </>
      )}
    </div>
  );
}
