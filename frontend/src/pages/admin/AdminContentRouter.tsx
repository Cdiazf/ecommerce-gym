import { AdminCatalogSection } from './AdminCatalogSection';
import { CategoriesSection } from './CategoriesSection';
import { ImagesSection } from './ImagesSection';
import { AdminOrdersSection } from './AdminOrdersSection';
import { AdminOverviewSection } from './AdminOverviewSection';
import { AdminPaymentsSection } from './AdminPaymentsSection';
import { AdminShipmentsSection } from './AdminShipmentsSection';
import { InventorySection } from './InventorySection';
import { PricesSection } from './PricesSection';
import { ProductDetailSection } from './ProductDetailSection';
import { ProductsSection } from './ProductsSection';
import { AdminUsersSection } from './AdminUsersSection';
import { VariantsSection } from './VariantsSection';
import { useAdminCatalog } from './hooks/useAdminCatalog';
import {
  getLatestShipmentNote,
  getShipmentActions,
  getShipmentStatusBadgeClass,
  useAdminShipments,
} from './hooks/useAdminShipments';
import { useAdminDashboardData } from './hooks/useAdminDashboardData';
import type { Order } from '../../shared/types';
import type { AdminSection } from './admin-sections';

type AdminContentRouterProps = {
  section: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  dashboardData: ReturnType<typeof useAdminDashboardData>;
  catalog: ReturnType<typeof useAdminCatalog>;
  shipmentsState: ReturnType<typeof useAdminShipments>;
  selectedOrder: Order | null;
  onSelectOrder: (order: Order | null) => void;
};

