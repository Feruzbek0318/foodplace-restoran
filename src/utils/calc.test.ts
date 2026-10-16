import { describe, expect, it } from 'vitest';
import {
  applyStockMovement,
  calcOrderTotals,
  changeDue,
  expectedShiftCash,
  getPeriodStart,
  getPrevStart,
  growthPct,
  isRevenueOrder,
  parseDate,
  shiftDifference,
  stockState,
  summarizePeriod,
} from './calc';

const items = (...subtotals: number[]) => subtotals.map(subtotal => ({ subtotal }));

describe('calcOrderTotals', () => {
  it('sums items with no discount or tax', () => {
    expect(calcOrderTotals(items(45000, 12000))).toEqual({ subtotal: 57000, discount: 0, tax: 0, total: 57000 });
  });

  it('adds tax on the subtotal', () => {
    expect(calcOrderTotals(items(45000), 0, 10)).toEqual({ subtotal: 45000, discount: 0, tax: 4500, total: 49500 });
  });

  it('applies the discount before tax', () => {
    // 100 000 − 10% = 90 000; 12% VAT on 90 000 = 10 800
    expect(calcOrderTotals(items(60000, 40000), 10, 12)).toEqual({
      subtotal: 100000,
      discount: 10000,
      tax: 10800,
      total: 100800,
    });
  });

  it('rounds discount and tax to whole sums', () => {
    // 15% of 33 333 = 4 999.95 → 5 000; 10% of 28 333 = 2 833.3 → 2 833
    expect(calcOrderTotals(items(33333), 15, 10)).toEqual({ subtotal: 33333, discount: 5000, tax: 2833, total: 31166 });
  });

  it('returns zeros for an empty cart', () => {
    expect(calcOrderTotals([], 15, 12)).toEqual({ subtotal: 0, discount: 0, tax: 0, total: 0 });
  });

  it('clamps out-of-range percentages', () => {
    expect(calcOrderTotals(items(10000), 150, -5)).toEqual({ subtotal: 10000, discount: 10000, tax: 0, total: 0 });
  });
});

describe('changeDue', () => {
  it('returns the change for overpayment', () => {
    expect(changeDue(100000, 49500)).toBe(50500);
  });

  it('never goes negative when the customer underpays', () => {
    expect(changeDue(40000, 49500)).toBe(0);
  });
});

describe('applyStockMovement', () => {
  it('adds stock on IN', () => {
    expect(applyStockMovement(48, 'IN', 20)).toBe(68);
  });

  it('subtracts on OUT and WASTE', () => {
    expect(applyStockMovement(68, 'OUT', 5)).toBe(63);
    expect(applyStockMovement(68, 'WASTE', 20)).toBe(48);
  });

  it('does not go below zero', () => {
    expect(applyStockMovement(3, 'WASTE', 10)).toBe(0);
  });

  it('sets the counted amount on ADJUSTMENT', () => {
    expect(applyStockMovement(48, 'ADJUSTMENT', 45)).toBe(45);
  });
});

describe('stockState', () => {
  it('is out when nothing is left', () => {
    expect(stockState(0, 10)).toBe('out');
  });

  it('is low at or below the minimum', () => {
    expect(stockState(48, 50)).toBe('low');
    expect(stockState(50, 50)).toBe('low');
  });

  it('is ok above the minimum or when no minimum is set', () => {
    expect(stockState(51, 50)).toBe('ok');
    expect(stockState(1, 0)).toBe('ok');
  });
});

describe('shift cash', () => {
  it('expects opening float plus cash sales minus cash expenses', () => {
    expect(expectedShiftCash(500000, 49500)).toBe(549500);
    expect(expectedShiftCash(500000, 49500, 20000)).toBe(529500);
  });

  it('reports shortage as negative and surplus as positive', () => {
    expect(shiftDifference(540000, 549500)).toBe(-9500);
    expect(shiftDifference(550000, 549500)).toBe(500);
    expect(shiftDifference(549500, 549500)).toBe(0);
  });
});

describe('reports', () => {
  it('counts only paid or completed, non-cancelled orders as revenue', () => {
    expect(isRevenueOrder({ status: 'NEW', paymentStatus: 'PAID' })).toBe(true);
    expect(isRevenueOrder({ status: 'COMPLETED', paymentStatus: 'PENDING' })).toBe(true);
    expect(isRevenueOrder({ status: 'NEW', paymentStatus: 'PENDING' })).toBe(false);
    expect(isRevenueOrder({ status: 'CANCELLED', paymentStatus: 'PAID' })).toBe(false);
  });

  it('computes net profit as revenue − cost of goods − expenses', () => {
    const cost: Record<string, number> = { osh: 20000, choy: 1000 };
    const summary = summarizePeriod(
      [
        { total: 99000, items: [{ productId: 'osh', quantity: 2 }] },
        { total: 49500, items: [{ productId: 'osh', quantity: 1 }, { productId: 'choy', quantity: 3 }] },
      ],
      [{ amount: 30000 }],
      id => cost[id] || 0,
    );
    expect(summary).toEqual({
      revenue: 148500,
      cogs: 63000,
      expenseTotal: 30000,
      count: 2,
      avgCheck: 74250,
      profit: 55500,
    });
  });

  it('handles an empty period', () => {
    expect(summarizePeriod([], [], () => 0)).toEqual({ revenue: 0, cogs: 0, expenseTotal: 0, count: 0, avgCheck: 0, profit: 0 });
  });

  it('returns null growth when the previous period is empty', () => {
    expect(growthPct(1000, 0)).toBeNull();
    expect(growthPct(1500, 1000)).toBe(50);
    expect(growthPct(500, 1000)).toBe(-50);
  });
});

describe('parseDate', () => {
  it('reads the store format', () => {
    expect(parseDate('2026-10-15 11:14:07')).toEqual(new Date(2026, 9, 15, 11, 14, 7));
  });

  it('reads day-first locale dates', () => {
    expect(parseDate('15.10.2026 14:30')).toEqual(new Date(2026, 9, 15, 14, 30, 0));
    expect(parseDate('15/10/2026, 14:30:00')).toEqual(new Date(2026, 9, 15, 14, 30, 0));
  });

  it('returns null for empty or invalid input', () => {
    expect(parseDate('')).toBeNull();
    expect(parseDate('not a date')).toBeNull();
  });
});

describe('period boundaries', () => {
  // Thursday 15 October 2026
  const now = new Date(2026, 9, 15, 13, 0, 0);

  it('starts today at midnight', () => {
    expect(getPeriodStart('TODAY', now)).toEqual(new Date(2026, 9, 15));
  });

  it('starts the week on Monday', () => {
    expect(getPeriodStart('WEEK', now)).toEqual(new Date(2026, 9, 12));
  });

  it('starts the month and year on the first day', () => {
    expect(getPeriodStart('MONTH', now)).toEqual(new Date(2026, 9, 1));
    expect(getPeriodStart('YEAR', now)).toEqual(new Date(2026, 0, 1));
  });

  it('steps back one period for comparison', () => {
    expect(getPrevStart('TODAY', new Date(2026, 9, 15))).toEqual(new Date(2026, 9, 14));
    expect(getPrevStart('WEEK', new Date(2026, 9, 12))).toEqual(new Date(2026, 9, 5));
    expect(getPrevStart('MONTH', new Date(2026, 0, 1))).toEqual(new Date(2025, 11, 1));
    expect(getPrevStart('YEAR', new Date(2026, 0, 1))).toEqual(new Date(2025, 0, 1));
  });
});
