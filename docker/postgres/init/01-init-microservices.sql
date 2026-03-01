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

INSERT INTO products (id, sku, name, slug, description, brand, status)
VALUES
  ('shoe-01', 'RUNSHOE-PRO', 'Running Shoes Pro', 'running-shoes-pro', 'Professional running shoes for long-distance training.', 'AeroFit', 'ACTIVE'),
  ('shirt-01', 'DRYFIT-TEE', 'Dry Fit T-Shirt', 'dry-fit-t-shirt', 'Breathable dry-fit t-shirt for high-intensity workouts.', 'MoveX', 'ACTIVE'),
  ('short-01', 'PERF-SHORT', 'Performance Shorts', 'performance-shorts', 'Lightweight shorts designed for gym and running.', 'Athlex', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_variants (id, product_id, sku, color, size, material, barcode, weight_grams, status)
VALUES
  ('var-shoe-01-blue-42', 'shoe-01', 'RUNSHOE-PRO-BLUE-42', 'Blue', '42', 'Mesh', '770100000001', 290, 'ACTIVE'),
  ('var-shirt-01-black-m', 'shirt-01', 'DRYFIT-TEE-BLACK-M', 'Black', 'M', 'Polyester', '770100000002', 150, 'ACTIVE'),
  ('var-short-01-gray-l', 'short-01', 'PERF-SHORT-GRAY-L', 'Gray', 'L', 'Polyester', '770100000003', 180, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_prices (id, variant_id, currency, list_price, sale_price)
VALUES
  ('price-shoe-01', 'var-shoe-01-blue-42', 'USD', 119.90, 99.90),
  ('price-shirt-01', 'var-shirt-01-black-m', 'USD', 39.90, 34.90),
  ('price-short-01', 'var-short-01-gray-l', 'USD', 49.90, 44.90)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_images (id, product_id, variant_id, url, alt_text, sort_order, is_primary)
VALUES
  ('img-shoe-01-main', 'shoe-01', NULL, 'https://cdn.example.com/products/shoe-01/main.jpg', 'Running Shoes Pro main image', 1, TRUE),
  ('img-shoe-01-var', 'shoe-01', 'var-shoe-01-blue-42', 'https://cdn.example.com/products/shoe-01/blue-42.jpg', 'Running Shoes Pro blue size 42', 1, TRUE),
  ('img-shirt-01-main', 'shirt-01', NULL, 'https://cdn.example.com/products/shirt-01/main.jpg', 'Dry Fit T-Shirt main image', 1, TRUE),
  ('img-short-01-main', 'short-01', NULL, 'https://cdn.example.com/products/short-01/main.jpg', 'Performance Shorts main image', 1, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_categories (id, name, slug, parent_id)
VALUES
  ('cat-shoes', 'Shoes', 'shoes', NULL),
  ('cat-shirts', 'Shirts', 'shirts', NULL),
  ('cat-shorts', 'Shorts', 'shorts', NULL),
  ('cat-running', 'Running', 'running', NULL),
  ('cat-training', 'Training', 'training', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_category_map (product_id, category_id)
VALUES
  ('shoe-01', 'cat-shoes'),
  ('shoe-01', 'cat-running'),
  ('shirt-01', 'cat-shirts'),
  ('shirt-01', 'cat-training'),
  ('short-01', 'cat-shorts'),
  ('short-01', 'cat-training')
ON CONFLICT (product_id, category_id) DO NOTHING;

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

CREATE INDEX IF NOT EXISTS idx_stock_movements_product_variant
  ON stock_movements (product_id, variant_id);

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

CREATE INDEX IF NOT EXISTS idx_inventory_reservations_order_status
  ON inventory_reservations (order_id, status);

INSERT INTO inventory_items (product_id, variant_id, quantity_on_hand, quantity_reserved, status)
VALUES
  ('shoe-01', '', 25, 0, 'ACTIVE'),
  ('shirt-01', '', 50, 0, 'ACTIVE'),
  ('short-01', '', 40, 0, 'ACTIVE')
ON CONFLICT (product_id, variant_id) DO NOTHING;

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
