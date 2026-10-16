import React, { useEffect, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Boxes, ClipboardCheck, Search, Trash2 } from 'lucide-react';
import { store } from '../../services/store';
import { MovementType, Product } from '../../types';
import { tr, trMessage, unitLabel } from '../../locales';

type Action = MovementType;

const ACTIONS: Array<{ type: Action; label: string; icon: React.ElementType; className: string }> = [
  { type: 'IN', label: 'Kirim', icon: ArrowDownCircle, className: 'bg-emerald-600 hover:bg-emerald-700' },
  { type: 'OUT', label: 'Chiqim', icon: ArrowUpCircle, className: 'bg-blue-600 hover:bg-blue-700' },
  { type: 'WASTE', label: 'Hisobdan chiqarish', icon: Trash2, className: 'bg-rose-600 hover:bg-rose-700' },
  { type: 'ADJUSTMENT', label: 'Inventarizatsiya', icon: ClipboardCheck, className: 'bg-slate-700 hover:bg-slate-800' },
];

const MOVEMENT_LABELS: Record<string, string> = {
  IN: 'Kirim',
  OUT: 'Chiqim',
  WASTE: 'Hisobdan chiqarish',
  ADJUSTMENT: 'Inventarizatsiya',
};

const stockState = (p: Product) =>
  p.stock <= 0 ? 'out' : p.minStock > 0 && p.stock <= p.minStock ? 'low' : 'ok';

export const StockView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([...store.products]);
  const [movements, setMovements] = useState([...store.inventoryMovements]);
  const [search, setSearch] = useState('');
  const [onlyLow, setOnlyLow] = useState(false);
  const [dialog, setDialog] = useState<{ product: Product; type: Action } | null>(null);
  const [quantity, setQuantity] = useState(0);
  const [minStock, setMinStock] = useState(0);
  const [reason, setReason] = useState('');

  useEffect(() => {
    return store.subscribe(() => {
      setProducts([...store.products]);
      setMovements([...store.inventoryMovements]);
    });
  }, []);

  const lowCount = products.filter(p => stockState(p) !== 'ok').length;
  const visible = products.filter(
    p => p.name.toLowerCase().includes(search.toLowerCase()) && (!onlyLow || stockState(p) !== 'ok')
  );

  const openDialog = (product: Product, type: Action) => {
    setDialog({ product, type });
    setQuantity(type === 'ADJUSTMENT' ? product.stock : 0);
    setMinStock(product.minStock || 0);
    setReason('');
  };

  const submit = () => {
    if (!dialog) return;
    const { product, type } = dialog;
    if (type !== 'ADJUSTMENT' && quantity <= 0) return;
    if (type === 'ADJUSTMENT' && quantity < 0) return;
    store.addInventoryMovement({
      productId: product.id,
      type,
      quantity,
      reason: reason.trim(),
    });
    if (minStock !== (product.minStock || 0)) {
      store.updateProduct(product.id, { minStock: Math.max(0, minStock) });
    }
    setDialog(null);
  };

  const badge = (p: Product) => {
    const state = stockState(p);
    const styles = {
      ok: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      low: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      out: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    }[state];
    const label = { ok: 'Yetarli', low: 'Kam qoldi', out: 'Tugagan' }[state];
    return <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${styles}`}>{tr(label)}</span>;
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{tr('Omborxona')}</h1>
          <p className="text-sm text-slate-500">{tr('Mahsulot qoldiqlari, kirim-chiqim va inventarizatsiya')}</p>
        </div>
        <button
          onClick={() => setOnlyLow(v => !v)}
          className={`px-4 py-2 rounded-xl text-sm font-bold border transition ${
            onlyLow
              ? 'bg-amber-500 text-white border-amber-500'
              : 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700'
          }`}
        >
          {tr('Kam qolganlar')}: {lowCount}
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={tr('Mahsulot qidirish...')}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3">{tr('Mahsulot')}</th>
              <th className="px-4 py-3">{tr('Qoldiq')}</th>
              <th className="px-4 py-3">{tr('Minimal qoldiq')}</th>
              <th className="px-4 py-3">{tr('Holat')}</th>
              <th className="px-4 py-3 text-right">{tr('Amallar')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {visible.map(p => (
              <tr key={p.id} className="text-slate-700 dark:text-slate-300">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{p.name}</td>
                <td className="px-4 py-3 font-bold">{p.stock} {unitLabel(p.unit)}</td>
                <td className="px-4 py-3">{p.minStock || 0}</td>
                <td className="px-4 py-3">{badge(p)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5 flex-wrap">
                    {ACTIONS.map(a => (
                      <button
                        key={a.type}
                        onClick={() => openDialog(p, a.type)}
                        title={tr(a.label)}
                        className={`p-2 rounded-lg text-white ${a.className}`}
                      >
                        <a.icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  <Boxes className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  {tr('Mahsulot topilmadi')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <h2 className="font-bold text-slate-900 dark:text-white mb-3">{tr('Ombor harakatlari tarixi')}</h2>
        {movements.length === 0 ? (
          <p className="text-sm text-slate-500">{tr('Hali harakatlar yo‘q')}</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {movements.slice(0, 30).map(m => (
              <li key={m.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
                <span className="text-slate-900 dark:text-white font-medium">
                  {m.productName} · {tr(MOVEMENT_LABELS[m.type] || m.type)}{' '}
                  <strong>
                    {m.type === 'ADJUSTMENT' ? '=' : m.type === 'IN' ? '+' : '−'}
                    {m.quantity} {unitLabel(m.unit)}
                  </strong>
                </span>
                <span className="text-xs text-slate-500">
                  {m.reason ? `${trMessage(m.reason)} · ` : ''}{m.createdBy} · {m.createdAt}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {dialog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {tr(MOVEMENT_LABELS[dialog.type])}: {dialog.product.name}
            </h2>
            <p className="text-sm text-slate-500">
              {tr('Hozirgi qoldiq')}: <strong>{dialog.product.stock} {unitLabel(dialog.product.unit)}</strong>
            </p>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                {dialog.type === 'ADJUSTMENT' ? tr('Haqiqiy qoldiq') : tr('Miqdor')}
              </label>
              <input
                type="number"
                min={0}
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value) || 0)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{tr('Minimal qoldiq')}</label>
              <input
                type="number"
                min={0}
                value={minStock}
                onChange={e => setMinStock(Number(e.target.value) || 0)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{tr('Izoh')}</label>
              <input
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setDialog(null)} className="px-5 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                {tr('Bekor qilish')}
              </button>
              <button onClick={submit} className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                {tr('Saqlash')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