export function AdminContentRouter(props: AdminContentRouterProps) {
  const { section, onSectionChange, dashboardData, catalog, shipmentsState, selectedOrder, onSelectOrder } =
    props;

  const {
    orders,
    byUser,
    users,
    shipments,
    products,
    inventoryItems,
    categories,
    loading,
    error,
    totals,
    filteredOrders,
    filteredPayments,
    reconciliation,
    ordersCustomerQuery,
    setOrdersCustomerQuery,
    ordersStatusFilter,
    setOrdersStatusFilter,
    paymentsCustomerQuery,
    setPaymentsCustomerQuery,
    paymentsStatusFilter,
    setPaymentsStatusFilter,
    paymentsMethodFilter,
    setPaymentsMethodFilter,
    exportOrdersCsv,
    exportPaymentsCsv,
  } = dashboardData;

  const {
    selectedProductId,
    setSelectedProductId,
    selectedVariantId,
    setSelectedVariantId,
    selectedProduct,
    selectedVariant,
    productForm,
    patchProductForm,
    productMessage,
    editingProductId,
    stockForm,
    patchStockForm,
    stockMessage,
    categoryForm,
    patchCategoryForm,
    editingCategoryId,
    categoryMessage,
    variantForm,
    patchVariantForm,
    editingVariantId,
    variantMessage,
    priceForm,
    patchPriceForm,
    editingPriceId,
    priceMessage,
    imageForm,
    patchImageForm,
    editingImageId,
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
  } = catalog;

  const {
    openShipmentFailureModal,
    handleUpdateShipmentStatus,
  } = shipmentsState;

  if (section === 'dashboard') {
    return (
      <AdminOverviewSection
        loading={loading}
        error={error}
        totals={totals}
        byUser={byUser}
        orders={orders}
        reconciliation={reconciliation}
        onExportOrdersCsv={exportOrdersCsv}
        onExportPaymentsCsv={exportPaymentsCsv}
      />
    );
  }

  if (section === 'payments') {
    return (
      <AdminPaymentsSection
        loading={loading}
        error={error}
        filteredPayments={filteredPayments}
        paymentsCustomerQuery={paymentsCustomerQuery}
        paymentsStatusFilter={paymentsStatusFilter}
        paymentsMethodFilter={paymentsMethodFilter}
        reconciliation={reconciliation}
        onPaymentsCustomerQueryChange={setPaymentsCustomerQuery}
        onPaymentsStatusFilterChange={setPaymentsStatusFilter}
        onPaymentsMethodFilterChange={setPaymentsMethodFilter}
        onExportPaymentsCsv={exportPaymentsCsv}
      />
    );
  }

  if (section === 'shipments') {
    return (
      <AdminShipmentsSection
        loading={loading}
        error={error}
        shipments={shipments}
        getShipmentStatusBadgeClass={getShipmentStatusBadgeClass}
        getLatestShipmentNote={getLatestShipmentNote}
        getShipmentActions={getShipmentActions}
        onReportFailure={openShipmentFailureModal}
        onUpdateStatus={(orderId, status) => {
          void handleUpdateShipmentStatus(orderId, status);
        }}
      />
    );
  }

  if (section === 'users') {
    return <AdminUsersSection loading={loading} error={error} users={users} />;
  }

  if (section === 'orders') {
    return (
      <AdminOrdersSection
        loading={loading}
        error={error}
        filteredOrders={filteredOrders}
        selectedOrder={selectedOrder}
        ordersCustomerQuery={ordersCustomerQuery}
        ordersStatusFilter={ordersStatusFilter}
        onOrdersCustomerQueryChange={setOrdersCustomerQuery}
        onOrdersStatusFilterChange={setOrdersStatusFilter}
        onSelectOrder={onSelectOrder}
        onExportOrdersCsv={exportOrdersCsv}
      />
    );
  }

  if (section === 'products') {
    return (
      <AdminCatalogSection section="products">
        <ProductsSection
          products={products}
          productForm={productForm}
          productMessage={productMessage}
          editingProductId={editingProductId}
          onSubmit={handleCreateProduct}
          onProductFormChange={patchProductForm}
          onCancelEdit={resetProductForm}
          onEditProduct={(product) => handleEditProduct(product, () => onSectionChange('products'))}
          onDeleteProduct={(productId) => {
            void handleDeleteProduct(productId);
          }}
        />
      </AdminCatalogSection>
    );
  }

  if (section === 'categories') {
    return (
      <AdminCatalogSection section="categories">
        <CategoriesSection
          products={products}
          categories={categories}
          selectedProductId={selectedProductId}
          selectedProduct={selectedProduct}
          categoryForm={categoryForm}
          categoryMessage={categoryMessage}
          editingCategoryId={editingCategoryId}
          onSubmit={handleCreateOrUpdateCategory}
          onSelectProduct={setSelectedProductId}
          onCategoryFormChange={patchCategoryForm}
          onCancelEdit={resetCategoryForm}
          onDeleteCategory={(categoryId) => {
            void handleDeleteCategory(categoryId);
          }}
          onAssignCategory={(categoryId) => {
            void handleAssignCategory(categoryId);
          }}
          onUnassignCategory={(categoryId) => {
            void handleUnassignCategory(categoryId);
          }}
          onEditCategory={handleEditCategory}
        />
      </AdminCatalogSection>
    );
  }

  if (section === 'variants') {
    return (
      <AdminCatalogSection section="variants">
        <VariantsSection
          products={products}
          selectedProductId={selectedProductId}
          selectedProduct={selectedProduct}
          variantForm={variantForm}
          variantMessage={variantMessage}
          editingVariantId={editingVariantId}
          onSubmit={handleCreateOrUpdateVariant}
          onVariantFormChange={patchVariantForm}
          onCancelEdit={resetVariantForm}
          onEditVariant={handleEditVariant}
          onDeleteVariant={(variantId) => {
            void handleDeleteVariant(variantId);
          }}
        />
      </AdminCatalogSection>
    );
  }

  if (section === 'prices') {
    return (
      <AdminCatalogSection section="prices">
        <PricesSection
          products={products}
          selectedProductId={selectedProductId}
          selectedVariantId={selectedVariantId}
          selectedProduct={selectedProduct}
          selectedVariant={selectedVariant}
          priceForm={priceForm}
          priceMessage={priceMessage}
          editingPriceId={editingPriceId}
          onSelectProduct={setSelectedProductId}
          onSelectVariant={setSelectedVariantId}
          onSubmit={handleCreateOrUpdatePrice}
          onPriceFormChange={patchPriceForm}
          onCancelEdit={resetPriceForm}
          onEditPrice={handleEditPrice}
          onDeletePrice={(priceId) => {
            void handleDeletePrice(priceId);
          }}
        />
      </AdminCatalogSection>
    );
  }

  if (section === 'images') {
    return (
      <AdminCatalogSection section="images">
        <ImagesSection
          products={products}
          selectedProduct={selectedProduct}
          imageForm={imageForm}
          imageMessage={imageMessage}
          editingImageId={editingImageId}
          onSubmit={handleCreateOrUpdateImage}
          onImageFormChange={patchImageForm}
          onCancelEdit={resetImageForm}
          onEditImage={handleEditImage}
          onDeleteImage={(imageId) => {
            void handleDeleteImage(imageId);
          }}
        />
      </AdminCatalogSection>
    );
  }

  if (section === 'product-detail') {
    return (
      <AdminCatalogSection section="product-detail">
        <ProductDetailSection
          products={products}
          selectedProductId={selectedProductId}
          selectedProduct={selectedProduct}
          onSelectProduct={setSelectedProductId}
        />
      </AdminCatalogSection>
    );
  }

  if (section === 'inventory') {
    return (
      <AdminCatalogSection section="inventory">
        <InventorySection
          products={products}
          inventoryItems={inventoryItems}
          stockForm={stockForm}
          stockMessage={stockMessage}
          onSubmit={handleUpsertStock}
          onStockFormChange={patchStockForm}
          onEditStock={(item) => {
            onSectionChange('inventory');
            handleEditStock(item);
          }}
          onDeleteStockItem={(item) => {
            void handleDeleteStockItem(item);
          }}
        />
      </AdminCatalogSection>
    );
  }

  return null;
}
