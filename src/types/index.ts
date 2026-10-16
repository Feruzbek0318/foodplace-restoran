export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'CASHIER' | 'WAITER' | 'KITCHEN' | 'WAREHOUSE' | 'ACCOUNTANT' | 'OPERATOR';

export interface User {
  id: string;
  username: string;
  fullName: string;
  phone?: string;
  email?: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  branchId: string;
  lastLogin?: string;
  createdAt: string;
  avatarUrl?: string;
  password?: string;
  requirePasswordReset?: boolean;
  permissions?: string[];
}

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'WAITING_ORDER' | 'RESERVED' | 'INACTIVE';
export type TableShape = 'RECTANGLE' | 'ROUND' | 'SQUARE';

export interface RestaurantTable {
  id: string;
  number: number;
  name: string;
  capacity: number;
  zone: 'HALL' | 'VIP' | 'TERRACE';
  status: TableStatus;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  shape?: TableShape;
  currentOrderId?: string;
  reservedFor?: {
    customerName: string;
    phone: string;
    time: string;
  };
}

export interface RestaurantSettings {
  name: string;
  logoUrl: string;
  faviconUrl?: string;
  language?: 'uz' | 'ru' | 'en';
  address: string;
  phone: string;
  email?: string;
  workingHours?: string;
  currency: string;
  timezone: string;
  taxRatePercent: number;
  receiptHeader: string;
  receiptFooter: string;
  wifiName: string;
  wifiPassword: string;
  theme?: 'light' | 'dark' | 'system';
  dateFormat?: string;
  timeFormat?: string;
  soundAlerts?: boolean;
  shiftReportAlerts?: boolean;
  smsAlerts?: boolean;
  setupCompleted?: boolean;
}

export interface AuditLog { severity?: string; targetId?: string; userRole?: string; ipAddress?: string;
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
  module?: string;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'CLICK' | 'PAYME' | 'UZUM' | 'MIXED';
export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
export type OrderStatus = 'NEW' | 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED' | 'PAID' | 'CANCELLED';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber?: number;
  type: OrderType;
  tableId?: string;
  tableName?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentStatus?: 'PENDING' | 'PAID';
  cashierId?: string;
  cashierName?: string;
  branchId?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  cancelReason?: string;
  elapsedMinutes?: number;
}

export interface ProductCategory { id: string; name: string; icon: string; order: number; color?: string; }
export interface Product { salePrice?: number; imageUrl?: string; categoryName?: string; isActive?: boolean; id: string; categoryId: string; name: string; description?: string; price: number; costPrice: number; image: string; barcode?: string; isAvailable: boolean; stock: number; minStock: number; unit: 'dona' | 'kg' | 'litr' | 'portion'; }
export type MovementType = 'IN' | 'OUT' | 'WASTE' | 'ADJUSTMENT';
export interface InventoryMovement { id: string; productId: string; productName: string; type: MovementType; quantity: number; unit: string; reason: string; createdBy: string; createdAt: string; }
export interface Supplier { id: string; name: string; contactName: string; phone: string; email: string; address: string; status: 'ACTIVE' | 'INACTIVE'; }
export interface Expense { createdAt?: string; createdByUserName?: string; createdBy?: string; categoryLabel?: string; branchId?: string; id: string; category: string; amount: number; date: string; description: string; recordedBy?: string; }
export interface Shift {
  id: string;
  cashierId: string;
  cashierName: string;
  branchId: string;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  cashSales: number;
  cardSales: number;
  clickSales: number;
  paymeSales: number;
  uzumSales: number;
  refunds: number;
  expenses: number;
  expectedCash: number;
  actualCash?: number;
  difference?: number;
  status: 'OPEN' | 'CLOSED';
  notes?: string;
}
export interface Customer { lastVisit?: string; loyaltyPoints?: number; name?: string; ordersCount?: number; discountPercent?: number; favoriteProductNames?: string[]; lastOrderDate?: string; createdAt?: string; id: string; phone: string; fullName: string; totalOrders: number; totalSpent: number; }
export interface NotificationItem { id: string; type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'ORDER' | 'KITCHEN' | 'STOCK' | 'SHIFT' | 'SECURITY'; title: string; message: string; timestamp: string; read?: boolean; linkTo?: string; }
export interface Branch { id: string; name: string; address: string; phone: string; managerId?: string; managerName?: string; isActive: boolean; }
