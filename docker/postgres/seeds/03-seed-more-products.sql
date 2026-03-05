\connect catalog_db

INSERT INTO product_categories (id, name, slug, parent_id)
VALUES
  ('cat-hoodies', 'Hoodies', 'hoodies', NULL),
  ('cat-leggings', 'Leggings', 'leggings', NULL),
  ('cat-bras', 'Sports Bras', 'sports-bras', NULL),
  ('cat-caps', 'Caps', 'caps', 'cat-accessories'),
  ('cat-jackets', 'Jackets', 'jackets', NULL),
  ('cat-running', 'Running', 'running', NULL),
  ('cat-training', 'Training', 'training', NULL),
  ('cat-shirts', 'Shirts', 'shirts', NULL),
  ('cat-shoes', 'Shoes', 'shoes', NULL),
  ('cat-shorts', 'Shorts', 'shorts', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, sku, name, slug, description, brand, status)
VALUES
  ('jogger-01', 'FLEX-JOGGER', 'Flex Jogger Pants', 'flex-jogger-pants', 'Training joggers with tapered fit and stretch waistband.', 'MoveX', 'ACTIVE'),
  ('hoodie-02', 'AERO-HOOD', 'Aero Zip Hoodie', 'aero-zip-hoodie', 'Lightweight hoodie for warm-up and recovery.', 'AeroFit', 'ACTIVE'),
  ('sneaker-03', 'CITY-RUN', 'City Run Sneakers', 'city-run-sneakers', 'Daily running sneakers with responsive cushioning.', 'AeroFit', 'ACTIVE'),
  ('tank-02', 'CORE-TANK', 'Core Training Tank', 'core-training-tank', 'Sleeveless tank for high-intensity sessions.', 'MoveX', 'ACTIVE'),
  ('short-03', 'LIFT-SHORT', 'Lift Training Shorts', 'lift-training-shorts', 'Comfort shorts with inner support for gym routines.', 'Athlex', 'ACTIVE'),
  ('bra-02', 'MOTION-BRA', 'Motion Sports Bra', 'motion-sports-bra', 'Medium-impact sports bra with removable pads.', 'MoveX', 'ACTIVE'),
  ('legging-02', 'SCULPT-LEGGING', 'Sculpt Legging', 'sculpt-legging', 'High-rise leggings with compression support.', 'Athlex', 'ACTIVE'),
  ('jacket-02', 'STORM-SHELL', 'Storm Shell Jacket', 'storm-shell-jacket', 'Weather-resistant shell jacket for outdoor training.', 'AeroFit', 'ACTIVE'),
  ('cap-02', 'PACE-CAP', 'Pace Runner Cap', 'pace-runner-cap', 'Breathable cap designed for long runs.', 'ZenMove', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_variants (id, product_id, sku, color, size, material, barcode, weight_grams, status)
VALUES
  ('var-jogger-01-black-s', 'jogger-01', 'FLEX-JOGGER-BLACK-S', 'Black', 'S', 'Polyester Spandex', '770100000101', 260, 'ACTIVE'),
  ('var-jogger-01-black-m', 'jogger-01', 'FLEX-JOGGER-BLACK-M', 'Black', 'M', 'Polyester Spandex', '770100000102', 270, 'ACTIVE'),
  ('var-jogger-01-navy-l', 'jogger-01', 'FLEX-JOGGER-NAVY-L', 'Navy', 'L', 'Polyester Spandex', '770100000103', 280, 'ACTIVE'),
  ('var-hoodie-02-gray-s', 'hoodie-02', 'AERO-HOOD-GRAY-S', 'Gray', 'S', 'Cotton Blend', '770100000104', 420, 'ACTIVE'),
  ('var-hoodie-02-gray-m', 'hoodie-02', 'AERO-HOOD-GRAY-M', 'Gray', 'M', 'Cotton Blend', '770100000105', 430, 'ACTIVE'),
  ('var-hoodie-02-black-l', 'hoodie-02', 'AERO-HOOD-BLACK-L', 'Black', 'L', 'Cotton Blend', '770100000106', 440, 'ACTIVE'),
  ('var-sneaker-03-white-41', 'sneaker-03', 'CITY-RUN-WHITE-41', 'White', '41', 'Mesh', '770100000107', 300, 'ACTIVE'),
  ('var-sneaker-03-white-42', 'sneaker-03', 'CITY-RUN-WHITE-42', 'White', '42', 'Mesh', '770100000108', 310, 'ACTIVE'),
  ('var-sneaker-03-black-43', 'sneaker-03', 'CITY-RUN-BLACK-43', 'Black', '43', 'Mesh', '770100000109', 320, 'ACTIVE'),
  ('var-tank-02-black-s', 'tank-02', 'CORE-TANK-BLACK-S', 'Black', 'S', 'Polyester', '770100000110', 100, 'ACTIVE'),
  ('var-tank-02-black-m', 'tank-02', 'CORE-TANK-BLACK-M', 'Black', 'M', 'Polyester', '770100000111', 110, 'ACTIVE'),
  ('var-tank-02-olive-l', 'tank-02', 'CORE-TANK-OLIVE-L', 'Olive', 'L', 'Polyester', '770100000112', 120, 'ACTIVE'),
  ('var-short-03-black-s', 'short-03', 'LIFT-SHORT-BLACK-S', 'Black', 'S', 'Polyester', '770100000113', 150, 'ACTIVE'),
  ('var-short-03-black-m', 'short-03', 'LIFT-SHORT-BLACK-M', 'Black', 'M', 'Polyester', '770100000114', 160, 'ACTIVE'),
  ('var-short-03-gray-l', 'short-03', 'LIFT-SHORT-GRAY-L', 'Gray', 'L', 'Polyester', '770100000115', 170, 'ACTIVE'),
  ('var-bra-02-rose-s', 'bra-02', 'MOTION-BRA-ROSE-S', 'Rose', 'S', 'Polyamide', '770100000116', 100, 'ACTIVE'),
  ('var-bra-02-rose-m', 'bra-02', 'MOTION-BRA-ROSE-M', 'Rose', 'M', 'Polyamide', '770100000117', 110, 'ACTIVE'),
  ('var-bra-02-black-l', 'bra-02', 'MOTION-BRA-BLACK-L', 'Black', 'L', 'Polyamide', '770100000118', 120, 'ACTIVE'),
  ('var-legging-02-black-s', 'legging-02', 'SCULPT-LEGGING-BLACK-S', 'Black', 'S', 'Nylon Spandex', '770100000119', 210, 'ACTIVE'),
  ('var-legging-02-black-m', 'legging-02', 'SCULPT-LEGGING-BLACK-M', 'Black', 'M', 'Nylon Spandex', '770100000120', 220, 'ACTIVE'),
  ('var-legging-02-plum-l', 'legging-02', 'SCULPT-LEGGING-PLUM-L', 'Plum', 'L', 'Nylon Spandex', '770100000121', 230, 'ACTIVE'),
  ('var-jacket-02-blue-m', 'jacket-02', 'STORM-SHELL-BLUE-M', 'Blue', 'M', 'Ripstop', '770100000122', 240, 'ACTIVE'),
  ('var-jacket-02-blue-l', 'jacket-02', 'STORM-SHELL-BLUE-L', 'Blue', 'L', 'Ripstop', '770100000123', 250, 'ACTIVE'),
  ('var-jacket-02-black-xl', 'jacket-02', 'STORM-SHELL-BLACK-XL', 'Black', 'XL', 'Ripstop', '770100000124', 260, 'ACTIVE'),
  ('var-cap-02-white-std', 'cap-02', 'PACE-CAP-WHITE-STD', 'White', 'STD', 'Polyester', '770100000125', 80, 'ACTIVE'),
  ('var-cap-02-black-std', 'cap-02', 'PACE-CAP-BLACK-STD', 'Black', 'STD', 'Polyester', '770100000126', 85, 'ACTIVE'),
  ('var-cap-02-blue-std', 'cap-02', 'PACE-CAP-BLUE-STD', 'Blue', 'STD', 'Polyester', '770100000127', 90, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_prices (id, variant_id, currency, list_price, sale_price)
VALUES
  ('price-jogger-01-black-s', 'var-jogger-01-black-s', 'USD', 54.90, 49.90),
  ('price-jogger-01-black-m', 'var-jogger-01-black-m', 'USD', 54.90, 49.90),
  ('price-jogger-01-navy-l', 'var-jogger-01-navy-l', 'USD', 56.90, 51.90),
  ('price-hoodie-02-gray-s', 'var-hoodie-02-gray-s', 'USD', 84.90, 74.90),
  ('price-hoodie-02-gray-m', 'var-hoodie-02-gray-m', 'USD', 84.90, 74.90),
  ('price-hoodie-02-black-l', 'var-hoodie-02-black-l', 'USD', 86.90, 76.90),
  ('price-sneaker-03-white-41', 'var-sneaker-03-white-41', 'USD', 124.90, 109.90),
  ('price-sneaker-03-white-42', 'var-sneaker-03-white-42', 'USD', 124.90, 109.90),
  ('price-sneaker-03-black-43', 'var-sneaker-03-black-43', 'USD', 126.90, 111.90),
  ('price-tank-02-black-s', 'var-tank-02-black-s', 'USD', 28.90, 24.90),
  ('price-tank-02-black-m', 'var-tank-02-black-m', 'USD', 28.90, 24.90),
  ('price-tank-02-olive-l', 'var-tank-02-olive-l', 'USD', 29.90, 25.90),
  ('price-short-03-black-s', 'var-short-03-black-s', 'USD', 42.90, 37.90),
  ('price-short-03-black-m', 'var-short-03-black-m', 'USD', 42.90, 37.90),
  ('price-short-03-gray-l', 'var-short-03-gray-l', 'USD', 44.90, 39.90),
  ('price-bra-02-rose-s', 'var-bra-02-rose-s', 'USD', 36.90, 31.90),
  ('price-bra-02-rose-m', 'var-bra-02-rose-m', 'USD', 36.90, 31.90),
  ('price-bra-02-black-l', 'var-bra-02-black-l', 'USD', 38.90, 33.90),
  ('price-legging-02-black-s', 'var-legging-02-black-s', 'USD', 62.90, 54.90),
  ('price-legging-02-black-m', 'var-legging-02-black-m', 'USD', 62.90, 54.90),
  ('price-legging-02-plum-l', 'var-legging-02-plum-l', 'USD', 64.90, 56.90),
  ('price-jacket-02-blue-m', 'var-jacket-02-blue-m', 'USD', 104.90, 92.90),
  ('price-jacket-02-blue-l', 'var-jacket-02-blue-l', 'USD', 104.90, 92.90),
  ('price-jacket-02-black-xl', 'var-jacket-02-black-xl', 'USD', 109.90, 96.90),
  ('price-cap-02-white-std', 'var-cap-02-white-std', 'USD', 22.90, 18.90),
  ('price-cap-02-black-std', 'var-cap-02-black-std', 'USD', 22.90, 18.90),
  ('price-cap-02-blue-std', 'var-cap-02-blue-std', 'USD', 22.90, 18.90)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_images (id, product_id, variant_id, url, alt_text, sort_order, is_primary)
VALUES
  ('img-jogger-01-main', 'jogger-01', NULL, 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200', 'Flex Jogger Pants main image', 1, TRUE),
  ('img-hoodie-02-main', 'hoodie-02', NULL, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200', 'Aero Zip Hoodie main image', 1, TRUE),
  ('img-sneaker-03-main', 'sneaker-03', NULL, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200', 'City Run Sneakers main image', 1, TRUE),
  ('img-tank-02-main', 'tank-02', NULL, 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200', 'Core Training Tank main image', 1, TRUE),
  ('img-short-03-main', 'short-03', NULL, 'https://images.unsplash.com/photo-1506629905607-53e82f5fd0b0?w=1200', 'Lift Training Shorts main image', 1, TRUE),
  ('img-bra-02-main', 'bra-02', NULL, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1200', 'Motion Sports Bra main image', 1, TRUE),
  ('img-legging-02-main', 'legging-02', NULL, 'https://images.unsplash.com/photo-1506629905607-53e82f5fd0b0?w=1200', 'Sculpt Legging main image', 1, TRUE),
  ('img-jacket-02-main', 'jacket-02', NULL, 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1200', 'Storm Shell Jacket main image', 1, TRUE),
  ('img-cap-02-main', 'cap-02', NULL, 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=1200', 'Pace Runner Cap main image', 1, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_category_map (product_id, category_id)
VALUES
  ('jogger-01', 'cat-training'),
  ('jogger-01', 'cat-shorts'),
  ('hoodie-02', 'cat-hoodies'),
  ('hoodie-02', 'cat-training'),
  ('sneaker-03', 'cat-shoes'),
  ('sneaker-03', 'cat-running'),
  ('tank-02', 'cat-shirts'),
  ('tank-02', 'cat-training'),
  ('short-03', 'cat-shorts'),
  ('short-03', 'cat-training'),
  ('bra-02', 'cat-bras'),
  ('bra-02', 'cat-training'),
  ('legging-02', 'cat-leggings'),
  ('legging-02', 'cat-training'),
  ('jacket-02', 'cat-jackets'),
  ('jacket-02', 'cat-running'),
  ('cap-02', 'cat-caps'),
  ('cap-02', 'cat-running')
ON CONFLICT (product_id, category_id) DO NOTHING;

\connect inventory_db

INSERT INTO inventory_items (product_id, variant_id, quantity_on_hand, quantity_reserved, status)
VALUES
  ('jogger-01', '', 45, 0, 'ACTIVE'),
  ('hoodie-02', '', 22, 0, 'ACTIVE'),
  ('sneaker-03', '', 18, 0, 'ACTIVE'),
  ('tank-02', '', 40, 0, 'ACTIVE'),
  ('short-03', '', 36, 0, 'ACTIVE'),
  ('bra-02', '', 28, 0, 'ACTIVE'),
  ('legging-02', '', 31, 0, 'ACTIVE'),
  ('jacket-02', '', 14, 0, 'ACTIVE'),
  ('cap-02', '', 60, 0, 'ACTIVE')
ON CONFLICT (product_id, variant_id) DO NOTHING;
