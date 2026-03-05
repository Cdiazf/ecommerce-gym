\connect orders_db

INSERT INTO orders (
  id,
  customer_id,
  payment_method,
  subtotal_amount,
  total_amount,
  shipping_address_id,
  shipping_label,
  shipping_recipient_name,
  shipping_phone,
  shipping_line1,
  shipping_line2,
  shipping_district,
  shipping_city,
  shipping_region,
  shipping_postal_code,
  shipping_reference,
  shipping_cost,
  shipping_currency,
  shipping_service_level,
  estimated_delivery_days,
  status,
  created_at
)
VALUES
  ('ord-seed-1001', 'customer-001', 'YAPE', 214.70, 224.60, 'addr-seed-001', 'Casa', 'Carlos Diaz', '+51911111111', 'Av. Primavera 120', NULL, 'Santiago de Surco', 'Lima', 'Lima', NULL, NULL, 9.90, 'USD', 'STANDARD', '2-4', 'PAID', NOW() - INTERVAL '9 days'),
  ('ord-seed-1002', 'customer-002', 'AUTO', 187.70, 197.60, 'addr-seed-002', 'Casa', 'Ana Torres', '+51922222222', 'Calle Los Cedros 220', NULL, 'Miraflores', 'Lima', 'Lima', NULL, NULL, 9.90, 'USD', 'STANDARD', '2-4', 'PAID', NOW() - INTERVAL '8 days'),
  ('ord-seed-1003', 'customer-003', 'YAPE', 179.80, 189.70, 'addr-seed-003', 'Oficina', 'Luis Perez', '+51933333333', 'Jr. Comercio 330', NULL, 'San Isidro', 'Lima', 'Lima', NULL, NULL, 9.90, 'USD', 'STANDARD', '2-4', 'PAID', NOW() - INTERVAL '7 days'),
  ('ord-seed-1004', 'customer-004', 'AUTO', 152.70, 162.60, 'addr-seed-004', 'Casa', 'Paola Ruiz', '+51944444444', 'Av. Arequipa 440', NULL, 'Lince', 'Lima', 'Lima', NULL, NULL, 9.90, 'USD', 'STANDARD', '2-4', 'PAID', NOW() - INTERVAL '6 days'),
  ('ord-seed-1005', 'customer-005', 'YAPE', 289.70, 299.60, 'addr-seed-005', 'Casa', 'Marco Leon', '+51955555555', 'Calle Norte 550', NULL, 'Magdalena', 'Lima', 'Lima', NULL, NULL, 9.90, 'USD', 'EXPRESS', '1-2', 'PAID', NOW() - INTERVAL '5 days'),
  ('ord-seed-1006', 'customer-006', 'AUTO', 139.70, 149.60, 'addr-seed-006', 'Casa', 'Lucia Vega', '+51966666666', 'Av. Central 660', NULL, 'Pueblo Libre', 'Lima', 'Lima', NULL, NULL, 9.90, 'USD', 'STANDARD', '2-4', 'PAID', NOW() - INTERVAL '4 days'),
  ('ord-seed-1007', 'customer-007', 'YAPE', 171.70, 181.60, 'addr-seed-007', 'Casa', 'Diego Ramos', '+51977777777', 'Jr. Delta 770', NULL, 'Barranco', 'Lima', 'Lima', NULL, NULL, 9.90, 'USD', 'STANDARD', '2-4', 'PAID', NOW() - INTERVAL '3 days'),
  ('ord-seed-1008', 'customer-008', 'AUTO', 256.70, 266.60, 'addr-seed-008', 'Casa', 'Sofia Medina', '+51988888888', 'Av. Pacifico 880', NULL, 'San Borja', 'Lima', 'Lima', NULL, NULL, 9.90, 'USD', 'EXPRESS', '1-2', 'PAID', NOW() - INTERVAL '2 days'),
  ('ord-seed-1009', 'customer-009', 'YAPE', 194.70, 204.60, 'addr-seed-009', 'Casa', 'Jose Salas', '+51999999999', 'Calle Sol 990', NULL, 'Jesus Maria', 'Lima', 'Lima', NULL, NULL, 9.90, 'USD', 'STANDARD', '2-4', 'PAID', NOW() - INTERVAL '1 day'),
  ('ord-seed-1010', 'customer-010', 'AUTO', 228.70, 238.60, 'addr-seed-010', 'Casa', 'Valeria Cruz', '+51910101010', 'Av. Sur 1010', NULL, 'La Molina', 'Lima', 'Lima', NULL, NULL, 9.90, 'USD', 'STANDARD', '2-4', 'PAID', NOW() - INTERVAL '12 hours')
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (order_id, product_id, quantity)
VALUES
  ('ord-seed-1001', 'shoe-01', 2),
  ('ord-seed-1001', 'shirt-01', 1),
  ('ord-seed-1001', 'tank-02', 1),
  ('ord-seed-1002', 'shoe-01', 1),
  ('ord-seed-1002', 'short-01', 2),
  ('ord-seed-1002', 'jogger-01', 1),
  ('ord-seed-1003', 'legging-02', 2),
  ('ord-seed-1003', 'bra-02', 1),
  ('ord-seed-1003', 'cap-02', 1),
  ('ord-seed-1004', 'hoodie-02', 1),
  ('ord-seed-1004', 'shirt-01', 2),
  ('ord-seed-1004', 'short-03', 1),
  ('ord-seed-1005', 'sneaker-03', 2),
  ('ord-seed-1005', 'jacket-02', 1),
  ('ord-seed-1005', 'cap-01', 1),
  ('ord-seed-1006', 'short-01', 1),
  ('ord-seed-1006', 'tank-01', 2),
  ('ord-seed-1006', 'sock-01', 2),
  ('ord-seed-1007', 'shoe-02', 1),
  ('ord-seed-1007', 'jogger-01', 1),
  ('ord-seed-1007', 'legging-01', 1),
  ('ord-seed-1008', 'shoe-01', 1),
  ('ord-seed-1008', 'sneaker-03', 1),
  ('ord-seed-1008', 'hoodie-01', 1),
  ('ord-seed-1009', 'shirt-01', 1),
  ('ord-seed-1009', 'short-03', 1),
  ('ord-seed-1009', 'bra-01', 1),
  ('ord-seed-1010', 'legging-02', 1),
  ('ord-seed-1010', 'jacket-01', 1),
  ('ord-seed-1010', 'cap-02', 1)
