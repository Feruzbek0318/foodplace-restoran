import React, { useEffect } from 'react';
import { Printer, X, Check, Utensils } from 'lucide-react';
import { Order } from '../../types';
import { store } from '../../services/store';
import { tr, orderTypeLabel, paymentLabel } from '../../locales';
import { code128Svg } from '../../utils/barcode';

interface ReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const settings = store.settings;
  const branch = store.branches.find(b => b.id === order.branchId) || store.branches[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-slate-900 my-8">
        {/* Actions Bar (Not printed) */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between print:hidden">
          <span className="text-xs font-bold text-slate-700">{tr("Elektron Chek Preview")}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{tr("Chop etish")}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Paper Printable Area */}
        <div id="printable-receipt" className="p-6 font-mono text-xs leading-tight bg-white">
          {/* Logo & Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300">
            <div className="flex items-center justify-center gap-1 text-sm font-black tracking-wider uppercase mb-1">
              <Utensils className="w-4 h-4" />
              {settings.name}
            </div>
            <div className="text-[11px] text-slate-500">{branch.name}</div>
            <div className="text-[10px] text-slate-500">{branch.address}</div>
            <div className="text-[10px] text-slate-500">{tr("Tel:")} {branch.phone}</div>
          </div>

          {/* Meta Info */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">{tr("Chek raqami:")}</span>
              <span className="font-bold">{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{tr("Sana & Vaqt:")}</span>
              <span>{order.createdAt}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{tr("Kassir:")}</span>
              <span>{order.cashierName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{tr("Joylashuv:")}</span>
              <span className="font-bold">{order.tableName || orderTypeLabel(order.type)}</span>
            </div>
            {order.customerName && (
              <div className="flex justify-between">
                <span className="text-slate-500">{tr("Mijoz:")}</span>
                <span>{order.customerName}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="py-3 border-b border-dashed border-slate-300">
            <div className="flex justify-between font-bold text-[10px] text-slate-400 uppercase mb-2">
              <span>{tr("Mahsulot")}</span>
              <span>{tr("Jami")}</span>
            </div>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-medium">
                    <span className="truncate pr-2">{item.productName}</span>
                    <span className="font-semibold whitespace-nowrap">
                      {(item.subtotal || 0).toLocaleString()} UZS
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {item.quantity} x {(item.unitPrice || 0).toLocaleString()} UZS
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>{tr("Oraliq jami:")}</span>
              <span>{(order.subtotal || 0).toLocaleString()} UZS</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>{tr("Chegirma:")}</span>
                <span>-{(order.discount || 0).toLocaleString()} UZS</span>
              </div>
            )}
            {order.tax > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>QQS ({settings.taxRatePercent}%):</span>
                <span>{(order.tax || 0).toLocaleString()} UZS</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-200">
              <span>{tr("TO‘LOV SUMMASI:")}</span>
              <span>{(order.total || 0).toLocaleString()} UZS</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600 pt-1">
              <span>{tr("To‘lov usuli:")}</span>
              <span className="font-bold">{paymentLabel(order.paymentMethod || 'CASH')}</span>
            </div>
          </div>

          {/* Receipt footer & barcode */}
          <div className="pt-4 text-center space-y-2">
            <div className="text-[10px] text-slate-500 whitespace-pre-line leading-relaxed">
              {settings.receiptFooter}
            </div>
            <div className="pt-2 flex flex-col items-center">
              {/* Scannable Code 128 barcode of the order ID */}
              <div
                data-testid="receipt-barcode"
                className="h-12 w-56 [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: code128Svg(order.id, { height: 48 }) }}
              />
              <span className="text-[9px] text-slate-400 mt-1 font-mono">{order.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
