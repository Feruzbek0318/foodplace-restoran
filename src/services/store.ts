import { applyStockMovement, shiftDifference } from '../utils/calc';
import { StorageAdapter } from './storageAdapter';
import {
  User,
  RestaurantTable,
  Product,
  Order,
  InventoryMovement,
  Expense,
  Shift,
  Customer,
  AuditLog,
  NotificationItem,
  Branch,
  RestaurantSettings,
  OrderStatus,
  PaymentMethod,
  MovementType,
} from '../types';
import {
  INITIAL_BRANCHES,
  INITIAL_USERS,
  INITIAL_PRODUCTS,
  INITIAL_TABLES,
  INITIAL_ORDERS,
  INITIAL_SHIFTS,
  INITIAL_EXPENSES,
  INITIAL_CUSTOMERS,
  INITIAL_INVENTORY_MOVEMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SETTINGS,
  INITIAL_CATEGORIES,
} from '../data/mockData';

// Web Audio API soft sound synthesizer for real-time kitchen bell & notification
export function playNotificationChime(type: 'order' | 'ready' | 'alert' = 'order') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    if (type === 'order') {
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    } else if (type === 'ready') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.2); // G5
    } else {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(349.23, ctx.currentTime + 0.1);
    }

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // ignore audio block before user interaction
  }
}

// LocalStorage Persistence Keys
const STORAGE_PREFIX = 'foodplace_v1_';

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    if (!item) return defaultValue;
    const parsed = JSON.parse(item);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return { ...defaultValue, ...parsed };
    }
    return parsed;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    StorageAdapter.save(key, value).catch(console.error);
  } catch {
    // fallback
  }
}

class Store {
  currentUser: User | null;
  activeBranchId: string;
  branches: Branch[];
  users: User[];
  products: Product[];
  tables: RestaurantTable[];
  orders: Order[];
  shifts: Shift[];
  expenses: Expense[];
  customers: Customer[];
  inventoryMovements: InventoryMovement[];
  auditLogs: AuditLog[];
  notifications: NotificationItem[];
  settings: RestaurantSettings;
  listeners: Array<() => void> = [];

