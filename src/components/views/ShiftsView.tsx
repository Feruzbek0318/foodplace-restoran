import React, { useState } from 'react';
import {
  Clock,
  DollarSign,
  Play,
  Square,
  CheckCircle,
  AlertTriangle,
  FileText,
  User,
  Calendar,
} from 'lucide-react';
import { store } from '../../services/store';
import { Shift } from '../../types';
import { tr, roleLabel } from '../../locales';

export const ShiftsView: React.FC = () => {
  const currentShift = store.currentShift;
  const shiftsHistory = store.shiftsHistory;
  const user = store.currentUser;

  // Open shift state
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [openingFloat, setOpeningFloat] = useState(500000);

  // Close shift state
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [actualCashAtHand, setActualCashAtHand] = useState(0);
  const [closeNotes, setCloseNotes] = useState('');

  const [, forceUpdate] = useState({});

  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    store.openShift(openingFloat);
    setShowOpenModal(false);
    forceUpdate({});
  };

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    store.closeShift(actualCashAtHand, closeNotes);
    setShowCloseModal(false);
    forceUpdate({});
  };

  const expectedCashInDrawer = currentShift
    ? currentShift.openingCash + currentShift.cashSales
    : 0;
  const difference = actualCashAtHand - expectedCashInDrawer;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {tr("Kassa Smenalari (Z-Hisobot)")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {tr("Kassir smenasini ochish, yopish, naqd pul hisoboti va kamomad nazorati")}
          </p>
        </div>

        {currentShift ? (
          <button
            onClick={() => {
              setActualCashAtHand(expectedCashInDrawer);
              setShowCloseModal(true);
            }}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition"
          >
            <Square className="w-4 h-4" />
            <span>{tr("Smenani yopish (Z-Report)")}</span>
          </button>
        ) : (
          <button
            onClick={() => setShowOpenModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
          >
            <Play className="w-4 h-4" />
            <span>{tr("Yangi smena ochish")}</span>
          </button>
        )}
      </div>

      {/* Active Shift Card */}
      {currentShift ? (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border-2 border-emerald-500/50 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 gap-2">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {tr("Joriy faol smena:")} {currentShift.id}
                </h3>
                <div className="text-xs text-slate-400">
                  {tr("Kassir:")} <strong>{currentShift.cashierName}</strong> {tr("• Boshlandi:")} {currentShift.openedAt}
                </div>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 w-fit">
              {tr("🟢 Smena Ochiq")}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/40">
              <div className="text-[11px] text-slate-400 font-semibold">{tr("Boshlang‘ich qoldiq (Float)")}</div>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {(currentShift.openingCash || 0).toLocaleString()} UZS
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/40">
              <div className="text-[11px] text-slate-400 font-semibold">{tr("Naqd savdo")}</div>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                +{(currentShift.cashSales || 0).toLocaleString()} UZS
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/40">
              <div className="text-[11px] text-slate-400 font-semibold">{tr("Karta / Elektron savdo")}</div>
              <div className="text-lg font-black text-blue-600 dark:text-blue-400 mt-1">
                +{(currentShift.cardSales || 0).toLocaleString()} UZS
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50">
              <div className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold">
                {tr("Kassada bo‘lishi kutilgan naqd pul")}
              </div>
              <div className="text-lg font-black text-blue-800 dark:text-blue-200 mt-1">
                {(expectedCashInDrawer || 0).toLocaleString()} UZS
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-center space-y-3">
          <Clock className="w-10 h-10 mx-auto text-slate-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {tr("Hozirda faol smena ochilmagan")}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {tr("Kassada buyurtmalar va to‘lovlarni qabul qilish uchun yangi smena oching va boshlang‘ich naqd pul qoldig‘ini kiriting.")}
          </p>
          <button
            onClick={() => setShowOpenModal(true)}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm inline-flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            <span>{tr("Smena ochish")}</span>
          </button>
        </div>
      )}

      {/* Shifts History Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            {tr("O‘tgan smenalar tarixi")}
          </h3>
          <span className="text-xs text-slate-400">{shiftsHistory.length} {tr("ta yozuv")}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-[11px] font-extrabold uppercase text-slate-400">
                <th className="py-3 px-4">{tr("Smena ID")}</th>
                <th className="py-3 px-4">{tr("Kassir")}</th>
                <th className="py-3 px-4">{tr("Ochilgan / Yopilgan")}</th>
                <th className="py-3 px-4">{tr("Boshlang‘ich")}</th>
                <th className="py-3 px-4">{tr("Naqd savdo")}</th>
                <th className="py-3 px-4">{tr("Karta savdo")}</th>
                <th className="py-3 px-4">{tr("Farq / Kamomad")}</th>
                <th className="py-3 px-4">{tr("Holat")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {shiftsHistory.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40">
                  <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">{s.id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {s.cashierName}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono">
                    <div>{s.openedAt}</div>
                    <div className="text-[10px] text-slate-400">{s.closedAt || '—'}</div>
                  </td>
                  <td className="py-3 px-4 font-mono">{(s.openingCash || 0).toLocaleString()} UZS</td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                    +{(s.cashSales || 0).toLocaleString()} UZS
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">
                    +{(s.cardSales || 0).toLocaleString()} UZS
                  </td>
                  <td className="py-3 px-4 font-mono font-bold">
                    {s.difference === undefined ? (
                      '—'
                    ) : s.difference === 0 ? (
                      <span className="text-emerald-600">{tr("0 UZS (To‘g‘ri)")}</span>
                    ) : s.difference < 0 ? (
                      <span className="text-rose-600">{(s.difference || 0).toLocaleString()} {tr("UZS (Kamomad)")}</span>
                    ) : (
                      <span className="text-purple-600">+{(s.difference || 0).toLocaleString()} {tr("UZS (Ortiqcha)")}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {s.status === 'OPEN' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        {tr("Ochiq")}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {tr("Yopilgan")}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Shift Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {tr("Yangi kassir smenasini ochish")}
            </h3>
            <p className="text-xs text-slate-400">
              {tr("Kassir:")} <strong>{user?.fullName}</strong> ({roleLabel(user?.role)})
            </p>

            <form onSubmit={handleOpenShift} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {tr("Boshlang‘ich naqd pul qoldig‘i (Qaytim uchun kassa float)")}
                </label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={openingFloat}
                  onChange={e => setOpeningFloat(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOpenModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
                >
                  {tr("Bekor qilish")}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  {tr("Smenani ochish")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {tr("Smenani yopish va Z-Hisobot")}
            </h3>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/40 text-xs space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>{tr("Boshlang‘ich qoldiq:")}</span>
                <span>{(currentShift?.openingCash || 0).toLocaleString()} UZS</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>{tr("Naqd savdo:")}</span>
                <span className="text-emerald-600">+{(currentShift?.cashSales || 0).toLocaleString()} UZS</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-slate-200 dark:border-slate-600">
                <span>{tr("Kassadagi kutilgan pul:")}</span>
                <span>{(expectedCashInDrawer || 0).toLocaleString()} UZS</span>
              </div>
            </div>

            <form onSubmit={handleCloseShift} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {tr("Haqiqatda sanab olingan naqd pul:")}
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={actualCashAtHand}
                  onChange={e => setActualCashAtHand(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div className="p-2.5 rounded-xl border text-xs flex items-center justify-between font-bold">
                <span>{tr("Hisoblangan farq:")}</span>
                <span
                  className={
                    difference === 0
                      ? 'text-emerald-600'
                      : difference < 0
                      ? 'text-rose-600'
                      : 'text-purple-600'
                  }
                >
                  {difference === 0
                    ? tr("0 UZS (Kamomad yo‘q)")
                    : `${(difference || 0).toLocaleString()} UZS (${
                        difference < 0 ? tr("Kamomad") : tr("Ortiqcha")
                      })`}
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {tr("Yopish izohi / Kassir eslatmasi")}
                </label>
                <input
                  type="text"
                  value={closeNotes}
                  onChange={e => setCloseNotes(e.target.value)}
                  placeholder={tr("Kassa inkassatsiya topshirildi...")}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
                >
                  {tr("Bekor qilish")}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  {tr("Smenani yopish")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
