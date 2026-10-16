import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Lock,
  User,
  Clock,
  Laptop,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { store } from '../../services/store';
import { AuditLog as AuditLogItem } from '../../types';
import { tr, trMessage, actionLabel } from '../../locales';

// Derives the module name from the action prefix (ORDER_CREATED -> Orders)
const MODULES: Array<[string, string]> = [
  ['ORDER', 'Buyurtmalar'], ['PRODUCT', 'Mahsulotlar'], ['PRICE', 'Mahsulotlar'], ['INVENTORY', 'Omborxona'],
  ['SHIFT', 'Smenalar'], ['EXPENSE', 'Xarajatlar'], ['CUSTOMER', 'Mijozlar'], ['USER', 'Xodimlar'],
  ['PERMISSIONS', 'Xodimlar'], ['AUTH', 'Xavfsizlik'], ['BRANCH', 'Filiallar'], ['TABLE', 'Stollar'], ['SETTINGS', 'Sozlamalar'],
];
const moduleOf = (action: string) => tr(MODULES.find(([prefix]) => action.startsWith(prefix))?.[1] || 'Tizim');

export const AuditLogView: React.FC = () => {
  const [logs] = useState<AuditLogItem[]>(store.auditLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const filteredLogs = logs.filter(item => {
    const matchesSeverity =
      severityFilter === 'ALL' || item.severity === severityFilter;
    const clean = searchQuery.toLowerCase();
    const matchesSearch =
      !clean ||
      item.action.toLowerCase().includes(clean) ||
      item.userName.toLowerCase().includes(clean) ||
      item.details.toLowerCase().includes(clean) ||
      moduleOf(item.action).toLowerCase().includes(clean);


    return matchesSeverity && matchesSearch;
  });

  const getSeverityBadge = (sev: AuditLogItem['severity']) => {
    switch (sev) {
      case 'CRITICAL':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
            {tr("Kritik")}
          </span>
        );
      case 'WARNING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
            {tr("Ogohlantirish")}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
            Info
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {tr("Audit Log va Xavfsizlik Jurnali")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {tr("O‘chirib bo‘lmaydigan (Immutable) operatsiyalar tarixi va tizim xavfsizlik nazorati")}
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-mono shadow-sm">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>{tr("WORM (Write Once, Read Many) Saqlash")}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={tr("Harakat, xodim yoki modul bo‘yicha qidirish...")}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="ALL">{tr("Barcha darajalar")}</option>
            <option value="INFO">{tr("Oddiy (INFO)")}</option>
            <option value="WARNING">{tr("Ogohlantirish (WARNING)")}</option>
            <option value="CRITICAL">{tr("Kritik (CRITICAL)")}</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-[11px] font-extrabold uppercase text-slate-400">
                <th className="py-3 px-4">{tr("Vaqt")}</th>
                <th className="py-3 px-4">{tr("Xodim")}</th>
                <th className="py-3 px-4">{tr("Amal / Operatsiya")}</th>
                <th className="py-3 px-4">{tr("Modul")}</th>
                <th className="py-3 px-4">{tr("Tafsilotlar")}</th>
                <th className="py-3 px-4">{tr("IP Manzil")}</th>
                <th className="py-3 px-4">{tr("Daraja")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40">
                  <td className="py-3 px-4 font-mono text-slate-400">{log.timestamp}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {log.userName}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {actionLabel(log.action)}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{moduleOf(log.action)}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                    {trMessage(log.details)}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    {log.ipAddress || '—'}
                  </td>
                  <td className="py-3 px-4">{getSeverityBadge(log.severity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
