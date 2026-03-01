# E-commerce deportivo - NestJS microservices + hexagonal + Kafka

Base inicial para un e-commerce de ropa deportiva con:

- API Gateway HTTP (`src/`)
- Microservicio `catalog`
- Microservicio `orders`
- Microservicio `inventory`
- Microservicio `payments`
- Microservicio `shipping`
- Comunicación entre servicios con Kafka
- Persistencia con Postgres por microservicio
- Estructura hexagonal por microservicio (`domain`, `application`, `infrastructure`)

## Arquitectura

- `Gateway` expone HTTP:
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /products`
  - `POST /catalog/products`
  - `POST /catalog/variants`
  - `POST /orders`
  - `GET /orders/my`
  - `GET /admin/orders`
  - `GET /admin/orders/by-user`
  - `GET /inventory`
  - `POST /inventory/stock`
  - `GET /payments/:orderId`
  - `POST /payments/yape/start`
  - `POST /payments/yape/confirm`
  - `GET /shipments/:orderId`
- `catalog` responde `catalog.get_products`
- `orders` responde `orders.create_order`
- `orders` llama a `inventory` con `inventory.reserve_items`
- `orders` publica evento `order.created`
- `payments` consume `order.created` y publica `payment.approved`
- `shipping` consume `payment.approved` y publica `shipping.created`
- `catalog` publica `catalog.product.created` y `catalog.variant.created`
- `inventory` consume esos eventos y crea items de inventario automaticamente

## Estructura

- `src/gateway/`
- `src/shared/kafka/`
- `src/microservices/catalog/`
- `src/microservices/orders/`
- `src/microservices/inventory/`
- `src/microservices/payments/`
- `src/microservices/shipping/`

Cada microservicio usa puertos (`application/ports`) y adaptadores (`infrastructure/adapters`).

## Requisitos

- Node 20+
- Docker (para Kafka)

## Instalación

```bash
npm install
npm install --prefix frontend
```

Si agregaste rutas con `react-router-dom`, vuelve a instalar frontend:

```bash
npm install --prefix frontend
```

Variables de entorno base:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

## Levantar Kafka

```bash
docker compose -f docker-compose.kafka.yml up -d
```

Kafka queda en `localhost:9092`.

## Levantar Postgres

```bash
docker compose -f docker-compose.postgres.yml up -d
```

Postgres queda en `localhost:5432` y crea automáticamente:

- `catalog_db` (`products`)
- `inventory_db` (`inventory_items`, `stock_movements`)
- `orders_db` (`orders`, `order_items`)
- `payments_db` (`payments`)
- `shipping_db` (`shipments`)

Si ya habias levantado Postgres antes y quieres recrear bases/tablas desde cero:

```bash
docker compose -f docker-compose.postgres.yml down -v
docker compose -f docker-compose.postgres.yml up -d
```

Despues de este cambio en inventory, recrea volumen para aplicar el nuevo schema:

```bash
docker compose -f docker-compose.postgres.yml down -v
docker compose -f docker-compose.postgres.yml up -d
```

## Ejecutar servicios

En terminales separadas:

```bash
npm run start:catalog
npm run start:inventory
npm run start:orders
npm run start:payments
npm run start:shipping
npm run start:gateway
npm run start:frontend
```

Frontend corre por defecto en `http://localhost:5173` y consume `http://localhost:3000`.
Si necesitas cambiar backend URL:

```bash
cp frontend/.env.example frontend/.env
```

## Probar

Listar productos:

```bash
curl http://localhost:3000/products
```

Crear producto en catalogo (dispara creacion automatica en inventory con stock 0):

```bash
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).accessToken));")

curl -X POST http://localhost:3000/catalog/products \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "id": "legging-01",
    "sku": "TRAIN-LEGGING",
    "name": "Training Legging",
    "slug": "training-legging",
    "description": "Legging de compresion para entrenamiento.",
    "brand": "Athlex"
  }'
```

Crear variante en catalogo (tambien sincroniza inventory):

```bash
curl -X POST http://localhost:3000/catalog/variants \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "id": "var-legging-01-black-m",
    "productId": "legging-01",
    "sku": "TRAIN-LEGGING-BLACK-M",
    "color": "Black",
    "size": "M"
  }'
```

Listar inventario:

```bash
curl http://localhost:3000/inventory
```

Consultar pago por orden:

```bash
curl http://localhost:3000/payments/<orderId>
```

Consultar shipment por orden:

```bash
curl http://localhost:3000/shipments/<orderId>
```

Upsert de stock (nuevo producto o ajuste):

```bash
curl -X POST http://localhost:3000/inventory/stock \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "productId": "shoe-01",
    "variantId": null,
    "quantityOnHand": 100,
    "status": "ACTIVE"
  }'
```

Crear orden:

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "username": "cliente",
    "password": "123456"
  }' | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).accessToken));")

curl -X POST http://localhost:3000/orders \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "paymentMethod": "AUTO",
    "items": [
      { "productId": "shoe-01", "quantity": 1 },
      { "productId": "shirt-01", "quantity": 2 }
    ]
  }'
