import React, { useState } from 'react';
import { Users, Trash2,
  Search,
  Plus,
  Phone,
  Gift,
  ShoppingBag,
  Star,
  Award,
  Calendar,
} from 'lucide-react';
import { store } from '../../services/store';
import { Customer } from '../../types';
import { tr } from '../../locales';

export const CustomersView: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(store.customers);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+998 90 ');
  const [discountPercent, setDiscountPercent] = useState(5);

  const refresh = () => setCustomers([...store.customers]);

  const filtered = customers.filter(
    c =>
      (c.name || c.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const handleDeleteCustomer = (id: string, name: string) => {
    if (window.confirm(tr('Mijozni o‘chirmoqchimisiz?') + ` "${name}"`)) {
      store.deleteCustomer(id);
      refresh();
    }
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    store.addCustomer({
      name: name.trim(),
      fullName: name.trim(),
      phone: phone.trim(),
      discountPercent,
      ordersCount: 0,
      totalOrders: 0,
      totalSpent: 0,
    });

    setShowAddModal(false);
    setName('');
    setPhone('+998 90 ');
    refresh();
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {tr("Mijozlar Bazasi (CRM)")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {tr("Doimiy mehmonlar, chegirmalar, tashriflar tarixi va sodiqlik dasturi")}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{tr("Yangi mijoz")}</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-4 shadow-xs flex items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={tr("Mijoz ismi yoki telefon raqami bo‘yicha qidirish...")}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
          />
        </div>

        <div className="text-xs text-slate-500 font-semibold">
          {tr("Jami mijozlar:")} <span className="font-bold text-slate-900 dark:text-white">{customers.length}</span>
        </div>
      </div>

      {/* Grid of Customer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => (
          <div
            key={c.id}
            className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-500 transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-sm">
                  {(c.name || c.fullName || 'M').charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {c.name || c.fullName}
                  </h3>
                  <div className="text-xs text-slate-400 flex items-center gap-1 font-mono mt-0.5">
                    <Phone className="w-3 h-3" />
                    <span>{c.phone}</span>
                  </div>
                </div>
              </div>

              {(c.discountPercent ?? 0) > 0 && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <Gift className="w-3 h-3" />
                  <span>{c.discountPercent}%</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/40 text-xs border border-slate-100 dark:border-slate-700">
              <div>
                <span className="text-[11px] text-slate-400">{tr("Buyurtmalar soni")}</span>
                <div className="font-black text-slate-900 dark:text-white mt-0.5">
                  {c.ordersCount ?? c.totalOrders ?? 0} {tr("ta")}
                </div>

              </div>
              <div>
                <span className="text-[11px] text-slate-400">{tr("Umumiy xarid")}</span>
                <div className="font-black text-blue-600 dark:text-blue-400 mt-0.5">
                  {c.totalSpent.toLocaleString()} UZS
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700">
              <span>{tr("Ro‘yxatdan o‘tgan:")}</span>
              <span className="font-mono">{c.createdAt}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {tr("Yangi mijoz qo‘shish")}
            </h3>

            <form onSubmit={handleAddCustomer} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {tr("Mijoz ismi va familiyasi")}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={tr("Masalan: Nodirbek Alimov")}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {tr("Telefon raqam")}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {tr("Doimiy chegirma foizi (%)")}
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={discountPercent}
                  onChange={e => setDiscountPercent(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
                >
                  {tr("Bekor qilish")}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  {tr("Saqlash")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
