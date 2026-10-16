import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  ArrowDownRight,
  Filter,
  Calendar,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { store } from '../../services/store';
import { Expense } from '../../types';

type ExpenseCategory = 'INGREDIENTS' | 'SALARY' | 'UTILITIES' | 'RENT' | 'OTHER';
import { tr } from '../../locales';

export const ExpensesView: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>(store.expenses);
  const [showAddModal, setShowAddModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Form states
  const [category, setCategory] = useState<ExpenseCategory>('INGREDIENTS');
  const [amount, setAmount] = useState<number>(500000);
  const [description, setDescription] = useState('');

  const refresh = () => {
    setExpenses([...store.expenses]);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !description.trim()) return;

    store.addExpense({
      category,
      categoryLabel:
        category === 'INGREDIENTS'
          ? 'Xomashyo & Mahsulotlar'
          : category === 'SALARY'
          ? 'Ish haqi'
          : category === 'UTILITIES'
          ? 'Kommunal'
          : category === 'RENT'
          ? 'Ijara'
          : 'Boshqa xarajat',
      amount,
      description: description.trim(),
      date: new Date().toLocaleDateString('uz-UZ'),
    });


    setShowAddModal(false);
    setDescription('');
    setAmount(500000);
    refresh();
  };

  const filteredExpenses = expenses.filter(
    e => categoryFilter === 'ALL' || e.category === categoryFilter
  );

  const totalExpenseSum = expenses.reduce((sum, e) => sum + e.amount, 0);

  const getCategoryBadge = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'INGREDIENTS':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
            {tr("Xomashyo & Go‘sht")}
          </span>
        );
      case 'SALARY':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
            {tr("Ish haqi")}
          </span>
        );
      case 'UTILITIES':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
            {tr("Kommunal (Svet/Gaz)")}
          </span>
        );
      case 'RENT':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
            {tr("Ijara to‘lovi")}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            Boshqa xarajat
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {tr("Xarajatlar boshqaruvi")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {tr("Restoran operatsion xarajatlari, kommunal, xomashyo va oylik maoshlar")}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{tr("Xarajat qo‘shish")}</span>
        </button>
      </div>

      {/* Summary Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="text-xs text-slate-400 font-semibold">{tr("Umumiy xarajatlar summasi")}</div>
          <div className="text-3xl font-black mt-1">
            {totalExpenseSum.toLocaleString()}{' '}
            <span className="text-sm font-bold text-slate-400">UZS</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-300 bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-xs">
          <ArrowDownRight className="w-4 h-4 text-rose-400" />
          <span>{expenses.length} {tr("ta qayd etilgan chiqim operatsiyasi")}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            {tr("Xarajatlar tarixi")}
          </h3>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="ALL">{tr("Barcha kategoriyalar")}</option>
            <option value="INGREDIENTS">{tr("Xomashyo & Mahsulotlar")}</option>
            <option value="SALARY">{tr("Ish haqi")}</option>
            <option value="UTILITIES">{tr("Kommunal")}</option>
            <option value="RENT">{tr("Ijara")}</option>
            <option value="OTHER">{tr("Boshqa")}</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-[11px] font-extrabold uppercase text-slate-400">
                <th className="py-3 px-4">{tr("Sana")}</th>
                <th className="py-3 px-4">{tr("Toifa")}</th>
                <th className="py-3 px-4">{tr("Tavsif / Sabab")}</th>
                <th className="py-3 px-4">{tr("Mas'ul xodim")}</th>
                <th className="py-3 px-4 text-right">{tr("Summa")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredExpenses.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40">
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {item.createdAt || item.date || tr("Bugun")}
                  </td>
                  <td className="py-3 px-4">{getCategoryBadge(item.category as ExpenseCategory)}</td>
                  <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                    {item.description}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {item.createdByUserName || item.createdBy || tr("Buxgalter")}
                  </td>

                  <td className="py-3 px-4 text-right font-black text-rose-600 dark:text-rose-400 font-mono">
                    -{item.amount.toLocaleString()} UZS
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {tr("Yangi xarajat kiritish")}
            </h3>

            <form onSubmit={handleAddExpense} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {tr("Xarajat toifasi")}
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="INGREDIENTS">{tr("Xomashyo & Go‘sht")}</option>
                  <option value="SALARY">{tr("Ish haqi (Avans/Oylik)")}</option>
                  <option value="UTILITIES">{tr("Kommunal to‘lovlar")}</option>
                  <option value="RENT">{tr("Ijara to‘lovi")}</option>
                  <option value="OTHER">{tr("Boshqa operatsion xarajat")}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {tr("Summa (UZS)")}
                </label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {tr("Tavsif va tafsilotlar")}
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={tr("Masalan: Go‘sht yetkazib beruvchiga to‘lov...")}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white"
                  required
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
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  {tr("Tasdiqlash")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
