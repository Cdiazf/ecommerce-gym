\connect catalog_db

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

INSERT INTO inventory_items (product_id, variant_id, quantity_on_hand, quantity_reserved, status)
VALUES
  ('shoe-01', '', 25, 0, 'ACTIVE'),
  ('shirt-01', '', 50, 0, 'ACTIVE'),
  ('short-01', '', 40, 0, 'ACTIVE')
ON CONFLICT (product_id, variant_id) DO NOTHING;
