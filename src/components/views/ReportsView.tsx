import React, { useEffect, useMemo, useState } from 'react';
import {
  Printer,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { store } from '../../services/store';
import { INITIAL_CATEGORIES } from '../../data/mockData';
import { tr } from '../../locales';
import { DatePreset, getPeriodStart, getPrevStart, growthPct, isRevenueOrder, orderCost, parseDate, startOfDay, summarizePeriod } from '../../utils/calc';

const MONTHS_UZ = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

const fmt = (n: number) => Math.round(n).toLocaleString('ru-RU').replace(/,/g, ' ');

export const ReportsView: React.FC = () => {
  const [datePreset, setDatePreset] = useState<DatePreset>('MONTH');
  const [version, setVersion] = useState(0);

  useEffect(() => store.subscribe(() => setVersion(v => v + 1)), []);

  const branchId = store.activeBranchId;
  const orders = store.orders;
  const expenses = store.expenses;
  const products = store.products;

  const report = useMemo(() => {
    const now = new Date();
    const start = getPeriodStart(datePreset, now);
    const prevStart = getPrevStart(datePreset, start);
    const prevEnd = new Date(prevStart.getTime() + (now.getTime() - start.getTime()));

    const inBranch = (x: { branchId?: string }) => !x.branchId || !branchId || x.branchId === branchId;
    const productMap = new Map(products.map(p => [p.id, p]));
    const categoryName = new Map(INITIAL_CATEGORIES.map(c => [c.id, tr(c.name)]));

    const paidOrders = orders
      .filter(o => inBranch(o as any) && isRevenueOrder(o))
      .map(o => ({ order: o, date: parseDate(o.createdAt) }))
      .filter((x): x is { order: typeof orders[number]; date: Date } => !!x.date);
    const datedExpenses = expenses
      .filter(e => inBranch(e))
      .map(e => ({ expense: e, date: parseDate(e.date) }))
      .filter((x): x is { expense: typeof expenses[number]; date: Date } => !!x.date);

    const costOf = (productId: string) => productMap.get(productId)?.costPrice || 0;

    const summarize = (from: Date, to: Date) => {
      const os = paidOrders.filter(x => x.date >= from && x.date <= to);
      const es = datedExpenses.filter(x => x.date >= from && x.date <= to);
      return { os, es, ...summarizePeriod(os.map(x => x.order), es.map(x => x.expense), costOf) };
    };

    const cur = summarize(start, now);
    const prev = summarize(prevStart, prevEnd);

    // Trend: bugun — soatlik, hafta/oy — kunlik, yil — oylik
    type Bucket = { date: string; revenue: number; profit: number; orders: number; expenses: number; cogs: number };
    const buckets: Bucket[] = [];
    const keyOf = (d: Date) =>
      datePreset === 'TODAY'
        ? `${d.getHours()}`
        : datePreset === 'YEAR'
        ? `${d.getMonth()}`
        : `${d.getMonth()}-${d.getDate()}`;
    const index = new Map<string, Bucket>();
    const addBucket = (key: string, label: string) => {
      const b = { date: label, revenue: 0, profit: 0, orders: 0, expenses: 0, cogs: 0 };
      buckets.push(b);
      index.set(key, b);
    };
    if (datePreset === 'TODAY') {
      for (let h = 0; h <= now.getHours(); h++) addBucket(`${h}`, `${String(h).padStart(2, '0')}:00`);
    } else if (datePreset === 'YEAR') {
      for (let m = 0; m <= now.getMonth(); m++) addBucket(`${m}`, tr(MONTHS_UZ[m]));
    } else {
      for (let d = new Date(start); d <= now; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
        addBucket(`${d.getMonth()}-${d.getDate()}`, `${String(d.getDate()).padStart(2, '0')} ${tr(MONTHS_UZ[d.getMonth()])}`);
      }
    }
    cur.os.forEach(({ order, date }) => {
      const b = index.get(keyOf(date));
      if (!b) return;
      b.revenue += order.total || 0;
      b.cogs += orderCost(order, costOf);
      b.orders += 1;
    });
    cur.es.forEach(({ expense, date }) => {
      const b = index.get(keyOf(date));
      if (b) b.expenses += expense.amount || 0;
    });
    buckets.forEach(b => (b.profit = b.revenue - b.cogs - b.expenses));

    // Toifalar bo‘yicha savdo
    const byCategory = new Map<string, number>();
    cur.os.forEach(({ order }) =>
      (order.items || []).forEach((i: any) => {
        const catId = productMap.get(i.productId)?.categoryId;
        const name = (catId && categoryName.get(catId)) || tr("Boshqa");
        const amount = i.subtotal ?? (i.price || 0) * (i.quantity || 0);
        byCategory.set(name, (byCategory.get(name) || 0) + amount);
      }),
    );
    const categoryBreakdown = [...byCategory.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    const days = Math.max(1, Math.round((startOfDay(now).getTime() - start.getTime()) / 86400000) + 1);

    return {
      cur,
      prev,
      buckets,
      categoryBreakdown,
      days,
      revenueGrowth: growthPct(cur.revenue, prev.revenue),
      avgCheckGrowth: growthPct(cur.avgCheck, prev.avgCheck),
    };
    // store massivlarni joyida o‘zgartiradi, shuning uchun version bo‘yicha qayta hisoblaymiz
  }, [datePreset, branchId, orders, expenses, products, version]);

  const { cur, buckets, categoryBreakdown } = report;
  const hasData = cur.count > 0 || cur.expenseTotal > 0;
  const margin = cur.revenue > 0 ? (cur.profit / cur.revenue) * 100 : 0;
  const periodLabel =
    datePreset === 'TODAY' ? tr("Bugun") : datePreset === 'WEEK' ? tr("Bu hafta") : datePreset === 'MONTH' ? tr("Bu oy") : tr("Bu yil");
  const prevLabel =
    datePreset === 'TODAY' ? 'kechaga' : datePreset === 'WEEK' ? tr("o‘tgan haftaga") : datePreset === 'MONTH' ? tr("o‘tgan oyga") : tr("o‘tgan yilga");

  const handleExportCSV = () => {
    const esc = (v: string | number) => {
      const s = String(v);
      return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows: (string | number)[][] = [
      [tr("Davr"), periodLabel],
      [tr("Jami tushum"), Math.round(cur.revenue)],
      [tr("Buyurtmalar soni"), cur.count],
      [tr("O‘rtacha chek"), Math.round(cur.avgCheck)],
      [tr("Tannarx"), Math.round(cur.cogs)],
      [tr("Xarajatlar"), Math.round(cur.expenseTotal)],
      [tr("Sof foyda"), Math.round(cur.profit)],
      [],
      [tr("Sana"), tr("Tushum"), tr("Tannarx"), tr("Xarajatlar"), tr("Sof foyda"), tr("Buyurtmalar")],
      ...buckets.map(b => [b.date, Math.round(b.revenue), Math.round(b.cogs), Math.round(b.expenses), Math.round(b.profit), b.orders]),
      [],
      [tr("Toifa"), tr("Savdo")],
      ...categoryBreakdown.map(c => [c.category, Math.round(c.amount)]),
    ];
    const csv = '﻿' + rows.map(r => r.map(esc).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `FoodPlace_Moliya_${datePreset}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const Growth: React.FC<{ value: number | null; suffix?: string }> = ({ value, suffix = '' }) => {
    if (value === null) return <div className="text-[11px] text-slate-400 mt-1">{tr("Oldingi davrda ma’lumot yo‘q")}</div>;
    const up = value >= 0;
    return (
      <div className={`flex items-center gap-1 text-[11px] font-bold mt-1 ${up ? 'text-emerald-600' : 'text-rose-600'}`}>
        {up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
        <span>
          {up ? '+' : ''}
          {value.toFixed(1)}% {suffix}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Range Selection (Matching Screen 8) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {tr("Sotuvlar va Moliya Hisoboti")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {tr("Daromad, sof foyda, xarajatlar tahlili va o‘sish ko‘rsatkichlari")}
          </p>
        </div>

        {/* Date presets & Exports */}
        <div className="flex items-center gap-2">
          <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            {(['TODAY', 'WEEK', 'MONTH', 'YEAR'] as const).map(p => (
              <button
                key={p}
                onClick={() => setDatePreset(p)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  datePreset === p
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {p === 'TODAY'
                  ? tr("Bugun")
                  : p === 'WEEK'
                  ? tr("Bu hafta")
                  : p === 'MONTH'
                  ? tr("Bu oy")
                  : tr("Yillik")}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            title={tr("Excel / CSV yuklash")}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">{tr("Eksport")}</span>
          </button>

          <button
            onClick={handlePrint}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200 transition"
            title={tr("Chop etish")}
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards (Matching Screen 8) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span>{tr("Jami tushum")}</span>
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {fmt(cur.revenue)} <span className="text-xs font-bold text-slate-400">UZS</span>
          </div>
          <Growth value={report.revenueGrowth} suffix={`${prevLabel} nisbatan`} />
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span>{tr("Buyurtmalar soni")}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {fmt(cur.count)} <span className="text-xs font-bold text-slate-400">{tr("ta")}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {datePreset === 'TODAY'
              ? `${tr('Kecha shu vaqtgacha:')} ${fmt(report.prev.count)} ${tr('ta')}`
              : datePreset === 'YEAR'
              ? `${tr('Oylik o‘rtacha')} ${(cur.count / (new Date().getMonth() + 1)).toFixed(1).replace(/\.0$/, '')} ${tr('ta')}`
              : `${tr('Kunlik o‘rtacha')} ${(cur.count / report.days).toFixed(1).replace(/\.0$/, '')} ${tr('ta')}`}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span>{tr("O‘rtacha chek")}</span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {fmt(cur.avgCheck)} <span className="text-xs font-bold text-slate-400">UZS</span>
          </div>
          <Growth value={report.avgCheckGrowth} suffix="o‘zgarish" />
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span>{tr("Sof foyda")}</span>
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            <span className={cur.profit < 0 ? 'text-rose-600' : ''}>{fmt(cur.profit)}</span>{' '}
            <span className="text-xs font-bold text-slate-400">UZS</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {tr("Tannarx")} {fmt(cur.cogs)} {tr("· Xarajat")} {fmt(cur.expenseTotal)}
          </div>
          {cur.revenue > 0 && (
            <div className="text-[11px] text-purple-600 font-bold">{tr("Sof rentabellik:")} {margin.toFixed(1)}%</div>
          )}
        </div>
      </div>

      {/* Main Chart: Revenue & Profit Trend Curve */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {datePreset === 'TODAY' ? tr("Soatlik") : datePreset === 'YEAR' ? tr("Oylik") : tr("Kunlik")} {tr("tushum va sof foyda grafigi")}
            </h3>
            <p className="text-xs text-slate-400">{periodLabel}{tr(": tushum, tannarx va xarajatlar balansi")}</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="text-slate-600 dark:text-slate-300">{tr("Tushum")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600 dark:text-slate-300">{tr("Sof foyda")}</span>
            </div>
          </div>
        </div>

        {!hasData ? (
          <div className="h-72 w-full flex flex-col items-center justify-center text-center text-slate-400">
            <BarChart3 className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm font-semibold">{periodLabel} {tr("uchun ma’lumot yo‘q")}</p>
            <p className="text-xs mt-1">{tr("To‘langan buyurtmalar yoki xarajatlar kiritilgach grafik shu yerda paydo bo‘ladi")}</p>
          </div>
        ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={buckets} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={v =>
                  Math.abs(v) >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}K` : `${v}`
                }
              />
              <Tooltip
                formatter={(val: any, name: any) => [
                  `${fmt(Number(val || 0))} UZS`,
                  name === 'revenue' ? tr("Tushum") : tr("Sof foyda"),
                ]}
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderRadius: '12px',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px',
                }}
              />

              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
              <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProf)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        )}
      </div>

      {/* Category Breakdown Horizontal Bars */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs">
        <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4">
          {tr("Toifalar bo‘yicha savdo hajmi")}
        </h3>

        {categoryBreakdown.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">{periodLabel} {tr("uchun sotuvlar yo‘q")}</p>
        ) : (
        <div className="space-y-3">
          {categoryBreakdown.map(item => {
            const max = categoryBreakdown[0].amount || 1;
            const pct = Math.round((item.amount / max) * 100);
            return (
              <div key={item.category} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-800 dark:text-slate-200">{item.category}</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">
                    {fmt(item.amount)} UZS
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
};
