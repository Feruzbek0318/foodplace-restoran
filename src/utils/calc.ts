// Pure business calculations shared by the UI and the store. Kept free of React and
// storage so they can be unit-tested (see calc.test.ts).

// ---------- POS ----------

export interface OrderTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

/**
 * Order totals as charged at the POS: the discount is taken off the subtotal first,
 * then VAT/service is added on the discounted amount. Amounts are rounded to whole UZS.
 */
export function calcOrderTotals(
  items: Array<{ subtotal: number }>,
  discountPercent = 0,
  taxPercent = 0,
): OrderTotals {
  const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const discount = Math.round((subtotal * clampPercent(discountPercent)) / 100);
  const afterDiscount = Math.max(0, subtotal - discount);
  const tax = Math.round((afterDiscount * clampPercent(taxPercent)) / 100);
  return { subtotal, discount, tax, total: afterDiscount + tax };
}

/** Change to give back for a cash payment; never negative. */
export const changeDue = (cashGiven: number, total: number) => Math.max(0, cashGiven - total);

const clampPercent = (p: number) => Math.min(100, Math.max(0, Number(p) || 0));

// ---------- Inventory ----------

export type StockMovementType = 'IN' | 'OUT' | 'WASTE' | 'ADJUSTMENT';

/** Stock after a movement: IN adds, OUT/WASTE subtract (not below 0), ADJUSTMENT sets the counted amount. */
export function applyStockMovement(stock: number, type: StockMovementType, quantity: number): number {
  if (type === 'IN') return stock + quantity;
  if (type === 'ADJUSTMENT') return quantity;
  return Math.max(0, stock - quantity);
}

export type StockState = 'ok' | 'low' | 'out';

/** "low" when at or below the minimum (a minimum of 0 means no alert), "out" when nothing is left. */
export const stockState = (stock: number, minStock = 0): StockState =>
  stock <= 0 ? 'out' : minStock > 0 && stock <= minStock ? 'low' : 'ok';

// ---------- Shifts ----------

/** Cash the drawer should hold: opening float + cash sales − cash expenses. */
export const expectedShiftCash = (openingCash: number, cashSales: number, cashExpenses = 0) =>
  openingCash + cashSales - cashExpenses;

/** Counted minus expected: negative is a shortage, positive a surplus. */
export const shiftDifference = (actualCash: number, expectedCash: number) => actualCash - expectedCash;

// ---------- Reports ----------

export type DatePreset = 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR';

/**
 * The store writes dates as "YYYY-MM-DD HH:MM:SS", ISO, or the uz-UZ locale string
 * ("15/10/2026, 14:30:00" / "15.10.2026 14:30").
 */
export function parseDate(value?: string): Date | null {
  if (!value) return null;
  const ymd = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (ymd) {
    const [, y, m, d, h = '0', mi = '0', sec = '0'] = ymd;
    return new Date(+y, +m - 1, +d, +h, +mi, +sec);
  }
  const dmy = value.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})(?:[ ,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (dmy) {
    const [, a, b, y, h = '0', mi = '0', sec = '0'] = dmy;
    // uz-UZ puts the day first; if the second part is above 12 it must be MM/DD
    let day = +a;
    let month = +b;
    if (month > 12 && day <= 12) [day, month] = [month, day];
    return new Date(+y, month - 1, day, +h, +mi, +sec);
  }
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : new Date(t);
}

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export function getPeriodStart(preset: DatePreset, now: Date): Date {
  const today = startOfDay(now);
  if (preset === 'TODAY') return today;
  if (preset === 'WEEK') {
    const dow = (today.getDay() + 6) % 7; // Monday = 0
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() - dow);
  }
  if (preset === 'MONTH') return new Date(now.getFullYear(), now.getMonth(), 1);
  return new Date(now.getFullYear(), 0, 1);
}

/** Start of the previous period: one unit back, same length. */
export function getPrevStart(preset: DatePreset, start: Date): Date {
  if (preset === 'TODAY') return new Date(start.getFullYear(), start.getMonth(), start.getDate() - 1);
  if (preset === 'WEEK') return new Date(start.getFullYear(), start.getMonth(), start.getDate() - 7);
  if (preset === 'MONTH') return new Date(start.getFullYear(), start.getMonth() - 1, 1);
  return new Date(start.getFullYear() - 1, 0, 1);
}

/** Growth versus the previous period; null when there is nothing to compare against. */
export const growthPct = (cur: number, prev: number): number | null =>
  prev > 0 ? ((cur - prev) / prev) * 100 : null;

/** An order counts as revenue once paid (or completed) and not cancelled. */
export const isRevenueOrder = (o: { status?: string; paymentStatus?: string }) =>
  o.status !== 'CANCELLED' && (o.paymentStatus === 'PAID' || o.status === 'COMPLETED');

/** Cost of goods for an order from product cost prices. */
export const orderCost = (
  order: { items?: Array<{ productId: string; quantity: number }> },
  costOf: (productId: string) => number,
) => (order.items || []).reduce((acc, i) => acc + costOf(i.productId) * (i.quantity || 0), 0);

export interface PeriodSummary {
  revenue: number;
  cogs: number;
  expenseTotal: number;
  count: number;
  avgCheck: number;
  profit: number;
}

/** Revenue, cost of goods, expenses and net profit (revenue − cost − expenses) for a period. */
export function summarizePeriod(
  orders: Array<{ total?: number; items?: Array<{ productId: string; quantity: number }> }>,
  expenses: Array<{ amount?: number }>,
  costOf: (productId: string) => number,
): PeriodSummary {
  const revenue = orders.reduce((a, o) => a + (o.total || 0), 0);
  const cogs = orders.reduce((a, o) => a + orderCost(o, costOf), 0);
  const expenseTotal = expenses.reduce((a, e) => a + (e.amount || 0), 0);
  return {
    revenue,
    cogs,
    expenseTotal,
    count: orders.length,
    avgCheck: orders.length ? revenue / orders.length : 0,
    profit: revenue - cogs - expenseTotal,
  };
}
