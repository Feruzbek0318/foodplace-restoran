import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  Eye,
  Printer,
  XCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';
import { store } from '../../services/store';
import { Order, OrderStatus } from '../../types';
import { ReceiptModal } from '../common/ReceiptModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { tr, orderTypeLabel, paymentLabel } from '../../locales';
import { hasPermission } from '../../utils/permissions';

interface OrdersViewProps {
  onNavigateToPos: () => void;
  initialSelectedOrderId?: string;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  onNavigateToPos,
  initialSelectedOrderId,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('TODAY');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(
    initialSelectedOrderId
      ? store.orders.find(o => o.id === initialSelectedOrderId) || null
      : null
  );
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

  const currentUser = store.currentUser;
  const orders = currentUser?.role === 'WAITER' 
    ? store.orders.filter(o => o.cashierId === currentUser.id)
    : store.orders;

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'NEW' && o.status === 'NEW') ||
        (selectedStatus === 'PREPARING' && o.status === 'PREPARING') ||
        (selectedStatus === 'READY' && o.status === 'READY') ||
        (selectedStatus === 'COMPLETED' && (o.status === 'COMPLETED' || o.status === 'SERVED')) ||
        (selectedStatus === 'CANCELLED' && o.status === 'CANCELLED');

      const cleanQuery = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !cleanQuery ||
        o.id.toLowerCase().includes(cleanQuery) ||
        (o.tableName && o.tableName.toLowerCase().includes(cleanQuery)) ||
        (o.customerName && o.customerName.toLowerCase().includes(cleanQuery)) ||
        (o.customerPhone && o.customerPhone.includes(cleanQuery));

      return matchesStatus && matchesQuery;
    });
  }, [orders, selectedStatus, searchQuery]);

  const handleCancelOrder = () => {
    if (!orderToCancel) return;
    store.updateOrderStatus(orderToCancel.id, 'CANCELLED', 'Mijoz yoki operator tomonidan bekor qilindi');
    setOrderToCancel(null);
    if (selectedOrder?.id === orderToCancel.id) {
      setSelectedOrder(null);
    }
  };

  const handleAdvanceStatus = (order: Order) => {
    let nextStatus: OrderStatus = 'PREPARING';
    if (order.status === 'NEW') nextStatus = 'PREPARING';
    else if (order.status === 'PREPARING') nextStatus = 'READY';
    else if (order.status === 'READY') nextStatus = 'SERVED';
    else if (order.status === 'SERVED') nextStatus = 'COMPLETED';

    store.updateOrderStatus(order.id, nextStatus);
    if (selectedOrder?.id === order.id) {
      setSelectedOrder({ ...order, status: nextStatus });
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'NEW':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
            {tr("Yangi")}
          </span>
        );
      case 'PREPARING':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
            {tr("Tayyorlanmoqda")}
          </span>
        );
      case 'READY':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
            {tr("Tayyor")}
          </span>
        );
      case 'SERVED':
      case 'COMPLETED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {tr("Yopilgan")}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">
            {tr("Bekor qilingan")}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {tr("Buyurtmalar")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {tr("Barcha faol va yakunlangan buyurtmalarni nazorat qilish")}
          </p>
        </div>

        {hasPermission('POS') && (
        <button
          onClick={onNavigateToPos}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{tr("Yangi buyurtma")}</span>
        </button>
        )}
      </div>

      {/* Filter Tabs (Matching Screen 4) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-4 space-y-4 shadow-xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100 dark:border-slate-700">
          {[
            { id: 'ALL', label: tr("Barchasi") },
            { id: 'NEW', label: tr("Yangi") },
            { id: 'PREPARING', label: tr("Tayyorlanmoqda") },
            { id: 'READY', label: tr("Tayyor") },
            { id: 'COMPLETED', label: tr("Yopilgan") },
            { id: 'CANCELLED', label: tr("Bekor qilingan") },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedStatus === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search and Date Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={tr("Buyurtma, stol yoki mijoz bo‘yicha qidirish...")}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="TODAY">{tr("Bugun")}</option>
              <option value="YESTERDAY">{tr("Kecha")}</option>
              <option value="WEEK">{tr("Bu hafta")}</option>
              <option value="MONTH">{tr("Bu oy")}</option>
            </select>

            <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                <th className="py-3.5 px-4 w-12">#</th>
                <th className="py-3.5 px-4">{tr("Buyurtma ID")}</th>
                <th className="py-3.5 px-4">{tr("Stol")}</th>
                <th className="py-3.5 px-4">{tr("Mijoz")}</th>
                <th className="py-3.5 px-4">{tr("Status")}</th>
                <th className="py-3.5 px-4">{tr("Jami")}</th>
                <th className="py-3.5 px-4">{tr("Vaqt")}</th>
                <th className="py-3.5 px-4 text-right">{tr("Amallar")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    {tr("Mos buyurtmalar topilmadi")}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, idx) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition"
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-bold text-blue-600 dark:text-blue-400">
                      {order.id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {order.tableName || orderTypeLabel(order.type)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      {order.customerName || '-'}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(order.status)}</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                      {(order.total || 0).toLocaleString()} UZS
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {order.createdAt.split(' ')[1] || order.createdAt}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        title={tr("Tafsilotlar")}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setReceiptOrder(order)}
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        title={tr("Chek chiqarish")}
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                        <>
                          <button
                            onClick={() => handleAdvanceStatus(order)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            title={tr("Keyingi bosqich")}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setOrderToCancel(order)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title={tr("Bekor qilish")}
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            onClick={() => setSelectedOrder(null)}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
          />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white dark:bg-slate-800 shadow-2xl border-l border-slate-200 dark:border-slate-700 flex flex-col">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {selectedOrder.id}
                  </h3>
                  <div className="text-[11px] text-slate-400">
                    {selectedOrder.tableName || orderTypeLabel(selectedOrder.type)} • {selectedOrder.createdAt}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs text-slate-500">{tr("Holat:")}</span>
                  <div>{getStatusBadge(selectedOrder.status)}</div>
                </div>

                {/* Items List */}
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                    {tr("Buyurtma qilingan taomlar")}
                  </div>
                  <div className="space-y-2">
                    {selectedOrder.items.map(item => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/30 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {item.productName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {item.quantity} x {(item.unitPrice || 0).toLocaleString()} UZS
                          </div>
                        </div>
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {(item.subtotal || 0).toLocaleString()} UZS
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>{tr("Oraliq jami:")}</span>
                    <span className="font-semibold">{(selectedOrder.subtotal || 0).toLocaleString()} UZS</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>{tr("Chegirma:")}</span>
                      <span>-{(selectedOrder.discount || 0).toLocaleString()} UZS</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-200 dark:border-slate-600">
                    <span>{tr("Jami:")}</span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {(selectedOrder.total || 0).toLocaleString()} UZS
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                    <span>{tr("To‘lov usuli:")}</span>
                    <span className="font-bold">{paymentLabel(selectedOrder.paymentMethod || 'CASH')}</span>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                <button
                  onClick={() => setReceiptOrder(selectedOrder)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{tr("Chek chiqarish")}</span>
                </button>
                {selectedOrder.status !== 'COMPLETED' && selectedOrder.status !== 'CANCELLED' && (
                  <button
                    onClick={() => handleAdvanceStatus(selectedOrder)}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                  >
                    <span>{tr("Keyingi holat")}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirm */}
      <ConfirmDialog
        isOpen={Boolean(orderToCancel)}
        title={tr("Buyurtmani bekor qilish")}
        message={`${orderToCancel?.id}: ${tr('Buyurtmani bekor qilmoqchimisiz? Ushbu amal audit logga saqlanadi.')}`}
        confirmLabel="Ha, bekor qilish"
        isDangerous={true}
        onConfirm={handleCancelOrder}
        onCancel={() => setOrderToCancel(null)}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        order={receiptOrder}
        isOpen={Boolean(receiptOrder)}
        onClose={() => setReceiptOrder(null)}
      />
    </div>
  );
};