  constructor() {
    const sessionUser = sessionStorage.getItem(STORAGE_PREFIX + 'currentUser');
    this.currentUser = sessionUser ? JSON.parse(sessionUser) : loadFromStorage<User | null>('currentUser', null);
    this.activeBranchId = loadFromStorage<string>('activeBranchId', '');
    this.branches = loadFromStorage<Branch[]>('branches', INITIAL_BRANCHES);
    this.users = loadFromStorage<User[]>('users', INITIAL_USERS);
    this.products = loadFromStorage<Product[]>('products', INITIAL_PRODUCTS);
    this.tables = loadFromStorage<RestaurantTable[]>('tables', INITIAL_TABLES);
    this.orders = loadFromStorage<Order[]>('orders', INITIAL_ORDERS);
    this.shifts = loadFromStorage<Shift[]>('shifts', INITIAL_SHIFTS);
    this.expenses = loadFromStorage<Expense[]>('expenses', INITIAL_EXPENSES);
    this.customers = loadFromStorage<Customer[]>('customers', INITIAL_CUSTOMERS);
    this.inventoryMovements = loadFromStorage<InventoryMovement[]>('movements', INITIAL_INVENTORY_MOVEMENTS);
    this.auditLogs = loadFromStorage<AuditLog[]>('auditLogs', INITIAL_AUDIT_LOGS);
    this.notifications = loadFromStorage<NotificationItem[]>('notifications', INITIAL_NOTIFICATIONS);
    this.settings = loadFromStorage<RestaurantSettings>('settings', INITIAL_SETTINGS);
    // Older builds saved restaurantName / taxRate; the rest of the app reads name / taxRatePercent
    // The saved session is a copy; re-read the user so role/permission/status changes apply.
    if (this.currentUser) {
      const fresh = this.users.find(u => u.id === this.currentUser!.id);
      this.currentUser = fresh && fresh.status !== 'BLOCKED' ? fresh : null;
      if (!this.currentUser) {
        localStorage.removeItem(STORAGE_PREFIX + 'currentUser');
        sessionStorage.removeItem(STORAGE_PREFIX + 'currentUser');
      }
    }
    const legacy = this.settings as RestaurantSettings & { restaurantName?: string; taxRate?: number };
    if (!legacy.name && legacy.restaurantName) legacy.name = legacy.restaurantName;
    if (legacy.taxRatePercent === undefined && legacy.taxRate !== undefined) legacy.taxRatePercent = legacy.taxRate;
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  get isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  get currentShift(): Shift | undefined {
    return this.shifts.find(s => s.status === 'OPEN');
  }

  get shiftsHistory(): Shift[] {
    return this.shifts;
  }

  notify() {
    this.listeners.forEach(l => l());
  }

  // Auth operations
  async login(usernameOrPhone: string, passwordHashOrPlain: string, rememberMe: boolean = true): Promise<{ success: boolean; message?: string }> {
    const user = this.users.find(
      u => (u.username.toLowerCase() === usernameOrPhone.toLowerCase() || u.phone === usernameOrPhone)
    );

    if (!user) {
      this.logAudit('AUTH_FAILED', `Noma'lum foydalanuvchi orqali kirishga urinish: ${usernameOrPhone}`, 'WARNING');
      return { success: false, message: 'Foydalanuvchi topilmadi yoki parol noto‘g‘ri' };
    }

    const isMatch = await this.verifyPassword(user.id, passwordHashOrPlain);
    
    if (!isMatch) {
      this.logAudit('AUTH_FAILED', `Noto'g'ri parol kiritildi: ${user.username}`, 'WARNING');
      return { success: false, message: 'Foydalanuvchi topilmadi yoki parol noto‘g‘ri' };
    }

    if (user.status === 'BLOCKED') {
      this.logAudit('AUTH_BLOCKED', `Bloklangan foydalanuvchi kirishga urindi: ${user.username}`, 'WARNING');
      return { success: false, message: 'Ushbu hisob admin tomonidan bloklangan!' };
    }

    user.lastLogin = new Date().toLocaleString('uz-UZ');
    this.currentUser = user;
    
    if (rememberMe) {
      saveToStorage('currentUser', user);
    } else {
      sessionStorage.setItem(STORAGE_PREFIX + 'currentUser', JSON.stringify(user));
      localStorage.removeItem(STORAGE_PREFIX + 'currentUser');
      import('./storageAdapter').then(({ StorageAdapter }) => {
         StorageAdapter.remove('currentUser').catch(console.error);
      });
    }
    saveToStorage('users', this.users);

    this.logAudit('USER_LOGIN', `${user.fullName} (${user.role}) tizimga kirdi`);
    this.notify();
    return { success: true };
  }

  async changeUserPassword(userId: string, newPassword: string) {
    const user = this.users.find(u => u.id === userId);
    const isSelf = userId === this.currentUser?.id;
    // Own password, or someone else's with the Employees permission (Super Admins only by a Super Admin)
    if (user && !isSelf && (!this.hasPermission('EMPLOYEES') || (user.role === 'SUPER_ADMIN' && this.currentUser?.role !== 'SUPER_ADMIN'))) return;
    if (user) {
      user.password = await this.hashPassword(newPassword);
      user.requirePasswordReset = false;
      saveToStorage('users', this.users);
      
      if (this.currentUser?.id === userId) {
        this.currentUser = user;
        saveToStorage('currentUser', user);
      }
      this.logAudit('USER_UPDATE', `${user.fullName} paroli o'zgartirildi`);
      this.notify();
    }
  }

  // Verifies a plain password against the stored value (PBKDF2, or legacy SHA-256 / plain text).
  // Legacy values are re-hashed with PBKDF2 after a successful check.
  async verifyPassword(userId: string, plain: string): Promise<boolean> {
    const user = this.users.find(u => u.id === userId);
    // '***' is a placeholder while a new hash is being computed
    if (!user?.password || !plain || user.password === '***') return false;
    const stored = user.password;
    if (stored.startsWith('pbkdf2$')) {
      const [, iterations, salt] = stored.split('$');
      return stored === await this.hashPassword(plain, salt, Number(iterations));
    }
    const ok = /^[0-9a-f]{64}$/.test(stored) ? stored === await this.legacySha256(plain) : stored === plain;
    if (ok) {
      user.password = await this.hashPassword(plain);
      saveToStorage('users', this.users);
    }
    return ok;
  }

  switchUser(user: User) {
    this.currentUser = user;
    saveToStorage('currentUser', user);
    this.logAudit('USER_SWITCH', `Foydalanuvchi o‘zgartirildi: ${user.fullName} (${user.role})`);
    this.notify();
  }

  logout() {
    if (this.currentUser) {
      this.logAudit('USER_LOGOUT', `${this.currentUser.fullName} tizimdan chiqdi`);
    }
    this.currentUser = null;
    saveToStorage('currentUser', null);
    // Sessions without "remember me" live in sessionStorage; clear them too
    sessionStorage.removeItem(STORAGE_PREFIX + 'currentUser');
    this.notify();
  }

  // Permissions check
  hasPermission(permissionId: string): boolean {
    const user = this.currentUser;
    if (!user || user.status === 'BLOCKED') return false;
    if (user.role === 'SUPER_ADMIN') return true;
    const perms = user.permissions || [];
    return perms.includes('ALL') || perms.includes(permissionId);
  }


  // Orders & POS
  createOrder(orderData: Partial<Order>): Order {
    // Next number after the highest existing one, so receipt barcodes stay unique even if orders are removed
    const orderNumber = this.orders.reduce((max, o) => Math.max(max, o.orderNumber || Number(o.id.split('-').pop()) || 0), 0) + 1;
    const orderId = `ORD-2026-${String(orderNumber).padStart(6, '0')}`;
    
    const newOrder: Order = {
      id: orderId,
      orderNumber,
      type: orderData.type || 'DINE_IN',
      tableId: orderData.tableId,
      tableName: orderData.tableName,
      customerId: orderData.customerId,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      items: orderData.items || [],
      subtotal: orderData.subtotal || 0,
      discount: orderData.discount || 0,
      tax: orderData.tax || 0,
      total: orderData.total || 0,
      status: 'NEW',
      paymentMethod: orderData.paymentMethod,
      paymentStatus: orderData.paymentStatus || 'PENDING',
      cashierId: this.currentUser?.id || 'usr-3',
      cashierName: this.currentUser?.fullName || 'Kassir',
      branchId: this.activeBranchId,
      createdAt: new Date().toLocaleString('uz-UZ', { hour12: false }),
      updatedAt: new Date().toLocaleString('uz-UZ', { hour12: false }),
      notes: orderData.notes,
      elapsedMinutes: 0,
    };

    this.orders.unshift(newOrder);

    // Update table status if dine-in
    if (newOrder.tableId) {
      const table = this.tables.find(t => t.id === newOrder.tableId);
      if (table) {
        table.status = 'WAITING_ORDER';
        table.currentOrderId = newOrder.id;
        saveToStorage('tables', this.tables);
      }
    }

    // Deduct stock for ordered items
    newOrder.items.forEach(item => {
      const product = this.products.find(p => p.id === item.productId);
      if (product) {
        product.stock = Math.max(0, product.stock - item.quantity);
        if (product.stock <= product.minStock) {
          this.addNotification({
            title: 'Kam qolgan ombor mahsuloti',
            message: `${product.name} miqdori kamaydi: qoldiq ${product.stock} ${product.unit}`,
            type: 'STOCK',
            linkTo: 'inventory',
          });
        }
      }
    });

    // Update active shift sales if payment was made
    if (newOrder.paymentStatus === 'PAID') {
      this.recordShiftSale(newOrder.paymentMethod || 'CASH', newOrder.total);
    }

    // Update customer CRM if phone provided
    if (newOrder.customerPhone) {
      this.recordCustomerOrder(newOrder);
    }

    saveToStorage('orders', this.orders);
    saveToStorage('products', this.products);

    this.logAudit('ORDER_CREATED', `Yangi buyurtma: ${newOrder.id} (${newOrder.tableName || newOrder.type}) Jami: ${newOrder.total.toLocaleString()} UZS`, 'INFO', newOrder.id);
    
    this.addNotification({
      title: 'Yangi buyurtma keldi!',
      message: `${newOrder.tableName || newOrder.type} uchun yangi buyurtma (${newOrder.id})`,
      type: 'ORDER',
      linkTo: 'kitchen',
    });

    if (this.settings.soundAlerts) {
      playNotificationChime('order');
    }

    this.notify();
    return newOrder;
  }

  updateOrderStatus(orderId: string, newStatus: OrderStatus, reason?: string) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;

    const oldStatus = order.status;
    order.status = newStatus;
    order.updatedAt = new Date().toLocaleString('uz-UZ', { hour12: false });

    // Table status update
    if (order.tableId) {
      const table = this.tables.find(t => t.id === order.tableId);
      if (table) {
        if (newStatus === 'COMPLETED' || newStatus === 'CANCELLED') {
          table.status = 'AVAILABLE';
          table.currentOrderId = undefined;
        } else if (newStatus === 'PREPARING' || newStatus === 'READY' || newStatus === 'SERVED') {
          table.status = 'OCCUPIED';
        }
        saveToStorage('tables', this.tables);
      }
    }

    if (newStatus === 'READY') {
      this.addNotification({
        title: 'Buyurtma tayyor!',
        message: `${order.tableName || order.id} oshxonada tayyor bo‘ldi`,
        type: 'KITCHEN',
        linkTo: 'orders',
      });
      if (this.settings.soundAlerts) {
        playNotificationChime('ready');
      }
    }

    saveToStorage('orders', this.orders);

    this.logAudit(
      'ORDER_STATUS_CHANGED',
      `Buyurtma ${order.id} holati o‘zgardi: ${oldStatus} -> ${newStatus}${reason ? ` (Sabab: ${reason})` : ''}`,
      newStatus === 'CANCELLED' ? 'WARNING' : 'INFO',
      order.id
    );

    this.notify();
  }

