import { AsyncImage } from '../../components/common/AsyncImage';
import { useTranslation } from '../../hooks/useTranslation';
import React from 'react';
import {
  LayoutDashboard,
  Calculator,
  ShoppingBag,
  Grid,
  ChefHat,
  Package,
  Boxes,
  DollarSign,
  TrendingUp,
  Users,
  UserCog,
  Clock,
  ShieldAlert,
  Settings,
  X,
  Sparkles,
} from 'lucide-react';
import { store } from '../../services/store';
import { UserRole } from '../../types';
import { tr } from '../../locales';
import { checkViewPermission } from '../../utils/permissions';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}


interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: UserRole[];
  requiredPermission?: string;
  badge?: string | number;
}

export const Sidebar: React.FC<SidebarProps> = (props) => {
  const { t } = useTranslation();
  const { currentView, onNavigate, isOpenMobile, onCloseMobile } = props;
  const user = store.currentUser;
  const userRole = user?.role || 'CASHIER';
  const userPermissions = user?.permissions || [];

  // Active counts for badges
  const activeOrdersCount = store.orders?.filter(o => o.status === 'PREPARING' || o.status === 'NEW').length;
  const lowStockCount = store.products?.filter(p => p.stock <= p.minStock).length;

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: t('dashboard'),
      icon: LayoutDashboard,
      allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'ACCOUNTANT'],
      requiredPermission: 'dashboard_access',
    },
    {
      id: 'pos',
      label: t('pos'),
      icon: Calculator,
      allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'CASHIER'],
      requiredPermission: 'pos_access',
    },
    {
      id: 'orders',
      label: t('orders'),
      icon: ShoppingBag,
      allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'CASHIER', 'OPERATOR', 'ACCOUNTANT'],
      requiredPermission: 'orders_view',
    },
    {
      id: 'tables',
      label: t('tables'),
      icon: Grid,
      allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'CASHIER', 'OPERATOR'],
    },
    {
      id: 'kitchen',
      label: t('kitchen'),
      icon: ChefHat,
      allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'KITCHEN', 'OPERATOR'],
      requiredPermission: 'kds_access',
      badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
    },
    {
      id: 'products',
      label: t('products'),
      icon: Package,
      allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'CASHIER', 'WAREHOUSE'],
      requiredPermission: 'inventory_access',
    },
    {
      id: 'inventory',
      label: t('inventory'),
      icon: Boxes,
      allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE'],
      requiredPermission: 'inventory_access',
      badge: lowStockCount > 0 ? `${lowStockCount} ${tr('kam')}` : undefined,
    },
    {
      id: 'expenses',
      label: t('expenses'),
      icon: DollarSign,
      allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'],
      requiredPermission: 'finance_access',
    },
    {
      id: 'finance',
      label: t('finance'),
      icon: TrendingUp,
      allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'OPERATOR'],
      requiredPermission: 'finance_access',
    },
    {
      id: 'customers',
      label: t('customers'),
      icon: Users,
      allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'CASHIER'],
    },
    {
      id: 'employees',
      label: t('employees'),
      icon: UserCog,
      allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
      requiredPermission: 'employees_access',
    },
    {
      id: 'shifts',
      label: t('shifts'),
      icon: Clock,
      allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'CASHIER', 'ACCOUNTANT'],
    },
    {
      id: 'audit',
      label: t('audit'),
      icon: ShieldAlert,
      allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
      requiredPermission: 'settings_access',
    },
    {
      id: 'settings',
      label: t('settings'),
      icon: Settings,
      allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
      requiredPermission: 'settings_access',
    },
  ];

  // Only show sections the user actually has permission for (same rule App uses to render them)
  const visibleItems = menuItems.filter(item => checkViewPermission(item.id));

  const handleItemClick = (id: string) => {
    onNavigate(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {store.settings?.logoUrl ? (
              <AsyncImage srcId={store.settings?.logoUrl} className="w-9 h-9 rounded-xl object-cover shadow-md" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                <ChefHat className="w-5 h-5" />
              </div>
            )}
            <div className="truncate">
              <div className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1 truncate">
                <span className="truncate">{store.settings?.name || 'FoodPlace'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-tight truncate">
                {tr("Yaxshi ta'm • Kayfiyat")}
              </div>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Card in footer matching UI design */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.fullName.charAt(0) || 'A'}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {user?.fullName || tr("Foydalanuvchi")}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {user?.email || `${user?.username}@foodplace.uz`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
