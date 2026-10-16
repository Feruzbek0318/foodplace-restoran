import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, ShoppingBag, Package, Grid, User, ArrowRight } from 'lucide-react';
import { store } from '../../services/store';
import { motion, AnimatePresence } from 'framer-motion';
import { tr, roleLabel, statusLabel, zoneLabel } from '../../locales';
import { hasPermission } from '../../utils/permissions';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string, detailId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const searchResults = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return { orders: [], products: [], tables: [], users: [] };

    // Only search sections the user is allowed to open
    const orders = !hasPermission('ORDERS') ? [] : store.orders.filter(
      o =>
        o.id.toLowerCase().includes(clean) ||
        (o.tableName && o.tableName.toLowerCase().includes(clean)) ||
        (o.customerPhone && o.customerPhone.includes(clean)) ||
        (o.customerName && o.customerName.toLowerCase().includes(clean))
    ).slice(0, 4);

    const products = !(hasPermission('PRODUCTS') || hasPermission('POS') || hasPermission('INVENTORY')) ? [] : store.products.filter(
      p =>
        p.name.toLowerCase().includes(clean) ||
        (p.barcode || '').toLowerCase().includes(clean) ||
        (p.categoryName || '').toLowerCase().includes(clean)
    ).slice(0, 4);

    const tables = !hasPermission('TABLES') ? [] : store.tables.filter(
      t => t.name.toLowerCase().includes(clean) || String(t.number).includes(clean)
    ).slice(0, 3);

    const users = !hasPermission('EMPLOYEES') ? [] : store.users.filter(
      u =>
        u.fullName.toLowerCase().includes(clean) ||
        u.username.toLowerCase().includes(clean) ||
        (u.phone || '').includes(clean)
    ).slice(0, 3);

    return { orders, products, tables, users };
  }, [query]);

  const hasAnyResults = searchResults.orders.length > 0 || searchResults.products.length > 0 || searchResults.tables.length > 0 || searchResults.users.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <Search className="w-5 h-5 text-slate-400 mr-3" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={tr("Order ID (e.g. ORD-2025-0048), mahsulot, stol yoki telefon qidiring...")}
                autoFocus
                className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden text-base"
              />
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {query.trim() === '' ? (
                <div className="text-center py-10 text-slate-400">
                  <div className="text-sm font-medium">{tr("Tezkor qidiruv tizimi")}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {tr("Masalan: \"ORD-2025\", \"Pizza\", \"Stol 5\" yoki xodim ismini kiriting")}
                  </div>
                </div>
              ) : !hasAnyResults ? (
                <div className="text-center py-8 text-slate-400">
                  <div className="text-sm font-medium">{tr("Hech qanday natija topilmadi")}</div>
                  <div className="text-xs text-slate-500 mt-1">"{query}{tr("\" bo‘yicha mos ma'lumot yo‘q")}</div>
                </div>
              ) : (
                <>
                  {/* Orders */}
                  {searchResults.orders.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-2 flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5" /> {tr("Buyurtmalar")}
                      </div>
                      <div className="space-y-1.5">
                        {searchResults.orders.map(order => (
                          <button
                            key={order.id}
                            onClick={() => {
                              onNavigate('orders', order.id);
                              onClose();
                            }}
                            className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
                          >
                            <div>
                              <div className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <span>{order.id}</span>
                                <span className="text-xs font-normal text-slate-500">
                                  • {order.tableName || order.type}
                                </span>
                              </div>
                              <div className="text-xs text-slate-400">
                                {order.total.toLocaleString()} UZS • {order.items.length} {tr("ta mahsulot • Status:")} {statusLabel(order.status)}
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Products */}
                  {searchResults.products.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-2 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5" /> {tr("Mahsulotlar")}
                      </div>
                      <div className="space-y-1.5">
                        {searchResults.products.map(prod => (
                          <button
                            key={prod.id}
                            onClick={() => {
                              onNavigate(hasPermission('POS') ? 'pos' : hasPermission('PRODUCTS') ? 'products' : 'inventory');
                              onClose();
                            }}
                            className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={prod.imageUrl}
                                alt={prod.name}
                                className="w-9 h-9 rounded-lg object-cover bg-slate-100"
                              />
                              <div>
                                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                  {prod.name}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {(prod.salePrice || prod.price || 0).toLocaleString()} {tr("UZS • Qoldiq:")} {prod.stock} {prod.unit}
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tables */}
                  {searchResults.tables.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-2 flex items-center gap-1.5">
                        <Grid className="w-3.5 h-3.5" /> {tr("Stollar")}
                      </div>
                      <div className="space-y-1.5">
                        {searchResults.tables.map(table => (
                          <button
                            key={table.id}
                            onClick={() => {
                              onNavigate('tables');
                              onClose();
                            }}
                            className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
                          >
                            <div>
                              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                {table.name} ({zoneLabel(table.zone)})
                              </div>
                              <div className="text-xs text-slate-400">
                                {tr("Sig‘im:")} {table.capacity} {tr("kishi • Holat:")} {table.status}
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Employees */}
                  {searchResults.users.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-2 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> {tr("Xodimlar")}
                      </div>
                      <div className="space-y-1.5">
                        {searchResults.users.map(u => (
                          <button
                            key={u.id}
                            onClick={() => {
                              onNavigate('employees');
                              onClose();
                            }}
                            className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
                          >
                            <div>
                              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                {u.fullName} (@{u.username})
                              </div>
                              <div className="text-xs text-slate-400">
                                {tr("Roli:")} {roleLabel(u.role)} {tr("• Tel:")} {u.phone} {tr("• Holati:")} {u.status}
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
