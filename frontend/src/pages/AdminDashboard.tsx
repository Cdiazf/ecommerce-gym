import { useState } from 'react';
import { AdminContentRouter } from './admin/AdminContentRouter';
import { AdminSidebar } from './admin/AdminSidebar';
import { ShipmentFailureModal } from './admin/ShipmentFailureModal';
import { useAdminCatalog } from './admin/hooks/useAdminCatalog';
import { useAdminShipments } from './admin/hooks/useAdminShipments';
import { useAdminDashboardData } from './admin/hooks/useAdminDashboardData';
import type { AdminSection } from './admin/admin-sections';
import type { Order } from '../shared/types';

type AdminDashboardProps = {
  token: string;
};

export function AdminDashboard(props: AdminDashboardProps) {
  const { token } = props;
  const [section, setSection] = useState<AdminSection>('dashboard');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const dashboardData = useAdminDashboardData(token);
  const catalog = useAdminCatalog({
    token,
    products: dashboardData.products,
    categories: dashboardData.categories,
    setProducts: dashboardData.setProducts,
    refreshProductsAndCategories: dashboardData.refreshProductsAndCategories,
    refreshInventory: dashboardData.refreshInventory,
  });
  const shipmentsState = useAdminShipments(
    token,
    dashboardData.setError,
    dashboardData.refreshShipments,
  );

  return (
    <main className="container py-5">
      <div className="row g-4">
        <aside className="col-lg-3">
          <AdminSidebar section={section} onSectionChange={setSection} />
        </aside>

        <section className="col-lg-9">
          <AdminContentRouter
            section={section}
            onSectionChange={setSection}
            dashboardData={dashboardData}
            catalog={catalog}
            shipmentsState={shipmentsState}
            selectedOrder={selectedOrder}
            onSelectOrder={setSelectedOrder}
          />

          {shipmentsState.shipmentFailureModal && (
            <ShipmentFailureModal
              modal={shipmentsState.shipmentFailureModal}
              presets={shipmentsState.shipmentFailurePresets}
              onClose={shipmentsState.closeShipmentFailureModal}
              onConfirm={() => {
                void shipmentsState.handleConfirmShipmentFailure();
              }}
              onPresetChange={shipmentsState.setShipmentFailurePreset}
              onCustomNoteChange={shipmentsState.setShipmentFailureCustomNote}
            />
          )}
        </section>
      </div>
    </main>
  );
}
