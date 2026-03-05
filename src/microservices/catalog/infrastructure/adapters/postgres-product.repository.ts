import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateProductRequest,
  CreateProductCategoryRequest,
  CreateProductImageRequest,
  CreateProductPriceRequest,
  CreateProductVariantRequest,
  ProductCommandPort,
  UpdateProductCategoryRequest,
  UpdateProductImageRequest,
  UpdateProductPriceRequest,
  UpdateProductRequest,
  UpdateProductVariantRequest,
} from '../../application/ports/product-command.port';
import { ProductQueryPort } from '../../application/ports/product-query.port';
import {
  Product,
  ProductCategory,
  ProductImage,
  ProductPrice,
  ProductVariant,
} from '../../domain/product';
import type { Pool } from 'pg';

export const CATALOG_PG_POOL = Symbol('CATALOG_PG_POOL');

interface ProductRow {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  brand: string;
  status: string;
  created_at: Date | string;
  updated_at: Date | string;
}

interface CategoryRow {
  product_id: string;
  category_id: string;
  category_name: string;
  category_slug: string;
}

interface CategoryEntityRow {
  id: string;
  name: string;
  slug: string;
}

interface VariantRow {
  id: string;
  product_id: string;
  sku: string;
  color: string | null;
  size: string | null;
  material: string | null;
  barcode: string | null;
  weight_grams: number | null;
  status: string;
}

interface PriceRow {
  id: string;
  variant_id: string;
  currency: string;
  list_price: string | number;
  sale_price: string | number | null;
  starts_at: Date | string | null;
  ends_at: Date | string | null;
}

interface ImageRow {
  id: string;
  product_id: string;
  variant_id: string | null;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
}

