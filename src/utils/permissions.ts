import { store } from '../services/store';
import { User, UserRole } from '../types';

// Single source of truth for access control: the IDs stored in user.permissions,
// the views they unlock, and the defaults each role starts with.
export const PERMISSIONS = [
  { id: 'DASHBOARD', label: 'Dashboard' },
  { id: 'POS', label: 'Kassa (POS)' },
  { id: 'ORDERS', label: 'Buyurtmalar' },
  { id: 'TABLES', label: 'Stollar' },
  { id: 'KITCHEN', label: 'Oshxona (KDS)' },
  { id: 'PRODUCTS', label: 'Mahsulotlar' },
  { id: 'INVENTORY', label: 'Omborxona' },
  { id: 'EXPENSES', label: 'Xarajatlar' },
  { id: 'FINANCE', label: 'Moliya' },
  { id: 'CUSTOMERS', label: 'Mijozlar' },
  { id: 'EMPLOYEES', label: 'Xodimlar' },
  { id: 'SHIFTS', label: 'Smenalar' },
  { id: 'AUDIT', label: 'Tizim Jurnali' },
  { id: 'SETTINGS', label: 'Sozlamalar' },
] as const;

export type PermissionId = (typeof PERMISSIONS)[number]['id'];

export const DEFAULT_PERMISSIONS: Partial<Record<UserRole, PermissionId[]>> = {
  ADMIN: PERMISSIONS.map(p => p.id),
  MANAGER: ['DASHBOARD', 'POS', 'ORDERS', 'TABLES', 'KITCHEN', 'PRODUCTS', 'INVENTORY', 'EXPENSES', 'FINANCE', 'CUSTOMERS', 'SHIFTS'],
  CASHIER: ['POS', 'ORDERS', 'TABLES', 'CUSTOMERS', 'SHIFTS'],
  WAITER: ['TABLES', 'ORDERS', 'CUSTOMERS'],
  KITCHEN: ['KITCHEN'],
};

const VIEW_PERMISSION: Record<string, PermissionId> = {
  dashboard: 'DASHBOARD',
  pos: 'POS',
  orders: 'ORDERS',
  tables: 'TABLES',
  kitchen: 'KITCHEN',
  products: 'PRODUCTS',
  inventory: 'INVENTORY',
  expenses: 'EXPENSES',
  finance: 'FINANCE',
  reports: 'FINANCE',
  customers: 'CUSTOMERS',
  employees: 'EMPLOYEES',
  branches: 'SETTINGS',
  shifts: 'SHIFTS',
  audit: 'AUDIT',
  settings: 'SETTINGS',
};

// Order used to pick a landing page after login
const VIEW_ORDER = ['dashboard', 'pos', 'kitchen', 'orders', 'tables', 'products', 'inventory', 'expenses', 'finance', 'customers', 'employees', 'shifts', 'audit', 'settings'];

export const userHasPermission = (user: User | null | undefined, permissionId: string): boolean => {
  if (!user || user.status === 'BLOCKED') return false;
  if (user.role === 'SUPER_ADMIN') return true;
  const perms = user.permissions || [];
  return perms.includes('ALL') || perms.includes(permissionId);
};

export const hasPermission = (permissionId: string): boolean => userHasPermission(store.currentUser, permissionId);

export const checkViewPermission = (viewId: string): boolean => {
  if (!store.currentUser) return false;
  if (viewId === 'profile') return true; // everyone can see their own profile
  const required = VIEW_PERMISSION[viewId];
  return required ? hasPermission(required) : false;
};

export const firstAllowedView = (): string => VIEW_ORDER.find(checkViewPermission) || 'profile';

// Notifications that point to a section the user cannot open are not shown to them
export const visibleNotifications = () =>
  (store.notifications || []).filter(n => !n.linkTo || checkViewPermission(n.linkTo));
