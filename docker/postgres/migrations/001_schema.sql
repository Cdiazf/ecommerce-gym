CREATE DATABASE catalog_db;
CREATE DATABASE inventory_db;
CREATE DATABASE orders_db;
CREATE DATABASE payments_db;
CREATE DATABASE shipping_db;
CREATE DATABASE auth_db;

\connect auth_db

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'USER')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_shipping_addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT,
  district TEXT NOT NULL,
  city TEXT NOT NULL,
  region TEXT NOT NULL,
  postal_code TEXT,
  reference TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_shipping_addresses_user_default
  ON user_shipping_addresses (user_id, is_default DESC, updated_at DESC);

\connect catalog_db

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  brand TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  color TEXT,
  size TEXT,
  material TEXT,
  barcode TEXT UNIQUE,
  weight_grams INTEGER,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_prices (
  id TEXT PRIMARY KEY,
  variant_id TEXT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  currency CHAR(3) NOT NULL,
  list_price NUMERIC(10, 2) NOT NULL,
  sale_price NUMERIC(10, 2),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_images (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id TEXT REFERENCES product_variants(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS product_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id TEXT REFERENCES product_categories(id)
);

CREATE TABLE IF NOT EXISTS product_category_map (
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id
  ON product_variants (product_id);
CREATE INDEX IF NOT EXISTS idx_product_prices_variant_id
  ON product_prices (variant_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id
  ON product_images (product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_variant_id
  ON product_images (variant_id);
CREATE INDEX IF NOT EXISTS idx_product_category_map_product_id
  ON product_category_map (product_id);
CREATE INDEX IF NOT EXISTS idx_product_category_map_category_id
  ON product_category_map (category_id);

\connect inventory_db

CREATE TABLE IF NOT EXISTS inventory_items (
  product_id TEXT NOT NULL,
  variant_id TEXT NOT NULL DEFAULT '',
  quantity_on_hand INTEGER NOT NULL CHECK (quantity_on_hand >= 0),
  quantity_reserved INTEGER NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (product_id, variant_id)
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id BIGSERIAL PRIMARY KEY,
  product_id TEXT NOT NULL,
  variant_id TEXT NOT NULL DEFAULT '',
  movement_type TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_reservations (
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  status TEXT NOT NULL CHECK (status IN ('RESERVED', 'CONFIRMED', 'RELEASED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (order_id, product_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product_variant
  ON stock_movements (product_id, variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_order_status
  ON inventory_reservations (order_id, status);

\connect orders_db

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'AUTO',
  subtotal_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  shipping_address_id TEXT,
  shipping_label TEXT,
  shipping_recipient_name TEXT,
  shipping_phone TEXT,
  shipping_line1 TEXT,
  shipping_line2 TEXT,
  shipping_district TEXT,
  shipping_city TEXT,
  shipping_region TEXT,
  shipping_postal_code TEXT,
  shipping_reference TEXT,
  shipping_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  shipping_currency CHAR(3) NOT NULL DEFAULT 'USD',
  shipping_service_level TEXT NOT NULL DEFAULT 'STANDARD',
  estimated_delivery_days TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (order_id, product_id)
);

CREATE TABLE IF NOT EXISTS cart_items (
  customer_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (customer_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_customer_updated_at
  ON cart_items (customer_id, updated_at DESC);

\connect payments_db

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  method TEXT NOT NULL DEFAULT 'AUTO',
  status TEXT NOT NULL,
  external_reference TEXT,
  operation_code TEXT,
  processed_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_order_id
  ON payments (order_id);

\connect shipping_db

CREATE TABLE IF NOT EXISTS shipments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  payment_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  tracking_code TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_shipments_order_id
  ON shipments (order_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_shipments_payment_id
  ON shipments (payment_id);

CREATE TABLE IF NOT EXISTS shipment_events (
  id BIGSERIAL PRIMARY KEY,
  shipment_id TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT NOT NULL,
  happened_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment_time
  ON shipment_events (shipment_id, happened_at ASC);