@Injectable()
export class PostgresProductRepository
  implements ProductQueryPort, ProductCommandPort
{
  constructor(@Inject(CATALOG_PG_POOL) private readonly pool: Pool) {}

  async findById(productId: string): Promise<Product | null> {
    const products = await this.findAll();
    return products.find((product) => product.id === productId) ?? null;
  }

  async listCategories(): Promise<ProductCategory[]> {
    const result = await this.pool.query<CategoryEntityRow>(
      `SELECT id, name, slug
       FROM product_categories
       ORDER BY name ASC`,
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
    }));
  }

  async findAll(): Promise<Product[]> {
    const [
      productsResult,
      categoriesResult,
      variantsResult,
      pricesResult,
      imagesResult,
    ] = await Promise.all([
      this.pool.query<ProductRow>(
        `SELECT id, sku, name, slug, description, brand, status, created_at, updated_at
           FROM products
           WHERE status = 'ACTIVE'
           ORDER BY name ASC`,
      ),
      this.pool.query<CategoryRow>(
        `SELECT pcm.product_id, pc.id AS category_id, pc.name AS category_name, pc.slug AS category_slug
           FROM product_category_map pcm
           INNER JOIN product_categories pc ON pc.id = pcm.category_id`,
      ),
      this.pool.query<VariantRow>(
        `SELECT id, product_id, sku, color, size, material, barcode, weight_grams, status
           FROM product_variants
           WHERE status = 'ACTIVE'
           ORDER BY sku ASC`,
      ),
      this.pool.query<PriceRow>(
        `SELECT id, variant_id, currency, list_price, sale_price, starts_at, ends_at
           FROM product_prices
           ORDER BY starts_at NULLS FIRST`,
      ),
      this.pool.query<ImageRow>(
        `SELECT id, product_id, variant_id, url, alt_text, sort_order, is_primary
           FROM product_images
           ORDER BY sort_order ASC`,
      ),
    ]);

    const categoriesByProduct = new Map<string, ProductCategory[]>();
    for (const row of categoriesResult.rows) {
      const list = categoriesByProduct.get(row.product_id) ?? [];
      list.push({
        id: row.category_id,
        name: row.category_name,
        slug: row.category_slug,
      });
      categoriesByProduct.set(row.product_id, list);
    }

    const pricesByVariant = new Map<string, ProductPrice[]>();
    for (const row of pricesResult.rows) {
      const list = pricesByVariant.get(row.variant_id) ?? [];
      list.push({
        id: row.id,
        currency: row.currency,
        listPrice: Number(row.list_price),
        salePrice: row.sale_price === null ? null : Number(row.sale_price),
        startsAt: this.toIsoOrNull(row.starts_at),
        endsAt: this.toIsoOrNull(row.ends_at),
      });
      pricesByVariant.set(row.variant_id, list);
    }

    const imagesByProduct = new Map<string, ProductImage[]>();
    const imagesByVariant = new Map<string, ProductImage[]>();

    for (const row of imagesResult.rows) {
      const image: ProductImage = {
        id: row.id,
        url: row.url,
        altText: row.alt_text,
        sortOrder: row.sort_order,
        isPrimary: row.is_primary,
        variantId: row.variant_id,
      };

      if (row.variant_id) {
        const list = imagesByVariant.get(row.variant_id) ?? [];
        list.push(image);
        imagesByVariant.set(row.variant_id, list);
      } else {
        const list = imagesByProduct.get(row.product_id) ?? [];
        list.push(image);
        imagesByProduct.set(row.product_id, list);
      }
    }

    const variantsByProduct = new Map<string, ProductVariant[]>();
    for (const row of variantsResult.rows) {
      const list = variantsByProduct.get(row.product_id) ?? [];
      list.push({
        id: row.id,
        sku: row.sku,
        color: row.color,
        size: row.size,
        material: row.material,
        barcode: row.barcode,
        weightGrams: row.weight_grams,
        status: row.status,
        prices: pricesByVariant.get(row.id) ?? [],
        images: imagesByVariant.get(row.id) ?? [],
      });
      variantsByProduct.set(row.product_id, list);
    }

    return productsResult.rows.map((row) => ({
      id: row.id,
      sku: row.sku,
      name: row.name,
      slug: row.slug,
      description: row.description,
      brand: row.brand,
      status: row.status,
      createdAt: this.toIso(row.created_at),
      updatedAt: this.toIso(row.updated_at),
      categories: categoriesByProduct.get(row.id) ?? [],
      images: imagesByProduct.get(row.id) ?? [],
      variants: variantsByProduct.get(row.id) ?? [],
    }));
  }

  async findNewArrivals(limit: number): Promise<Product[]> {
    const products = await this.findAll();
    const cappedLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 8;

    return products
      .slice()
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      )
      .slice(0, cappedLimit);
  }

  async createProduct(input: CreateProductRequest): Promise<Product> {
    const result = await this.pool.query<ProductRow>(
      `INSERT INTO products
         (id, sku, name, slug, description, brand, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id, sku, name, slug, description, brand, status, created_at, updated_at`,
      [
        input.id,
        input.sku,
        input.name,
        input.slug,
        input.description ?? null,
        input.brand,
        input.status ?? 'ACTIVE',
      ],
    );

    const row = result.rows[0];

    return {
      id: row.id,
      sku: row.sku,
      name: row.name,
      slug: row.slug,
      description: row.description,
      brand: row.brand,
      status: row.status,
      createdAt: this.toIso(row.created_at),
      updatedAt: this.toIso(row.updated_at),
      categories: [],
      images: [],
      variants: [],
    };
  }

  async createVariant(
    input: CreateProductVariantRequest,
  ): Promise<ProductVariant> {
    try {
      const result = await this.pool.query<VariantRow>(
        `INSERT INTO product_variants
           (id, product_id, sku, color, size, material, barcode, weight_grams, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
         RETURNING id, product_id, sku, color, size, material, barcode, weight_grams, status`,
        [
          input.id,
          input.productId,
          input.sku,
          input.color ?? null,
          input.size ?? null,
          input.material ?? null,
          input.barcode ?? null,
          input.weightGrams ?? null,
          input.status ?? 'ACTIVE',
        ],
      );

      const row = result.rows[0];

      return {
        id: row.id,
        sku: row.sku,
        color: row.color,
        size: row.size,
        material: row.material,
        barcode: row.barcode,
        weightGrams: row.weight_grams,
        status: row.status,
        prices: [],
        images: [],
      };
    } catch (error) {
      this.handleCatalogWriteError(error);
    }
  }

  async updateProduct(input: UpdateProductRequest): Promise<Product> {
    const result = await this.pool.query<ProductRow>(
      `UPDATE products
       SET sku = COALESCE($2, sku),
           name = COALESCE($3, name),
           slug = COALESCE($4, slug),
           description = CASE WHEN $5::text IS NULL THEN description ELSE $5 END,
           brand = COALESCE($6, brand),
           status = COALESCE($7, status),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, sku, name, slug, description, brand, status, created_at, updated_at`,
      [
        input.id,
        input.sku ?? null,
        input.name ?? null,
        input.slug ?? null,
        input.description === undefined ? null : input.description,
        input.brand ?? null,
        input.status ?? null,
      ],
    );

    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException(`Product ${input.id} not found`);
    }

    return {
      id: row.id,
      sku: row.sku,
      name: row.name,
      slug: row.slug,
      description: row.description,
      brand: row.brand,
      status: row.status,
      createdAt: this.toIso(row.created_at),
      updatedAt: this.toIso(row.updated_at),
      categories: [],
      images: [],
      variants: [],
    };
  }

  async deleteProduct(productId: string): Promise<void> {
    const result = await this.pool.query(
      `DELETE FROM products
       WHERE id = $1`,
      [productId],
    );

    if ((result.rowCount ?? 0) === 0) {
      throw new NotFoundException(`Product ${productId} not found`);
    }
  }

  async updateVariant(input: UpdateProductVariantRequest): Promise<ProductVariant> {
    try {
      const result = await this.pool.query<VariantRow>(
        `UPDATE product_variants
         SET sku = COALESCE($2, sku),
             color = CASE WHEN $3::text IS NULL THEN color ELSE $3 END,
             size = CASE WHEN $4::text IS NULL THEN size ELSE $4 END,
             material = CASE WHEN $5::text IS NULL THEN material ELSE $5 END,
             barcode = CASE WHEN $6::text IS NULL THEN barcode ELSE $6 END,
             weight_grams = CASE WHEN $7::int IS NULL THEN weight_grams ELSE $7 END,
             status = COALESCE($8, status),
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, product_id, sku, color, size, material, barcode, weight_grams, status`,
        [
          input.id,
          input.sku ?? null,
          input.color === undefined ? null : input.color,
          input.size === undefined ? null : input.size,
          input.material === undefined ? null : input.material,
          input.barcode === undefined ? null : input.barcode,
          input.weightGrams === undefined ? null : input.weightGrams,
          input.status ?? null,
        ],
      );

      const row = result.rows[0];
      if (!row) {
        throw new NotFoundException(`Variant ${input.id} not found`);
      }

      return {
        id: row.id,
        sku: row.sku,
        color: row.color,
        size: row.size,
        material: row.material,
        barcode: row.barcode,
        weightGrams: row.weight_grams,
        status: row.status,
        prices: [],
        images: [],
      };
    } catch (error) {
      this.handleCatalogWriteError(error);
    }
  }

  async deleteVariant(variantId: string): Promise<void> {
    const result = await this.pool.query(
      `DELETE FROM product_variants
       WHERE id = $1`,
      [variantId],
    );

    if ((result.rowCount ?? 0) === 0) {
      throw new NotFoundException(`Variant ${variantId} not found`);
    }
  }

  async createPrice(input: CreateProductPriceRequest): Promise<ProductPrice> {
    const result = await this.pool.query<PriceRow>(
      `INSERT INTO product_prices
         (id, variant_id, currency, list_price, sale_price, starts_at, ends_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id, variant_id, currency, list_price, sale_price, starts_at, ends_at`,
      [
        input.id,
        input.variantId,
        input.currency,
        input.listPrice,
        input.salePrice ?? null,
        input.startsAt ?? null,
        input.endsAt ?? null,
      ],
    );

    return this.mapPrice(result.rows[0]);
  }

  async updatePrice(input: UpdateProductPriceRequest): Promise<ProductPrice> {
    const result = await this.pool.query<PriceRow>(
      `UPDATE product_prices
       SET currency = COALESCE($2, currency),
           list_price = COALESCE($3, list_price),
           sale_price = CASE WHEN $4::numeric IS NULL THEN sale_price ELSE $4 END,
           starts_at = CASE WHEN $5::timestamptz IS NULL THEN starts_at ELSE $5 END,
           ends_at = CASE WHEN $6::timestamptz IS NULL THEN ends_at ELSE $6 END
       WHERE id = $1
       RETURNING id, variant_id, currency, list_price, sale_price, starts_at, ends_at`,
      [
        input.id,
        input.currency ?? null,
        input.listPrice ?? null,
        input.salePrice === undefined ? null : input.salePrice,
        input.startsAt === undefined ? null : input.startsAt,
        input.endsAt === undefined ? null : input.endsAt,
      ],
    );

    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException(`Price ${input.id} not found`);
    }

    return this.mapPrice(row);
  }

  async deletePrice(priceId: string): Promise<void> {
    const result = await this.pool.query(
      `DELETE FROM product_prices
       WHERE id = $1`,
      [priceId],
    );

    if ((result.rowCount ?? 0) === 0) {
      throw new NotFoundException(`Price ${priceId} not found`);
    }
  }

  async createImage(input: CreateProductImageRequest): Promise<ProductImage> {
    const result = await this.pool.query<ImageRow>(
      `INSERT INTO product_images
         (id, product_id, variant_id, url, alt_text, sort_order, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, product_id, variant_id, url, alt_text, sort_order, is_primary`,
      [
        input.id,
        input.productId,
        input.variantId ?? null,
        input.url,
        input.altText ?? null,
        input.sortOrder ?? 0,
        input.isPrimary ?? false,
      ],
    );

    return this.mapImage(result.rows[0]);
  }

  async updateImage(input: UpdateProductImageRequest): Promise<ProductImage> {
    const result = await this.pool.query<ImageRow>(
      `UPDATE product_images
       SET url = COALESCE($2, url),
           alt_text = CASE WHEN $3::text IS NULL THEN alt_text ELSE $3 END,
           sort_order = COALESCE($4, sort_order),
           is_primary = COALESCE($5, is_primary),
           variant_id = CASE WHEN $6::text IS NULL THEN variant_id ELSE $6 END
       WHERE id = $1
       RETURNING id, product_id, variant_id, url, alt_text, sort_order, is_primary`,
      [
        input.id,
        input.url ?? null,
        input.altText === undefined ? null : input.altText,
        input.sortOrder ?? null,
        input.isPrimary ?? null,
        input.variantId === undefined ? null : input.variantId,
      ],
    );

    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException(`Image ${input.id} not found`);
    }

    return this.mapImage(row);
  }

  async deleteImage(imageId: string): Promise<void> {
    const result = await this.pool.query(
      `DELETE FROM product_images
       WHERE id = $1`,
      [imageId],
    );

    if ((result.rowCount ?? 0) === 0) {
      throw new NotFoundException(`Image ${imageId} not found`);
    }
  }

  async createCategory(input: CreateProductCategoryRequest): Promise<ProductCategory> {
    const result = await this.pool.query<CategoryEntityRow>(
      `INSERT INTO product_categories
         (id, name, slug, parent_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, slug`,
      [input.id, input.name, input.slug, input.parentId ?? null],
    );

    return this.mapCategory(result.rows[0]);
  }

  async updateCategory(input: UpdateProductCategoryRequest): Promise<ProductCategory> {
    const result = await this.pool.query<CategoryEntityRow>(
      `UPDATE product_categories
       SET name = COALESCE($2, name),
           slug = COALESCE($3, slug),
           parent_id = CASE WHEN $4::text IS NULL THEN parent_id ELSE $4 END
       WHERE id = $1
       RETURNING id, name, slug`,
      [
        input.id,
        input.name ?? null,
        input.slug ?? null,
        input.parentId === undefined ? null : input.parentId,
      ],
    );

    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException(`Category ${input.id} not found`);
    }

    return this.mapCategory(row);
  }

  async deleteCategory(categoryId: string): Promise<void> {
    const result = await this.pool.query(
      `DELETE FROM product_categories
       WHERE id = $1`,
      [categoryId],
    );

    if ((result.rowCount ?? 0) === 0) {
      throw new NotFoundException(`Category ${categoryId} not found`);
    }
  }

  async assignCategoryToProduct(productId: string, categoryId: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO product_category_map (product_id, category_id)
       VALUES ($1, $2)
       ON CONFLICT (product_id, category_id) DO NOTHING`,
      [productId, categoryId],
    );
  }

  async unassignCategoryFromProduct(productId: string, categoryId: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM product_category_map
       WHERE product_id = $1 AND category_id = $2`,
      [productId, categoryId],
    );
  }

  private mapPrice(row: PriceRow): ProductPrice {
    return {
      id: row.id,
      currency: row.currency,
      listPrice: Number(row.list_price),
      salePrice: row.sale_price === null ? null : Number(row.sale_price),
      startsAt: this.toIsoOrNull(row.starts_at),
      endsAt: this.toIsoOrNull(row.ends_at),
    };
  }

  private mapImage(row: ImageRow): ProductImage {
    return {
      id: row.id,
      url: row.url,
      altText: row.alt_text,
      sortOrder: row.sort_order,
      isPrimary: row.is_primary,
      variantId: row.variant_id,
    };
  }

  private mapCategory(row: CategoryEntityRow): ProductCategory {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
    };
  }

  private handleCatalogWriteError(error: unknown): never {
    const pgError = error as { code?: string; constraint?: string };

    if (pgError.code === '23505') {
      if (pgError.constraint?.includes('sku')) {
        throw new ConflictException('SKU already exists.');
      }
      if (pgError.constraint?.includes('barcode')) {
        throw new ConflictException('Barcode already exists.');
      }
      if (pgError.constraint?.includes('slug')) {
        throw new ConflictException('Slug already exists.');
      }
      throw new ConflictException('Duplicated value violates unique constraint.');
    }

    throw error;
  }

  private toIso(value: Date | string): string {
    return value instanceof Date
      ? value.toISOString()
      : new Date(value).toISOString();
  }

  private toIsoOrNull(value: Date | string | null): string | null {
    if (value === null) {
      return null;
    }

    return this.toIso(value);
  }
}
