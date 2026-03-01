import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../../shared/api';
import type { Product, ProductCategory } from '../../../shared/types';
import type { InventoryItem } from '../types';

type UseAdminCatalogOptions = {
  token: string;
  products: Product[];
  categories: ProductCategory[];
  setProducts: (products: Product[]) => void;
  refreshProductsAndCategories: () => Promise<void>;
  refreshInventory: () => Promise<void>;
};

export function useAdminCatalog(options: UseAdminCatalogOptions) {
  const {
    token,
    products,
    categories,
    setProducts,
    refreshProductsAndCategories,
    refreshInventory,
  } = options;
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [productForm, setProductForm] = useState({
    id: '',
    sku: '',
    name: '',
    slug: '',
    brand: '',
    description: '',
  });
  const [productMessage, setProductMessage] = useState('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [stockForm, setStockForm] = useState({
    productId: '',
    variantId: '',
    quantityOnHand: 0,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });
  const [stockMessage, setStockMessage] = useState('');
  const [categoryForm, setCategoryForm] = useState({
    id: '',
    name: '',
    slug: '',
  });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryMessage, setCategoryMessage] = useState('');
  const [variantForm, setVariantForm] = useState({
    id: '',
    productId: '',
    sku: '',
    color: '',
    size: '',
    material: '',
    barcode: '',
    weightGrams: 0,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [variantMessage, setVariantMessage] = useState('');
  const [priceForm, setPriceForm] = useState({
    id: '',
    variantId: '',
    currency: 'USD',
    listPrice: 0,
    salePrice: 0,
    startsAt: '',
    endsAt: '',
  });
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceMessage, setPriceMessage] = useState('');
  const [imageForm, setImageForm] = useState({
    id: '',
    productId: '',
    variantId: '',
    url: '',
    altText: '',
    sortOrder: 0,
    isPrimary: false,
  });
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [imageMessage, setImageMessage] = useState('');

  useEffect(() => {
    if (products.length === 0) {
      if (selectedProductId) {
        setSelectedProductId('');
      }
      return;
    }

    if (!selectedProductId || !products.some((product) => product.id === selectedProductId)) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId],
  );

  useEffect(() => {
    const variants = selectedProduct?.variants ?? [];
    if (variants.length === 0) {
      if (selectedVariantId) {
        setSelectedVariantId('');
      }
      return;
    }

    if (!selectedVariantId || !variants.some((variant) => variant.id === selectedVariantId)) {
      setSelectedVariantId(variants[0].id);
    }
  }, [selectedProduct, selectedVariantId]);

  const selectedVariant = useMemo(
    () => selectedProduct?.variants.find((variant) => variant.id === selectedVariantId) ?? null,
    [selectedProduct, selectedVariantId],
  );

  function patchProductForm(patch: Partial<typeof productForm>) {
    setProductForm((current) => ({
      ...current,
      ...patch,
    }));
  }

  function patchStockForm(patch: Partial<typeof stockForm>) {
    setStockForm((current) => ({
      ...current,
      ...patch,
    }));
  }

  function patchCategoryForm(patch: Partial<typeof categoryForm>) {
    setCategoryForm((current) => ({
      ...current,
      ...patch,
    }));
  }

  function patchVariantForm(patch: Partial<typeof variantForm>) {
    setVariantForm((current) => ({
      ...current,
      ...patch,
    }));
  }

  function patchPriceForm(patch: Partial<typeof priceForm>) {
    setPriceForm((current) => ({
      ...current,
      ...patch,
    }));
  }

  function patchImageForm(patch: Partial<typeof imageForm>) {
    setImageForm((current) => ({
      ...current,
      ...patch,
    }));
  }

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProductMessage('');

    if (
      !productForm.id.trim() ||
      !productForm.sku.trim() ||
      !productForm.name.trim() ||
      !productForm.slug.trim() ||
      !productForm.brand.trim()
    ) {
      setProductMessage('Please complete required fields: id, sku, name, slug, brand.');
      return;
    }

    const isEdit = editingProductId !== null;

    try {
      if (isEdit) {
        await apiFetch(`/catalog/products/${editingProductId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            sku: productForm.sku.trim(),
            name: productForm.name.trim(),
            slug: productForm.slug.trim(),
            brand: productForm.brand.trim(),
            description: productForm.description.trim() || null,
          }),
        });
      } else {
        await apiFetch('/catalog/products', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            id: productForm.id.trim(),
            sku: productForm.sku.trim(),
            name: productForm.name.trim(),
            slug: productForm.slug.trim(),
            brand: productForm.brand.trim(),
            description: productForm.description.trim() || null,
          }),
        });
      }

      const refreshed = await apiFetch<Product[]>('/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(refreshed);
      setProductMessage(isEdit ? 'Product updated successfully.' : 'Product created successfully.');
      setEditingProductId(null);
      setProductForm({ id: '', sku: '', name: '', slug: '', brand: '', description: '' });
    } catch (createError) {
      setProductMessage(String(createError));
    }
  }

  async function handleDeleteProduct(productId: string) {
    setProductMessage('');

    try {
      await apiFetch(`/catalog/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const refreshed = await apiFetch<Product[]>('/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(refreshed);
      if (editingProductId === productId) {
        setEditingProductId(null);
        setProductForm({ id: '', sku: '', name: '', slug: '', brand: '', description: '' });
      }
      setProductMessage('Product deleted successfully.');
    } catch (deleteError) {
      setProductMessage(String(deleteError));
    }
  }

  function handleEditProduct(product: Product, onSectionChange?: () => void) {
    onSectionChange?.();
    setEditingProductId(product.id);
    setProductMessage('');
    setProductForm({
      id: product.id,
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      description: product.description ?? '',
    });
  }

  function resetProductForm() {
    setEditingProductId(null);
    setProductForm({ id: '', sku: '', name: '', slug: '', brand: '', description: '' });
    setProductMessage('');
  }

  async function handleCreateOrUpdateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCategoryMessage('');

    if (!categoryForm.id.trim() || !categoryForm.name.trim() || !categoryForm.slug.trim()) {
      setCategoryMessage('Please complete required fields: id, name and slug.');
      return;
    }

    try {
      if (editingCategoryId) {
        await apiFetch(`/catalog/categories/${editingCategoryId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: categoryForm.name.trim(), slug: categoryForm.slug.trim() }),
        });
      } else {
        await apiFetch('/catalog/categories', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            id: categoryForm.id.trim(),
            name: categoryForm.name.trim(),
            slug: categoryForm.slug.trim(),
          }),
        });
      }

      await refreshProductsAndCategories();
      setCategoryMessage(
        editingCategoryId ? 'Category updated successfully.' : 'Category created successfully.',
      );
      setEditingCategoryId(null);
      setCategoryForm({ id: '', name: '', slug: '' });
    } catch (categoryError) {
      setCategoryMessage(String(categoryError));
    }
  }

  async function handleDeleteCategory(categoryId: string) {
    setCategoryMessage('');
    try {
      await apiFetch(`/catalog/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await refreshProductsAndCategories();
      setCategoryMessage('Category deleted successfully.');
    } catch (categoryError) {
      setCategoryMessage(String(categoryError));
    }
  }

  function handleEditCategory(category: ProductCategory) {
    setEditingCategoryId(category.id);
    setCategoryMessage('');
    setCategoryForm({
      id: category.id,
      name: category.name,
      slug: category.slug,
    });
  }

  function resetCategoryForm() {
    setEditingCategoryId(null);
    setCategoryForm({ id: '', name: '', slug: '' });
    setCategoryMessage('');
  }

  async function handleAssignCategory(categoryId: string) {
    if (!selectedProductId) {
      setCategoryMessage('Select a product first.');
      return;
    }
    setCategoryMessage('');
    try {
      await apiFetch(`/catalog/products/${selectedProductId}/categories`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ categoryId }),
      });
      await refreshProductsAndCategories();
      setCategoryMessage('Category assigned to product.');
    } catch (categoryError) {
      setCategoryMessage(String(categoryError));
    }
  }

  async function handleUnassignCategory(categoryId: string) {
    if (!selectedProductId) {
      setCategoryMessage('Select a product first.');
      return;
    }
    setCategoryMessage('');
    try {
      await apiFetch(`/catalog/products/${selectedProductId}/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await refreshProductsAndCategories();
      setCategoryMessage('Category unassigned from product.');
    } catch (categoryError) {
      setCategoryMessage(String(categoryError));
    }
  }

  async function handleCreateOrUpdateVariant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVariantMessage('');

    const productId = variantForm.productId.trim() || selectedProductId;
    if (!productId || !variantForm.id.trim() || !variantForm.sku.trim()) {
      setVariantMessage('Please complete required fields: product, id, sku.');
      return;
    }

    try {
      if (editingVariantId) {
        await apiFetch(`/catalog/variants/${editingVariantId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            sku: variantForm.sku.trim(),
            color: variantForm.color.trim() || null,
            size: variantForm.size.trim() || null,
            material: variantForm.material.trim() || null,
            barcode: variantForm.barcode.trim() || null,
            weightGrams: Number(variantForm.weightGrams),
            status: variantForm.status,
          }),
        });
      } else {
        await apiFetch('/catalog/variants', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            id: variantForm.id.trim(),
            productId,
            sku: variantForm.sku.trim(),
            color: variantForm.color.trim() || null,
            size: variantForm.size.trim() || null,
            material: variantForm.material.trim() || null,
            barcode: variantForm.barcode.trim() || null,
            weightGrams: Number(variantForm.weightGrams),
            status: variantForm.status,
          }),
        });
      }

      await refreshProductsAndCategories();
      setVariantMessage(
        editingVariantId ? 'Variant updated successfully.' : 'Variant created successfully.',
      );
      setEditingVariantId(null);
      setVariantForm({
        id: '',
        productId,
        sku: '',
        color: '',
        size: '',
        material: '',
        barcode: '',
        weightGrams: 0,
        status: 'ACTIVE',
      });
    } catch (variantError) {
      setVariantMessage(String(variantError));
    }
  }

  async function handleDeleteVariant(variantId: string) {
    setVariantMessage('');
    try {
      await apiFetch(`/catalog/variants/${variantId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await refreshProductsAndCategories();
      setVariantMessage('Variant deleted successfully.');
    } catch (variantError) {
      setVariantMessage(String(variantError));
    }
  }

  function handleEditVariant(variantId: string) {
    const variant = selectedProduct?.variants.find((item) => item.id === variantId);
    if (!variant) {
      return;
    }

    setEditingVariantId(variant.id);
    setVariantMessage('');
    setVariantForm({
      id: variant.id,
      productId: selectedProduct?.id ?? '',
      sku: variant.sku,
      color: variant.color ?? '',
      size: variant.size ?? '',
      material: variant.material ?? '',
      barcode: variant.barcode ?? '',
      weightGrams: variant.weightGrams ?? 0,
      status: (variant.status as 'ACTIVE' | 'INACTIVE') ?? 'ACTIVE',
    });
  }

  function resetVariantForm() {
    setEditingVariantId(null);
    setVariantForm({
      id: '',
      productId: selectedProductId,
      sku: '',
      color: '',
      size: '',
      material: '',
      barcode: '',
      weightGrams: 0,
      status: 'ACTIVE',
    });
    setVariantMessage('');
  }

  async function handleCreateOrUpdatePrice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPriceMessage('');
    if (!priceForm.id.trim() || !priceForm.variantId.trim() || !priceForm.currency.trim()) {
      setPriceMessage('Please complete required fields: id, variantId, currency.');
      return;
    }

    try {
      if (editingPriceId) {
        await apiFetch(`/catalog/prices/${editingPriceId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            currency: priceForm.currency.trim(),
            listPrice: Number(priceForm.listPrice),
            salePrice: Number(priceForm.salePrice) || null,
            startsAt: priceForm.startsAt || null,
            endsAt: priceForm.endsAt || null,
          }),
        });
      } else {
        await apiFetch('/catalog/prices', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            id: priceForm.id.trim(),
            variantId: priceForm.variantId.trim(),
            currency: priceForm.currency.trim(),
            listPrice: Number(priceForm.listPrice),
            salePrice: Number(priceForm.salePrice) || null,
            startsAt: priceForm.startsAt || null,
            endsAt: priceForm.endsAt || null,
          }),
        });
      }

      await refreshProductsAndCategories();
      setPriceMessage(editingPriceId ? 'Price updated successfully.' : 'Price created successfully.');
      setEditingPriceId(null);
      setPriceForm({
        id: '',
        variantId: priceForm.variantId,
        currency: 'USD',
        listPrice: 0,
        salePrice: 0,
        startsAt: '',
        endsAt: '',
      });
    } catch (priceError) {
      setPriceMessage(String(priceError));
    }
  }

  async function handleDeletePrice(priceId: string) {
    setPriceMessage('');
    try {
      await apiFetch(`/catalog/prices/${priceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await refreshProductsAndCategories();
      setPriceMessage('Price deleted successfully.');
    } catch (priceError) {
      setPriceMessage(String(priceError));
    }
  }

  function handleEditPrice(priceId: string) {
    const price = selectedVariant?.prices.find((item) => item.id === priceId);
    if (!price) {
      return;
    }

    setEditingPriceId(price.id);
    setPriceMessage('');
    setPriceForm({
      id: price.id,
      variantId: selectedVariant?.id ?? '',
      currency: price.currency,
      listPrice: price.listPrice,
      salePrice: price.salePrice ?? 0,
      startsAt: price.startsAt ?? '',
      endsAt: price.endsAt ?? '',
    });
  }

  function resetPriceForm() {
    setEditingPriceId(null);
    setPriceForm({
      id: '',
      variantId: selectedVariantId,
      currency: 'USD',
      listPrice: 0,
      salePrice: 0,
      startsAt: '',
      endsAt: '',
    });
    setPriceMessage('');
  }

  async function handleCreateOrUpdateImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setImageMessage('');
    if (!imageForm.id.trim() || !imageForm.productId.trim() || !imageForm.url.trim()) {
      setImageMessage('Please complete required fields: id, productId, url.');
      return;
    }

    try {
      if (editingImageId) {
        await apiFetch(`/catalog/images/${editingImageId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            url: imageForm.url.trim(),
            altText: imageForm.altText.trim() || null,
            sortOrder: Number(imageForm.sortOrder),
            isPrimary: imageForm.isPrimary,
            variantId: imageForm.variantId.trim() || null,
          }),
        });
      } else {
        await apiFetch('/catalog/images', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            id: imageForm.id.trim(),
            productId: imageForm.productId.trim(),
            variantId: imageForm.variantId.trim() || null,
            url: imageForm.url.trim(),
            altText: imageForm.altText.trim() || null,
            sortOrder: Number(imageForm.sortOrder),
            isPrimary: imageForm.isPrimary,
          }),
        });
      }

      await refreshProductsAndCategories();
      setImageMessage(editingImageId ? 'Image updated successfully.' : 'Image created successfully.');
      setEditingImageId(null);
      setImageForm({
        id: '',
        productId: imageForm.productId,
        variantId: '',
        url: '',
        altText: '',
        sortOrder: 0,
        isPrimary: false,
      });
    } catch (imageError) {
      setImageMessage(String(imageError));
    }
  }

  async function handleDeleteImage(imageId: string) {
    setImageMessage('');
    try {
      await apiFetch(`/catalog/images/${imageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await refreshProductsAndCategories();
      setImageMessage('Image deleted successfully.');
    } catch (imageError) {
      setImageMessage(String(imageError));
    }
  }

  function handleEditImage(imageId: string) {
    const image = selectedProduct?.images.find((item) => item.id === imageId);
    if (!image) {
      return;
    }

    setEditingImageId(image.id);
    setImageMessage('');
    setImageForm({
      id: image.id,
      productId: selectedProduct?.id ?? '',
      variantId: image.variantId ?? '',
      url: image.url,
      altText: image.altText ?? '',
      sortOrder: image.sortOrder,
      isPrimary: image.isPrimary,
    });
  }

  function resetImageForm() {
    setEditingImageId(null);
    setImageForm({
      id: '',
      productId: selectedProductId,
      variantId: '',
      url: '',
      altText: '',
      sortOrder: 0,
      isPrimary: false,
    });
    setImageMessage('');
  }

  async function handleUpsertStock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStockMessage('');

    if (!stockForm.productId.trim()) {
      setStockMessage('Please choose a product.');
      return;
    }

    if (stockForm.quantityOnHand < 0) {
      setStockMessage('Quantity on hand cannot be negative.');
      return;
    }

    try {
      await apiFetch('/inventory/stock', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          productId: stockForm.productId.trim(),
          variantId: stockForm.variantId.trim() || null,
          quantityOnHand: Number(stockForm.quantityOnHand),
          status: stockForm.status,
        }),
      });

      await refreshInventory();
      setStockMessage('Stock updated successfully.');
      setStockForm((current) => ({ ...current, quantityOnHand: 0 }));
    } catch (upsertError) {
      setStockMessage(String(upsertError));
    }
  }

  function handleEditStock(item: InventoryItem) {
    setStockMessage('');
    setStockForm({
      productId: item.productId,
      variantId: item.variantId ?? '',
      quantityOnHand: item.quantityOnHand,
      status: item.status,
    });
  }

  async function handleDeleteStockItem(item: InventoryItem) {
    setStockMessage('');

    try {
      await apiFetch('/inventory/stock', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: item.productId, variantId: item.variantId }),
      });

      await refreshInventory();
      setStockMessage('Stock item deleted successfully.');
    } catch (deleteError) {
      setStockMessage(String(deleteError));
    }
  }

  return {
    products,
    categories,
    selectedProductId,
    setSelectedProductId,
    selectedVariantId,
    setSelectedVariantId,
    selectedProduct,
    selectedVariant,
    productForm,
    setProductForm,
    patchProductForm,
    productMessage,
    editingProductId,
    setEditingProductId,
    stockForm,
    setStockForm,
    patchStockForm,
    stockMessage,
    categoryForm,
    setCategoryForm,
    patchCategoryForm,
    editingCategoryId,
    setEditingCategoryId,
    categoryMessage,
    variantForm,
    setVariantForm,
    patchVariantForm,
    editingVariantId,
    setEditingVariantId,
    variantMessage,
    priceForm,
    setPriceForm,
    patchPriceForm,
    editingPriceId,
    setEditingPriceId,
    priceMessage,
    imageForm,
    setImageForm,
    patchImageForm,
    editingImageId,
    setEditingImageId,
    imageMessage,
    handleCreateProduct,
    handleDeleteProduct,
    handleEditProduct,
    resetProductForm,
    handleCreateOrUpdateCategory,
    handleDeleteCategory,
    handleEditCategory,
    resetCategoryForm,
    handleAssignCategory,
    handleUnassignCategory,
    handleCreateOrUpdateVariant,
    handleDeleteVariant,
    handleEditVariant,
    resetVariantForm,
    handleCreateOrUpdatePrice,
    handleDeletePrice,
    handleEditPrice,
    resetPriceForm,
    handleCreateOrUpdateImage,
    handleDeleteImage,
    handleEditImage,
    resetImageForm,
    handleUpsertStock,
    handleEditStock,
    handleDeleteStockItem,
  };
}