ON CONFLICT (order_id, product_id) DO NOTHING;

\connect payments_db

INSERT INTO payments (id, order_id, customer_id, amount, method, status, external_reference, operation_code, processed_at)
VALUES
  ('pay-seed-1001', 'ord-seed-1001', 'customer-001', 224.60, 'YAPE', 'APPROVED', 'seed-ext-1001', 'seed-op-1001', NOW() - INTERVAL '9 days'),
  ('pay-seed-1002', 'ord-seed-1002', 'customer-002', 197.60, 'AUTO', 'APPROVED', 'seed-ext-1002', 'seed-op-1002', NOW() - INTERVAL '8 days'),
  ('pay-seed-1003', 'ord-seed-1003', 'customer-003', 189.70, 'YAPE', 'APPROVED', 'seed-ext-1003', 'seed-op-1003', NOW() - INTERVAL '7 days'),
  ('pay-seed-1004', 'ord-seed-1004', 'customer-004', 162.60, 'AUTO', 'APPROVED', 'seed-ext-1004', 'seed-op-1004', NOW() - INTERVAL '6 days'),
  ('pay-seed-1005', 'ord-seed-1005', 'customer-005', 299.60, 'YAPE', 'APPROVED', 'seed-ext-1005', 'seed-op-1005', NOW() - INTERVAL '5 days'),
  ('pay-seed-1006', 'ord-seed-1006', 'customer-006', 149.60, 'AUTO', 'APPROVED', 'seed-ext-1006', 'seed-op-1006', NOW() - INTERVAL '4 days'),
  ('pay-seed-1007', 'ord-seed-1007', 'customer-007', 181.60, 'YAPE', 'APPROVED', 'seed-ext-1007', 'seed-op-1007', NOW() - INTERVAL '3 days'),
  ('pay-seed-1008', 'ord-seed-1008', 'customer-008', 266.60, 'AUTO', 'APPROVED', 'seed-ext-1008', 'seed-op-1008', NOW() - INTERVAL '2 days'),
  ('pay-seed-1009', 'ord-seed-1009', 'customer-009', 204.60, 'YAPE', 'APPROVED', 'seed-ext-1009', 'seed-op-1009', NOW() - INTERVAL '1 day'),
  ('pay-seed-1010', 'ord-seed-1010', 'customer-010', 238.60, 'AUTO', 'APPROVED', 'seed-ext-1010', 'seed-op-1010', NOW() - INTERVAL '12 hours')
ON CONFLICT (id) DO NOTHING;

\connect shipping_db

INSERT INTO shipments (id, order_id, payment_id, customer_id, tracking_code, status, created_at)
VALUES
  ('shp-seed-1001', 'ord-seed-1001', 'pay-seed-1001', 'customer-001', 'TRK-SEED-1001', 'DELIVERED', NOW() - INTERVAL '8 days'),
  ('shp-seed-1002', 'ord-seed-1002', 'pay-seed-1002', 'customer-002', 'TRK-SEED-1002', 'DELIVERED', NOW() - INTERVAL '7 days'),
  ('shp-seed-1003', 'ord-seed-1003', 'pay-seed-1003', 'customer-003', 'TRK-SEED-1003', 'DELIVERED', NOW() - INTERVAL '6 days'),
  ('shp-seed-1004', 'ord-seed-1004', 'pay-seed-1004', 'customer-004', 'TRK-SEED-1004', 'IN_TRANSIT', NOW() - INTERVAL '5 days'),
  ('shp-seed-1005', 'ord-seed-1005', 'pay-seed-1005', 'customer-005', 'TRK-SEED-1005', 'IN_TRANSIT', NOW() - INTERVAL '4 days'),
  ('shp-seed-1006', 'ord-seed-1006', 'pay-seed-1006', 'customer-006', 'TRK-SEED-1006', 'CREATED', NOW() - INTERVAL '3 days'),
  ('shp-seed-1007', 'ord-seed-1007', 'pay-seed-1007', 'customer-007', 'TRK-SEED-1007', 'CREATED', NOW() - INTERVAL '2 days'),
  ('shp-seed-1008', 'ord-seed-1008', 'pay-seed-1008', 'customer-008', 'TRK-SEED-1008', 'IN_TRANSIT', NOW() - INTERVAL '1 day'),
  ('shp-seed-1009', 'ord-seed-1009', 'pay-seed-1009', 'customer-009', 'TRK-SEED-1009', 'CREATED', NOW() - INTERVAL '12 hours'),
  ('shp-seed-1010', 'ord-seed-1010', 'pay-seed-1010', 'customer-010', 'TRK-SEED-1010', 'CREATED', NOW() - INTERVAL '6 hours')
ON CONFLICT (id) DO NOTHING;