```

Flujo YAPE (simulado para integracion):

```bash
ORDER_ID=$(curl -s -X POST http://localhost:3000/orders \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"paymentMethod":"YAPE","items":[{"productId":"shoe-01","quantity":1}]}' | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).id));")

curl -X POST http://localhost:3000/payments/yape/start \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"orderId\":\"$ORDER_ID\"}"

curl -X POST http://localhost:3000/payments/yape/confirm \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"orderId\":\"$ORDER_ID\",\"operationCode\":\"YAPE-OP-123\"}"
```

Registrar usuario:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "username": "newuser",
    "password": "123456"
  }'
```

Mis ordenes (usuario autenticado):

```bash
curl http://localhost:3000/orders/my \
  -H "Authorization: Bearer $TOKEN"
```

## Migraciones formales

Para entornos fuera de desarrollo, usa migraciones versionadas en vez de depender solo de `docker-entrypoint-initdb.d`:

```bash
npm run db:migrate
```

Archivos:

- `docker/postgres/migrations/001_schema.sql`
- `docker/postgres/migrations/002_seed_baseline.sql`

## Prueba de flujo completo

Script operacional para validar el flujo principal:

```bash
npm run test:flow
```

Valida:

- login usuario
- login admin
- catálogo
- inventario
- dirección de envío
- cotización
- carrito
- creación de orden
- pago aprobado
- shipment creado
- visibilidad admin

## Health y métricas básicas

- `GET /health`
- `GET /metrics`

Útil para probes y monitoreo mínimo.

## Producción

Archivos base agregados:

- `Dockerfile`
- `frontend/Dockerfile`
- `docker-compose.production.yml`
- `.env.production.example`
- `frontend/nginx.default.conf`

Arranque base:

```bash
cp .env.production.example .env.production
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d
```

El tráfico público entra por `Caddy` en `80/443`:

- frontend: `https://<APP_DOMAIN>`
- API gateway: `https://<APP_DOMAIN>/api`

## Validación híbrida

El proyecto quedó preparado para usar `ValidationPipe` real de Nest cuando `class-validator` y `class-transformer` estén instalados. Mientras tanto, mantiene el fallback local para no romper el arranque.

Si cambias dependencias:

```bash
npm install
```

## Culqi (Yape-like real)

Se agregaron endpoints backend para integración con Culqi:

- `POST /payments/culqi/yape/charge`
- `POST /payments/culqi/webhook`

Payload de cargo:

```json
{
  "orderId": "order-id",
  "email": "buyer@example.com",
  "phoneNumber": "999888777",
  "otp": "123456"
}
```

Requiere configurar:

- `CULQI_SECRET_KEY`
- `CULQI_WEBHOOK_SECRET`

Notas:

- La integración usa llamadas HTTP reales a `CULQI_API_BASE_URL`.
- La firma de webhook quedó validada con `x-culqi-signature` usando HMAC SHA-256 sobre el body serializado. Debes ajustar esta parte si tu configuración de Culqi usa un esquema de firma distinto.
- La confirmación automática depende del webhook de Culqi; sin credenciales reales no puede verificarse desde este entorno.

## Backups de Postgres

Backup:

```bash
npm run db:backup
```

Restore manual:

```bash
bash scripts/db/restore-postgres.sh orders_db backups/orders_db-YYYYMMDD-HHMMSS.sql.gz
```

## Limitaciones antes de producción real

Estos puntos no pueden quedar “resueltos” solo con cambios locales de código:

- HTTPS y dominio real: requiere reverse proxy / load balancer y certificados reales.
- Integración de pago real: YAPE actual sigue siendo una simulación de flujo; falta integrar un proveedor como Culqi/Niubiz/Izipay con credenciales y webhooks reales.
- Monitoreo productivo: hoy hay logging y métricas mínimas, pero no Prometheus/Grafana/tracing.
- `@nestjs/config`: en este repo quedó implementado un cargador `.env` propio porque el paquete no está instalado actualmente.

Dashboard admin (requiere token admin):

```bash
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).accessToken));")

curl http://localhost:3000/admin/orders \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Variables de entorno

- `KAFKA_BROKERS` (opcional)
- `PGHOST` (default: `localhost`)
- `PGPORT` (default: `5432`)
- `PGUSER` (default: `postgres`)
- `PGPASSWORD` (default: `postgres`)
- `CATALOG_DB_NAME` (default: `catalog_db`)
- `INVENTORY_DB_NAME` (default: `inventory_db`)
- `ORDERS_DB_NAME` (default: `orders_db`)
- `PAYMENTS_DB_NAME` (default: `payments_db`)
- `SHIPPING_DB_NAME` (default: `shipping_db`)
- `AUTH_DB_NAME` (default: `auth_db`)
- `ADMIN_USER` (default: `admin`)
- `ADMIN_PASSWORD` (default: `admin123`)
- `DEMO_USER` (default: `cliente`)
- `DEMO_PASS` (default: `123456`)
- `AUTH_TOKEN_SECRET` (default: `replace-this-secret-in-production`)
- `AUTH_TOKEN_EXPIRES_IN` segundos (default: `3600`)

Ejemplo:

```bash
KAFKA_BROKERS=localhost:9092
```

Puedes copiar tambien `./.env.postgres.example` a `.env` para los valores de Postgres.

## Integration Test E2E

Con todos los servicios levantados, ejecuta:

```bash
./integration-test.sh
```

El script valida: login -> order -> payment -> shipping con polling y falla con mensaje claro si no aparece `payment` o `shipment`.
