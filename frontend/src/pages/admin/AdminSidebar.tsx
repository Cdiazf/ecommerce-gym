import type { AdminSection } from './admin-sections';

type SidebarItem = {
  id: AdminSection;
  label: string;
};

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'dashboard', label: 'Admin Dashboard' },
  { id: 'orders', label: 'Orders' },
  { id: 'payments', label: 'Payments' },
  { id: 'shipments', label: 'Shipments' },
  { id: 'users', label: 'Users' },
  { id: 'products', label: 'Products' },
  { id: 'categories', label: 'Categories' },
  { id: 'variants', label: 'Variants' },
  { id: 'prices', label: 'Prices' },
  { id: 'images', label: 'Images' },
  { id: 'product-detail', label: 'Product Detail' },
  { id: 'inventory', label: 'Inventory' },
];

type AdminSidebarProps = {
  section: AdminSection;
  onSectionChange: (section: AdminSection) => void;
};

export function AdminSidebar(props: AdminSidebarProps) {
  const { section, onSectionChange } = props;

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <h2 className="h6 mb-3">Admin Panel</h2>
        <div className="d-grid gap-2">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`btn btn-sm ${
                section === item.id ? 'btn-dark' : 'btn-outline-dark'
              }`}
              onClick={() => onSectionChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
