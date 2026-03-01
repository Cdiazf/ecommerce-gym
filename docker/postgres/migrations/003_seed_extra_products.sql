\connect catalog_db

INSERT INTO product_categories (id, name, slug, parent_id)
VALUES
  ('cat-hoodies', 'Hoodies', 'hoodies', NULL),
  ('cat-leggings', 'Leggings', 'leggings', NULL),
  ('cat-bras', 'Sports Bras', 'sports-bras', NULL),
  ('cat-accessories', 'Accessories', 'accessories', NULL),
  ('cat-bags', 'Bags', 'bags', 'cat-accessories'),
  ('cat-caps', 'Caps', 'caps', 'cat-accessories'),
  ('cat-socks', 'Socks', 'socks', 'cat-accessories'),
  ('cat-mats', 'Yoga Mats', 'yoga-mats', 'cat-accessories'),
  ('cat-jackets', 'Jackets', 'jackets', NULL),
  ('cat-compression', 'Compression', 'compression', NULL),
  ('cat-outdoor', 'Outdoor', 'outdoor', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, sku, name, slug, description, brand, status)
VALUES
  ('hoodie-01', 'THERMO-HOOD', 'Thermo Hoodie', 'thermo-hoodie', 'Warm hoodie with moisture control for pre and post workout.', 'MoveX', 'ACTIVE'),
  ('legging-01', 'POWER-LEGGING', 'Power Legging', 'power-legging', 'High-waist compression leggings for training and yoga.', 'Athlex', 'ACTIVE'),
  ('bra-01', 'FLEX-BRA', 'Flex Sports Bra', 'flex-sports-bra', 'Medium support sports bra with soft stretch fabric.', 'MoveX', 'ACTIVE'),
  ('bag-01', 'TRAIN-DUFFLE', 'Training Duffle Bag', 'training-duffle-bag', 'Spacious gym duffle bag with shoe compartment.', 'AeroFit', 'ACTIVE'),
  ('cap-01', 'RUN-CAP', 'Run Performance Cap', 'run-performance-cap', 'Lightweight cap with breathable mesh panels.', 'AeroFit', 'ACTIVE'),
  ('sock-01', 'CUSHION-SOCK', 'Cushion Crew Socks', 'cushion-crew-socks', 'Crew socks with arch support and cushioned heel.', 'Athlex', 'ACTIVE'),
  ('mat-01', 'FLOW-MAT', 'Flow Yoga Mat', 'flow-yoga-mat', 'Non-slip yoga mat for mobility and stretching routines.', 'ZenMove', 'ACTIVE'),
  ('jacket-01', 'WIND-RUN', 'Wind Runner Jacket', 'wind-runner-jacket', 'Ultra-light running jacket for windy outdoor sessions.', 'AeroFit', 'ACTIVE'),
  ('tank-01', 'AIR-TANK', 'Air Training Tank', 'air-training-tank', 'Sleeveless tank with quick-dry performance fabric.', 'MoveX', 'ACTIVE'),
  ('shoe-02', 'TRAIL-GRIP', 'Trail Grip Shoes', 'trail-grip-shoes', 'Trail running shoes with enhanced grip and ankle support.', 'AeroFit', 'ACTIVE'),
  ('sleeve-01', 'COMP-SLEEVE', 'Compression Arm Sleeve', 'compression-arm-sleeve', 'Compression sleeve for recovery and high-intensity sessions.', 'Athlex', 'ACTIVE'),
  ('short-02', 'SPRINT-SHORT', 'Sprint 2-in-1 Shorts', 'sprint-2in1-shorts', 'Dual-layer shorts designed for speed and support.', 'MoveX', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_variants (id, product_id, sku, color, size, material, barcode, weight_grams, status)
VALUES
  ('var-hoodie-01-navy-l', 'hoodie-01', 'THERMO-HOOD-NAVY-L', 'Navy', 'L', 'Cotton Blend', '770100000010', 480, 'ACTIVE'),
  ('var-legging-01-black-m', 'legging-01', 'POWER-LEGGING-BLACK-M', 'Black', 'M', 'Nylon Spandex', '770100000011', 220, 'ACTIVE'),
  ('var-bra-01-rose-m', 'bra-01', 'FLEX-BRA-ROSE-M', 'Rose', 'M', 'Polyamide', '770100000012', 120, 'ACTIVE'),
  ('var-bag-01-black-std', 'bag-01', 'TRAIN-DUFFLE-BLACK-STD', 'Black', 'STD', 'Polyester', '770100000013', 860, 'ACTIVE'),
  ('var-cap-01-white-std', 'cap-01', 'RUN-CAP-WHITE-STD', 'White', 'STD', 'Polyester', '770100000014', 90, 'ACTIVE'),
  ('var-sock-01-white-m', 'sock-01', 'CUSHION-SOCK-WHITE-M', 'White', 'M', 'Cotton Blend', '770100000015', 60, 'ACTIVE'),
  ('var-mat-01-green-std', 'mat-01', 'FLOW-MAT-GREEN-STD', 'Green', 'STD', 'TPE', '770100000016', 950, 'ACTIVE'),
  ('var-jacket-01-black-l', 'jacket-01', 'WIND-RUN-BLACK-L', 'Black', 'L', 'Ripstop', '770100000017', 260, 'ACTIVE'),
  ('var-tank-01-gray-m', 'tank-01', 'AIR-TANK-GRAY-M', 'Gray', 'M', 'Polyester', '770100000018', 110, 'ACTIVE'),
  ('var-shoe-02-orange-43', 'shoe-02', 'TRAIL-GRIP-ORANGE-43', 'Orange', '43', 'Mesh', '770100000019', 340, 'ACTIVE'),
  ('var-sleeve-01-black-std', 'sleeve-01', 'COMP-SLEEVE-BLACK-STD', 'Black', 'STD', 'Elastane', '770100000020', 70, 'ACTIVE'),
  ('var-short-02-black-m', 'short-02', 'SPRINT-SHORT-BLACK-M', 'Black', 'M', 'Polyester', '770100000021', 170, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_prices (id, variant_id, currency, list_price, sale_price)
VALUES
  ('price-hoodie-01', 'var-hoodie-01-navy-l', 'USD', 89.90, 79.90),
  ('price-legging-01', 'var-legging-01-black-m', 'USD', 64.90, 54.90),
  ('price-bra-01', 'var-bra-01-rose-m', 'USD', 34.90, 29.90),
  ('price-bag-01', 'var-bag-01-black-std', 'USD', 69.90, 59.90),
  ('price-cap-01', 'var-cap-01-white-std', 'USD', 24.90, 19.90),
  ('price-sock-01', 'var-sock-01-white-m', 'USD', 14.90, 11.90),
  ('price-mat-01', 'var-mat-01-green-std', 'USD', 54.90, 44.90),
  ('price-jacket-01', 'var-jacket-01-black-l', 'USD', 99.90, 84.90),
  ('price-tank-01', 'var-tank-01-gray-m', 'USD', 29.90, 24.90),
  ('price-shoe-02', 'var-shoe-02-orange-43', 'USD', 139.90, 119.90),
  ('price-sleeve-01', 'var-sleeve-01-black-std', 'USD', 19.90, 16.90),
  ('price-short-02', 'var-short-02-black-m', 'USD', 44.90, 39.90)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_images (id, product_id, variant_id, url, alt_text, sort_order, is_primary)
VALUES
  ('img-hoodie-01-main', 'hoodie-01', NULL, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200', 'Thermo Hoodie main image', 1, TRUE),
  ('img-legging-01-main', 'legging-01', NULL, 'https://images.unsplash.com/photo-1506629905607-53e82f5fd0b0?w=1200', 'Power Legging main image', 1, TRUE),
  ('img-bra-01-main', 'bra-01', NULL, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1200', 'Flex Sports Bra main image', 1, TRUE),
  ('img-bag-01-main', 'bag-01', NULL, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200', 'Training Duffle Bag main image', 1, TRUE),
  ('img-cap-01-main', 'cap-01', NULL, 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=1200', 'Run Performance Cap main image', 1, TRUE),
  ('img-sock-01-main', 'sock-01', NULL, 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=1200', 'Cushion Crew Socks main image', 1, TRUE),
  ('img-mat-01-main', 'mat-01', NULL, 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200', 'Flow Yoga Mat main image', 1, TRUE),
  ('img-jacket-01-main', 'jacket-01', NULL, 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1200', 'Wind Runner Jacket main image', 1, TRUE),
  ('img-tank-01-main', 'tank-01', NULL, 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200', 'Air Training Tank main image', 1, TRUE),
  ('img-shoe-02-main', 'shoe-02', NULL, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200', 'Trail Grip Shoes main image', 1, TRUE),
  ('img-sleeve-01-main', 'sleeve-01', NULL, 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200', 'Compression Arm Sleeve main image', 1, TRUE),
  ('img-short-02-main', 'short-02', NULL, 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200', 'Sprint 2-in-1 Shorts main image', 1, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_category_map (product_id, category_id)
VALUES
  ('hoodie-01', 'cat-hoodies'),
  ('hoodie-01', 'cat-training'),
  ('legging-01', 'cat-leggings'),
  ('legging-01', 'cat-training'),
  ('bra-01', 'cat-bras'),
  ('bra-01', 'cat-training'),
  ('bag-01', 'cat-bags'),
  ('bag-01', 'cat-accessories'),
  ('cap-01', 'cat-caps'),
  ('cap-01', 'cat-running'),
  ('sock-01', 'cat-socks'),
  ('sock-01', 'cat-training'),
  ('mat-01', 'cat-mats'),
  ('mat-01', 'cat-training'),
  ('jacket-01', 'cat-jackets'),
  ('jacket-01', 'cat-running'),
  ('tank-01', 'cat-shirts'),
  ('tank-01', 'cat-training'),
  ('shoe-02', 'cat-shoes'),
  ('shoe-02', 'cat-outdoor'),
  ('sleeve-01', 'cat-compression'),
  ('sleeve-01', 'cat-training'),
  ('short-02', 'cat-shorts'),
  ('short-02', 'cat-running')
ON CONFLICT (product_id, category_id) DO NOTHING;

\connect inventory_db

INSERT INTO inventory_items (product_id, variant_id, quantity_on_hand, quantity_reserved, status)
VALUES
  ('hoodie-01', '', 18, 0, 'ACTIVE'),
  ('legging-01', '', 32, 0, 'ACTIVE'),
  ('bra-01', '', 26, 0, 'ACTIVE'),
  ('bag-01', '', 14, 0, 'ACTIVE'),
  ('cap-01', '', 40, 0, 'ACTIVE'),
  ('sock-01', '', 65, 0, 'ACTIVE'),
  ('mat-01', '', 20, 0, 'ACTIVE'),
  ('jacket-01', '', 16, 0, 'ACTIVE'),
  ('tank-01', '', 34, 0, 'ACTIVE'),
  ('shoe-02', '', 12, 0, 'ACTIVE'),
  ('sleeve-01', '', 48, 0, 'ACTIVE'),
  ('short-02', '', 28, 0, 'ACTIVE')
ON CONFLICT (product_id, variant_id) DO NOTHING;
