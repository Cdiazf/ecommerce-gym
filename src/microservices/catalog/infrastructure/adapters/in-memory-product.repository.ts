import { Injectable } from '@nestjs/common';
import { ProductQueryPort } from '../../application/ports/product-query.port';
import { Product, ProductCategory } from '../../domain/product';

@Injectable()
export class InMemoryProductRepository implements ProductQueryPort {
  private readonly products: Product[] = [
    {
      id: 'shoe-01',
      sku: 'RUNSHOE-PRO',
      name: 'Running Shoes Pro',
      slug: 'running-shoes-pro',
      description: 'Professional running shoes for long-distance training.',
      brand: 'AeroFit',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      categories: [
        { id: 'cat-shoes', name: 'Shoes', slug: 'shoes' },
        { id: 'cat-running', name: 'Running', slug: 'running' },
      ],
      images: [
        {
          id: 'img-shoe-01',
          url: 'https://cdn.example.com/products/shoe-01/main.jpg',
          altText: 'Running Shoes Pro main image',
          sortOrder: 1,
          isPrimary: true,
          variantId: null,
        },
      ],
      variants: [
        {
          id: 'var-shoe-01-blue-42',
          sku: 'RUNSHOE-PRO-BLUE-42',
          color: 'Blue',
          size: '42',
          material: 'Mesh',
          barcode: '770100000001',
          weightGrams: 290,
          status: 'ACTIVE',
          prices: [
            {
              id: 'price-shoe-01-blue-42',
              currency: 'USD',
              listPrice: 119.9,
              salePrice: 99.9,
              startsAt: null,
              endsAt: null,
            },
          ],
          images: [
            {
              id: 'img-shoe-01-blue-42',
              url: 'https://cdn.example.com/products/shoe-01/blue-42.jpg',
              altText: 'Running Shoes Pro blue size 42',
              sortOrder: 1,
              isPrimary: true,
              variantId: 'var-shoe-01-blue-42',
            },
          ],
        },
      ],
    },
  ];

  findAll(): Promise<Product[]> {
    return Promise.resolve(this.products);
  }

  findById(productId: string): Promise<Product | null> {
    return Promise.resolve(
      this.products.find((product) => product.id === productId) ?? null,
    );
  }

  listCategories(): Promise<ProductCategory[]> {
    const categoriesMap = new Map<string, ProductCategory>();

    for (const product of this.products) {
      for (const category of product.categories) {
        categoriesMap.set(category.id, category);
      }
    }

    return Promise.resolve(Array.from(categoriesMap.values()));
  }
}