  payOrder(orderId: string, method: PaymentMethod) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;

    order.paymentMethod = method;
    order.paymentStatus = 'PAID';
    order.status = 'COMPLETED';
    order.updatedAt = new Date().toLocaleString('uz-UZ', { hour12: false });

    if (order.tableId) {
      const table = this.tables.find(t => t.id === order.tableId);
      if (table) {
        table.status = 'AVAILABLE';
        table.currentOrderId = undefined;
        saveToStorage('tables', this.tables);
      }
    }

    this.recordShiftSale(method, order.total);
    saveToStorage('orders', this.orders);

    this.logAudit('ORDER_PAID', `Buyurtma ${order.id} to‘landi: ${order.total.toLocaleString()} UZS (${method})`, 'INFO', order.id);
    this.notify();
  }

  // Shifts
  getActiveShift(): Shift | undefined {
    return this.shifts.find(s => s.status === 'OPEN' && s.branchId === this.activeBranchId);
  }

  openShift(openingCash: number, notes?: string): Shift {
    const newShift: Shift = {
      id: `shf-${Date.now()}`,
      cashierId: this.currentUser?.id || 'usr-3',
      cashierName: this.currentUser?.fullName || 'Kassir',
      branchId: this.activeBranchId,
      openedAt: new Date().toLocaleString('uz-UZ', { hour12: false }),
      openingCash,
      cashSales: 0,
      cardSales: 0,
      clickSales: 0,
      paymeSales: 0,
      uzumSales: 0,
      refunds: 0,
      expenses: 0,
      expectedCash: openingCash,
      status: 'OPEN',
      notes,
    };

    this.shifts.unshift(newShift);
    saveToStorage('shifts', this.shifts);
    this.logAudit('SHIFT_OPENED', `Smena ochildi: ${newShift.cashierName}, Boshlang‘ich kassa: ${openingCash.toLocaleString()} UZS`);
    this.notify();
    return newShift;
  }

  closeShift(shiftIdOrActualCash: string | number, actualCashOrNotes?: number | string, notesArg?: string) {
    let shift: Shift | undefined;
    let actualCash = 0;
    let notes: string | undefined;

    if (typeof shiftIdOrActualCash === 'number') {
      shift = this.getActiveShift();
      actualCash = shiftIdOrActualCash;
      notes = typeof actualCashOrNotes === 'string' ? actualCashOrNotes : undefined;
    } else {
      shift = this.shifts.find(s => s.id === shiftIdOrActualCash);
      actualCash = typeof actualCashOrNotes === 'number' ? actualCashOrNotes : 0;
      notes = notesArg;
    }

    if (!shift) return;

    shift.closedAt = new Date().toLocaleString('uz-UZ', { hour12: false });
    shift.status = 'CLOSED';
    shift.actualCash = actualCash;
    shift.difference = shiftDifference(actualCash, shift.expectedCash);
    if (notes) shift.notes = notes;

    saveToStorage('shifts', this.shifts);
    this.logAudit(
      'SHIFT_CLOSED',
      `Smena yopildi. Kutilgan: ${shift.expectedCash.toLocaleString()} UZS, Sanalgan: ${actualCash.toLocaleString()} UZS (Farq: ${shift.difference.toLocaleString()} UZS)`,
      Math.abs(shift.difference) > 10000 ? 'WARNING' : 'INFO'
    );
    if (this.settings.shiftReportAlerts !== false) {
      this.addNotification({
        title: 'Smena yopildi (Z-hisobot)',
        message: `Kutilgan: ${shift.expectedCash.toLocaleString()} UZS, sanalgan: ${actualCash.toLocaleString()} UZS, farq: ${shift.difference.toLocaleString()} UZS`,
        type: Math.abs(shift.difference) > 10000 ? 'WARNING' : 'INFO',
        linkTo: 'shifts',
      });
    }
    this.notify();
  }


  private recordShiftSale(method: PaymentMethod, amount: number) {
    const shift = this.getActiveShift();
    if (!shift) return;

    if (method === 'CASH') {
      shift.cashSales += amount;
      shift.expectedCash += amount;
    } else if (method === 'CARD') {
      shift.cardSales += amount;
    } else if (method === 'CLICK') {
      shift.clickSales += amount;
    } else if (method === 'PAYME') {
      shift.paymeSales += amount;
    } else if (method === 'UZUM') {
      shift.uzumSales += amount;
    }
    saveToStorage('shifts', this.shifts);
  }

  // Inventory movements
  addInventoryMovement(movement: {
    productId: string;
    type: MovementType;
    quantity: number;
    reason: string;
  }) {
    const product = this.products.find(p => p.id === movement.productId);
    if (!product) return;

    product.stock = applyStockMovement(product.stock, movement.type, movement.quantity);

    const newMov: InventoryMovement = {
      id: `mov-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      type: movement.type,
      quantity: movement.quantity,
      unit: product.unit,
      reason: movement.reason,
      createdBy: this.currentUser?.fullName || 'Omborchi',
      createdAt: new Date().toLocaleString('uz-UZ', { hour12: false }),
    };

    this.inventoryMovements.unshift(newMov);
    saveToStorage('movements', this.inventoryMovements);
    saveToStorage('products', this.products);

    this.logAudit(
      'INVENTORY_UPDATE',
      `Ombor harakati: ${product.name} (${movement.type}, ${movement.quantity} ${product.unit})${movement.reason ? `. Sabab: ${movement.reason}` : ''}`
    );
    this.notify();
  }

  // Products CRUD
  addProduct(productData: Omit<Product, 'id'>) {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
    };
    this.products.unshift(newProduct);
    saveToStorage('products', this.products);
    this.logAudit('PRODUCT_ADDED', `Yangi mahsulot qo‘shildi: ${newProduct.name} (${(newProduct.salePrice || newProduct.price).toLocaleString()} UZS)`);
    this.notify();
  }

  updateProduct(id: string, updates: Partial<Product>) {
    const product = this.products.find(p => p.id === id);
    if (!product) return;

    const oldPrice = product.price ?? 0;
    Object.assign(product, updates);
    saveToStorage('products', this.products);

    if (updates.price !== undefined && updates.price !== oldPrice) {
      this.logAudit('PRICE_CHANGED', `${product.name} narxi o‘zgartirildi: ${oldPrice.toLocaleString()} -> ${updates.price.toLocaleString()} UZS`);
    } else {
      this.logAudit('PRODUCT_UPDATED', `${product.name} ma'lumotlari tahrirlandi`);
    }
    this.notify();
  }

  deleteProduct(id: string) {
    const product = this.products.find(p => p.id === id);
    if (!product) return;
    this.products = this.products.filter(p => p.id !== id);
    saveToStorage('products', this.products);
    this.logAudit('PRODUCT_DELETED', `Mahsulot o‘chirildi: ${product.name}`, 'WARNING');
    this.notify();
  }

  // Expenses
  addExpense(expenseData: Omit<Expense, 'id' | 'createdBy' | 'branchId'>) {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      createdBy: this.currentUser?.fullName || 'Buxgalter',
      branchId: this.activeBranchId,
    };
    this.expenses.unshift(newExpense);

    // Deduct from current shift if cash expense
    const shift = this.getActiveShift();
    if (shift) {
      shift.expenses += newExpense.amount;
      shift.expectedCash = Math.max(0, shift.expectedCash - newExpense.amount);
      saveToStorage('shifts', this.shifts);
    }

    saveToStorage('expenses', this.expenses);
    this.logAudit('EXPENSE_ADDED', `Xarajat kiritildi: ${newExpense.categoryLabel} - ${newExpense.amount.toLocaleString()} UZS (${newExpense.description})`);
    this.notify();
  }

  // Users & Roles Management
  // Returns an error message when the deletion is not allowed
  deleteUser(id: string): string | null {
    const target = this.users.find(u => u.id === id);
    if (!target) return null;
    if (!this.hasPermission('EMPLOYEES')) return 'Bu bo‘limga kirish huquqingiz yo‘q';
    if (target.id === this.currentUser?.id) return 'O‘zingizni o‘chira olmaysiz';
    if (target.role === 'SUPER_ADMIN' && this.currentUser?.role !== 'SUPER_ADMIN') return 'Super Adminni faqat Super Admin o‘chira oladi';
    if (target.role === 'SUPER_ADMIN' && this.users.filter(u => u.role === 'SUPER_ADMIN').length <= 1) {
      return 'Oxirgi Super Adminni o‘chirib bo‘lmaydi';
    }
    this.users = this.users.filter(u => u.id !== id);
    saveToStorage('users', this.users);
    this.logAudit('USER_DELETED', `Xodim o'chirildi: ${target.fullName}`, 'WARNING');
    this.notify();
    return null;
  }


  // PBKDF2-SHA256 with a random salt, stored as "pbkdf2$<iterations>$<saltHex>$<hashHex>"
  async hashPassword(password: string, saltHex?: string, iterations = 100000): Promise<string> {
    const toHex = (buf: ArrayBuffer | Uint8Array) =>
      Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    const salt = saltHex
      ? new Uint8Array(saltHex.match(/../g)!.map(h => parseInt(h, 16)))
      : crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
    return `pbkdf2$${iterations}$${toHex(salt)}$${toHex(bits)}`;
  }

  // Unsalted SHA-256 used by older builds; kept only to verify and upgrade existing passwords
  private async legacySha256(password: string): Promise<string> {
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  addUser(userData: Omit<User, 'id' | 'createdAt' | 'lastLogin'>) {
    // Only a Super Admin can create another Super Admin (the very first owner is created during setup)
    const hasOwner = this.users.some(u => u.role === 'SUPER_ADMIN');
    if (hasOwner && !this.hasPermission('EMPLOYEES')) return;
    if (userData.role === 'SUPER_ADMIN' && hasOwner && this.currentUser?.role !== 'SUPER_ADMIN') return;
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toLocaleDateString('uz-UZ'),
      lastLogin: '-',
    };
    if (newUser.password) {
      this.hashPassword(newUser.password).then(hash => {
        newUser.password = hash;
        saveToStorage('users', this.users);
      });
      newUser.password = '***'; // temp while hashing
    }
    this.users.unshift(newUser);
    saveToStorage('users', this.users);
    this.logAudit('USER_CREATED', `Yangi xodim yaratildi: ${newUser.fullName} (${newUser.role})`);
    this.notify();
  }

  updateUser(userId: string, updates: Partial<User>) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;
    const actorIsSuper = this.currentUser?.role === 'SUPER_ADMIN';
    const isSelf = userId === this.currentUser?.id;
    // Editing other people requires the Employees permission; anyone may edit their own profile
    if (!isSelf && !this.hasPermission('EMPLOYEES')) return;
    if (!actorIsSuper && (user.role === 'SUPER_ADMIN' || updates.role === 'SUPER_ADMIN')) return;
    if (isSelf) {
      // Nobody can change their own role, permissions or status
      delete updates.role;
      delete updates.permissions;
      delete updates.status;
    }
    
    if (updates.password && updates.password !== '***' && !updates.password.startsWith('pbkdf2$')) {
      this.hashPassword(updates.password).then(hash => {
        user.password = hash;
        saveToStorage('users', this.users);
      });
      updates.password = '***';
    }
    
    Object.assign(user, updates);
    saveToStorage('users', this.users);
    if (this.currentUser?.id === userId) {
      this.currentUser = { ...this.currentUser, ...updates, password: user.password };
      saveToStorage('currentUser', this.currentUser);
    }
    this.logAudit('USER_UPDATED', `${user.fullName} ma'lumotlari yangilandi`);
    this.notify();
  }

  addCustomer(customerData: Partial<Customer>) {
    const newCustomer: Customer = {
      id: `cst-${Date.now()}`,
      fullName: customerData.fullName || customerData.name || 'Mijoz',
      name: customerData.name || customerData.fullName || 'Mijoz',
      phone: customerData.phone || '+998 90 000 00 00',
      totalOrders: customerData.totalOrders || customerData.ordersCount || 0,
      ordersCount: customerData.ordersCount || customerData.totalOrders || 0,
      totalSpent: customerData.totalSpent || 0,
      discountPercent: customerData.discountPercent || 0,
      createdAt: customerData.createdAt || new Date().toISOString().split('T')[0],
      favoriteProductNames: customerData.favoriteProductNames || [],
    };
    this.customers.unshift(newCustomer);
    saveToStorage('customers', this.customers);
    this.logAudit('CUSTOMER_ADDED', `Yangi mijoz qo‘shildi: ${newCustomer.fullName}`);
    this.notify();
  }

  deleteCustomer(id: string) {
    const idx = this.customers.findIndex(c => c.id === id);
    if (idx !== -1) {
      const deleted = this.customers[idx];
      this.customers.splice(idx, 1);
      saveToStorage('customers', this.customers);
      this.logAudit('CUSTOMER_DELETED', `Mijoz o'chirildi: ${deleted.fullName || deleted.name}`);
      this.notify();
    }
  }

  adjustStock(productId: string, newStock: number, reason = 'Inventarizatsiya') {
    this.addInventoryMovement({
      productId,
      type: 'ADJUSTMENT',
      quantity: newStock,
      reason,
    });
  }


  toggleUserStatus(userId: string): string | null {
    const user = this.users.find(u => u.id === userId);
    if (!user) return null;
    if (!this.hasPermission('EMPLOYEES')) return 'Bu bo‘limga kirish huquqingiz yo‘q';
    if (user.id === this.currentUser?.id) return 'O‘zingizni bloklay olmaysiz';
    if (user.role === 'SUPER_ADMIN' && this.currentUser?.role !== 'SUPER_ADMIN') return 'Super Adminni faqat Super Admin o‘zgartira oladi';
    const newStatus = user.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
    user.status = newStatus;
    saveToStorage('users', this.users);
    this.logAudit('USER_STATUS_CHANGED', `${user.fullName} holati o‘zgardi: ${newStatus}`, newStatus === 'BLOCKED' ? 'WARNING' : 'INFO');
    this.notify();
    return null;
  }


  updateUserPermissions(userId: string, permissions: string[]) {
    const user = this.users.find(u => u.id === userId);
    if (!user || userId === this.currentUser?.id || !this.hasPermission('EMPLOYEES')) return;
    if (user.role === 'SUPER_ADMIN' && this.currentUser?.role !== 'SUPER_ADMIN') return;
    user.permissions = permissions;
    saveToStorage('users', this.users);
    this.logAudit('PERMISSIONS_UPDATED', `${user.fullName} uchun ruxsatlar yangilandi`);
    this.notify();
  }

  // Tables
  saveTables(tables: RestaurantTable[]) {
    this.tables = tables.map(t => ({ ...t }));
    saveToStorage('tables', this.tables);
    this.logAudit('TABLES_UPDATED', `Stollar xaritasi saqlandi: ${this.tables.length} ta stol`);
    this.notify();
  }

  updateTableStatus(tableId: string, status: RestaurantTable['status'], currentOrderId?: string) {
    const table = this.tables.find(t => t.id === tableId);
    if (!table) return;
    table.status = status;
    table.currentOrderId = currentOrderId;
    saveToStorage('tables', this.tables);
    this.notify();
  }

  reserveTable(tableId: string, reservation: NonNullable<RestaurantTable['reservedFor']>) {
    const table = this.tables.find(t => t.id === tableId);
    if (!table) return;
    table.status = 'RESERVED';
    table.reservedFor = reservation;
    saveToStorage('tables', this.tables);
    this.logAudit('TABLE_RESERVED', `${table.name} band qilindi: ${reservation.customerName} (${reservation.time})`);
    this.notify();
  }

  // Customers CRM
  private recordCustomerOrder(order: Order) {
    let customer = this.customers.find(c => c.phone === order.customerPhone);
    if (!customer) {
      customer = {
        id: `cst-${Date.now()}`,
        fullName: order.customerName || 'Mijoz',
        phone: order.customerPhone!,
        totalOrders: 1,
        totalSpent: order.total,
        lastOrderDate: new Date().toLocaleDateString('uz-UZ'),
        favoriteProductNames: order.items.map(i => i.productName).slice(0, 2),
      };
      this.customers.push(customer);
    } else {
      const currentOrders = customer.totalOrders || customer.ordersCount || 0;
      customer.totalOrders = currentOrders + 1;
      customer.ordersCount = currentOrders + 1;
      customer.totalSpent = (customer.totalSpent || 0) + order.total;
      customer.lastOrderDate = new Date().toLocaleDateString('uz-UZ');
    }

    saveToStorage('customers', this.customers);
  }

  // Audit Logs
  logAudit(action: string, details: string, severity: AuditLog['severity'] = 'INFO', targetId?: string) {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleString('uz-UZ', { hour12: false }),
      userId: this.currentUser?.id || 'sys',
      userName: this.currentUser?.username || 'system',
      userRole: this.currentUser?.role || 'SUPER_ADMIN',
      action,
      details,
      targetId,
      severity,
    };
    this.auditLogs.unshift(newLog);
    if (this.auditLogs.length > 300) {
      this.auditLogs = this.auditLogs.slice(0, 300);
    }
    saveToStorage('auditLogs', this.auditLogs);
  }

  // Notifications
  addNotification(notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) {
    const newNotif: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: 'Hozirgina',
      read: false,
    };
    this.notifications.unshift(newNotif);
    saveToStorage('notifications', this.notifications);
    this.notify();
  }

  markAllNotificationsRead() {
    this.notifications.forEach(n => (n.read = true));
    saveToStorage('notifications', this.notifications);
    this.notify();
  }

  // Settings
  updateSettings(newSettings: Partial<RestaurantSettings>) {
    Object.assign(this.settings, newSettings);
    saveToStorage('settings', this.settings);
    this.logAudit('SETTINGS_UPDATED', `Restoran tizim sozlamalari yangilandi`);
    this.notify();
  }

  addBranch(branchData: Omit<Branch, 'id'> & Record<string, unknown>): Branch {
    const newBranch: Branch = {
      ...branchData,
      id: `branch-${Date.now()}`,
    };
    this.branches = [...this.branches, newBranch];
    saveToStorage('branches', this.branches);
    if (!this.activeBranchId) {
      this.activeBranchId = newBranch.id;
      saveToStorage('activeBranchId', newBranch.id);
    }
    this.logAudit('BRANCH_CREATED', `Yangi filial qo'shildi: ${newBranch.name}`);
    this.notify();
    return newBranch;
  }

  updateBranch(id: string, updates: Partial<Branch>) {
    const branch = this.branches.find(b => b.id === id);
    if (!branch) return;
    Object.assign(branch, updates, { id });
    saveToStorage('branches', this.branches);
    this.logAudit('BRANCH_UPDATED', `Filial tahrirlandi: ${branch.name}`);
    this.notify();
  }

  deleteBranch(id: string) {
    this.branches = this.branches.filter(b => b.id !== id);
    saveToStorage('branches', this.branches);
    if (this.activeBranchId === id) {
      this.activeBranchId = this.branches[0]?.id || '';
      saveToStorage('activeBranchId', this.activeBranchId);
    }
    this.logAudit('BRANCH_DELETED', `Filial o'chirildi: ${id}`, 'WARNING');
    this.notify();
  }

  setBranch(branchId: string) {
    this.activeBranchId = branchId;
    saveToStorage('activeBranchId', branchId);
    this.notify();
  }

  // Full wipe: localStorage, session and the IndexedDB stores
  factoryReset() {
    this.resetAllDemoData();
    sessionStorage.clear();
    try {
      indexedDB.databases?.().then(dbs => dbs.forEach(db => db.name && indexedDB.deleteDatabase(db.name)));
    } catch {
      // ignore
    }
  }

  // Reset demo state
  resetAllDemoData() {
    localStorage.clear();
    this.currentUser = null;
    this.activeBranchId = 'branch-1';
    this.branches = INITIAL_BRANCHES;
    this.users = INITIAL_USERS;
    this.products = INITIAL_PRODUCTS;
    this.tables = INITIAL_TABLES;
    this.orders = INITIAL_ORDERS;
    this.shifts = INITIAL_SHIFTS;
    this.expenses = INITIAL_EXPENSES;
    this.customers = INITIAL_CUSTOMERS;
    this.inventoryMovements = INITIAL_INVENTORY_MOVEMENTS;
    this.auditLogs = INITIAL_AUDIT_LOGS;
    this.notifications = INITIAL_NOTIFICATIONS;
    this.settings = INITIAL_SETTINGS;
    this.notify();
  }
}

export const store = new Store();
