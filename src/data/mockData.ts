import { Branch, User, Product, RestaurantTable, Order, Shift, Expense, Customer, InventoryMovement, AuditLog, NotificationItem, RestaurantSettings } from '../types';

export const INITIAL_BRANCHES: Branch[] = [];
export const INITIAL_USERS: User[] = [];
export const INITIAL_PRODUCTS: Product[] = [];
export const INITIAL_TABLES: RestaurantTable[] = [];
export const INITIAL_ORDERS: Order[] = [];
export const INITIAL_SHIFTS: Shift[] = [];
export const INITIAL_EXPENSES: Expense[] = [];
export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_INVENTORY_MOVEMENTS: InventoryMovement[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const INITIAL_SETTINGS: RestaurantSettings = {
  name: '',
  logoUrl: '',
  address: '',
  phone: '',
  receiptHeader: '',
  receiptFooter: 'Xaridingiz uchun rahmat!',
  wifiName: '',
  wifiPassword: '',
  currency: 'UZS',
  language: 'uz',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Tashkent',
  taxRatePercent: 0,
  theme: 'system',
  soundAlerts: true,
  shiftReportAlerts: true,
  smsAlerts: false
};

export const INITIAL_CATEGORIES = [
  { id: 'cat-all', name: 'Barchasi', icon: 'LayoutGrid', order: 1 },
  { id: 'cat-fastfood', name: 'Fast Food', icon: 'Pizza', order: 2 },
  { id: 'cat-national', name: 'Milliy Taomlar', icon: 'UtensilsCrossed', order: 3 },
  { id: 'cat-drinks', name: 'Ichimliklar', icon: 'Coffee', order: 4 },
  { id: 'cat-desserts', name: 'Shirinliklar', icon: 'IceCream', order: 5 },
  { id: 'cat-salads', name: 'Salatlar', icon: 'Leaf', order: 6 },
];
