import type { ReactNode } from 'react';

type CatalogSectionKey =
  | 'products'
  | 'categories'
  | 'variants'
  | 'prices'
  | 'images'
  | 'product-detail'
  | 'inventory';

const metadata: Record<CatalogSectionKey, { title: string; description: string }> = {
  products: {
    title: 'Products',
    description: 'Create new catalog products and review current items.',
  },
  categories: {
    title: 'Categories',
    description: 'CRUD for product categories.',
  },
  variants: {
    title: 'Variants',
    description: 'CRUD for product variants.',
  },
  prices: {
    title: 'Prices',
    description: 'CRUD for variant prices.',
  },
  images: {
    title: 'Images',
    description: 'CRUD for product and variant images.',
  },
  'product-detail': {
    title: 'Product Detail',
    description: 'Consolidated admin view of a product object.',
  },
  inventory: {
    title: 'Inventory',
    description: 'Update stock availability for catalog products.',
  },
};

type AdminCatalogSectionProps = {
  section: CatalogSectionKey;
  children: ReactNode;
};

export function AdminCatalogSection(props: AdminCatalogSectionProps) {
  const { section, children } = props;
  const details = metadata[section];

  return (
    <>
      <section className="mb-4">
        <h1 className="h3 mb-1">{details.title}</h1>
        <p className="text-secondary mb-0">{details.description}</p>
      </section>
      {children}
    </>
  );
}
