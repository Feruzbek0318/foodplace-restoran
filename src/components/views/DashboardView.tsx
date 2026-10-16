import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, ShoppingBag, DollarSign,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, XCircle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { store } from '../../services/store';
import { useTranslation } from '../../hooks/useTranslation';
import { tr, formatDayMonth } from '../../locales';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const DashboardView: React.FC = () => {
  const { t } = useTranslation();
  const [activeBranch, setActiveBranch] = useState(store.activeBranchId);
  const [stats, setStats] = useState({
    todaySales: 0,
    todayOrders: 0,
    activeOrders: 0,
    todayCustomers: 0,
    salesData: [] as any[],
    paymentData: [] as any[],
    recentOrders: [] as any[],
    popularProducts: [] as any[],
  });

  useEffect(() => {
    const calculateStats = () => {
      const orders = store.orders.filter(o => o.branchId === activeBranch || !o.branchId);
      
      // Calculate based on Restaurant Timezone
      const now = new Date();
      const tz = store.settings?.timezone || 'Asia/Tashkent';
      const todayStr = new Intl.DateTimeFormat('uz-UZ', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
      // Format usually comes out as DD.MM.YYYY or MM/DD/YYYY depending on Node environment, but let's safely match substring.
      
      // For safe matching, if order.createdAt is "30.09.2026, 12:00:00", we match the date part.
      // A better way is to use the start and end of the day in that timezone, but since we rely on string matching for now:
      const todayOrdersArr = orders.filter(o => {
        if (!o.createdAt) return false;
        // Check if the order was created today (simple string includes check for the current day number and month)
        const day = new Intl.DateTimeFormat('en-US', { timeZone: tz, day: '2-digit' }).format(now);
        const month = new Intl.DateTimeFormat('en-US', { timeZone: tz, month: '2-digit' }).format(now);
        const year = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric' }).format(now);
        
        // Match variants: DD.MM.YYYY or YYYY-MM-DD or MM/DD/YYYY
        return o.createdAt.includes(`${day}.${month}.${year}`) || 
               o.createdAt.includes(`${month}/${day}/${year}`) || 
               o.createdAt.includes(`${year}-${month}-${day}`);
      });

      const paidTodayArr = todayOrdersArr.filter(o => o.status !== 'CANCELLED' && (o.paymentStatus === 'PAID' || o.status === 'COMPLETED'));
      const todaySales = paidTodayArr.reduce((acc, o) => acc + (o.total || 0), 0);
      const activeOrdersArr = orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
      const todayCustomers = new Set(todayOrdersArr.map(o => o.customerId).filter(Boolean)).size;

      // Hourly Sales Data (Simple mock curve based on today's total if empty, else real)
      let salesData: Array<{ name: string; total: number }> = [];
      if (todayOrdersArr.length === 0) {
         salesData = [];
      } else {
         const hours = [8, 10, 12, 14, 16, 18, 20, 22];
         salesData = hours.map(h => {
            const hStr = h.toString().padStart(2, '0');
            const total = todayOrdersArr.filter(o => o.createdAt?.includes(` ${hStr}:`) || o.createdAt?.includes(`,${hStr}:`)).reduce((acc, o) => acc + (o.total || 0), 0);
            return { name: `${hStr}:00`, total };
         });
      }

      // Payment Data
      const payments: Record<string, number> = { 'Naqd': 0, 'Karta': 0, 'Payme': 0, 'Click': 0, 'Uzum': 0 };
      paidTodayArr.forEach(o => {
         if (o.paymentMethod === 'CASH') payments['Naqd'] += o.total;
         else if (o.paymentMethod === 'CARD') payments['Karta'] += o.total;
         else if (o.paymentMethod === 'PAYME') payments['Payme'] += o.total;
         else if (o.paymentMethod === 'CLICK') payments['Click'] += o.total;
         else if (o.paymentMethod === 'UZUM') payments['Uzum'] += o.total;
      });
      const paymentData = Object.keys(payments).map(k => ({ name: tr(k), value: payments[k] })).filter(p => p.value > 0);

      // Popular Products
      const productCount: Record<string, number> = {};
      todayOrdersArr.forEach(o => {
         o.items?.forEach(i => {
           productCount[i.productId] = (productCount[i.productId] || 0) + i.quantity;
         });
      });
      const popIds = Object.keys(productCount).sort((a,b) => productCount[b] - productCount[a]).slice(0, 5);
      const popularProducts = popIds.map(id => {
         const p = store.products.find(pr => pr.id === id);
         return { ...p, sold: productCount[id] };
      }).filter(p => p.name);

      setStats({
        todaySales,
        todayOrders: todayOrdersArr.length,
        activeOrders: activeOrdersArr.length,
        todayCustomers,
        salesData,
        paymentData,
        recentOrders: orders.slice(0, 5),
        popularProducts
      });
    };

    calculateStats();
    const unsub = store.subscribe(calculateStats);
    return unsub;
  }, [activeBranch]);

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 lg:p-8 animate-in fade-in">
      {/* Branch Selector Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{t('dashboard')}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{tr("Bugungi asosiy ko'rsatkichlar va statistika")}</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            value={activeBranch}
            onChange={(e) => setActiveBranch(e.target.value)}
          >
            {store.branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium rounded-xl text-sm border border-blue-100 dark:border-blue-800/50">
            {formatDayMonth()}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="flex justify-between items-start mb-4 relative">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">
              <ArrowUpRight className="w-3 h-3" />
              0%
            </span>
          </div>
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{tr("Bugungi Savdo")}</h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.todaySales > 0 ? stats.todaySales.toLocaleString() + ' UZS' : tr("Yo'q")}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 dark:bg-emerald-900/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="flex justify-between items-start mb-4 relative">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">
              <ArrowUpRight className="w-3 h-3" />
              0%
            </span>
          </div>
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{tr("Buyurtmalar")}</h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.todayOrders}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-fuchsia-50 dark:bg-fuchsia-900/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="flex justify-between items-start mb-4 relative">
            <div className="w-12 h-12 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{tr("Faol Buyurtmalar")}</h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.activeOrders}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-50 dark:bg-orange-900/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="flex justify-between items-start mb-4 relative">
            <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{tr("Mijozlar")}</h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.todayCustomers}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{tr("Savdo Dinamikasi")}</h2>
            <select className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg px-3 py-1.5">
              <option>{tr("Bugun")}</option>
              <option>{tr("Hafta")}</option>
              <option>{tr("Oy")}</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            {stats.salesData.length > 0 && stats.salesData.some(d => d.total > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={value => `${value / 1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`${Number(value).toLocaleString()} UZS`, tr("Savdo")]}
                  />
                  <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                <TrendingUp className="w-12 h-12 mb-3 opacity-20" />
                <p className="font-medium">{tr("Hali savdo ma'lumotlari yo'q")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">{tr("To'lov Turlari")}</h2>
          <div className="h-[220px] w-full relative">
            {stats.paymentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${Number(value).toLocaleString()} UZS`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                <p className="font-medium">{tr("To'lovlar yo'q")}</p>
              </div>
            )}
          </div>
          <div className="mt-4 space-y-3">
            {stats.paymentData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-slate-600 dark:text-slate-400 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{item.value.toLocaleString()} UZS</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
