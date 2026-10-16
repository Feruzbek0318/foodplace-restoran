import React, { useState } from 'react';
import {
  Utensils,
  Search,
  Wifi,
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  Plus,
  Minus,
} from 'lucide-react';
import { store } from '../../services/store';
import { Product, OrderItem } from '../../types';
import { INITIAL_CATEGORIES } from '../../data/mockData';
import { tr, zoneLabel } from '../../locales';

interface CustomerMenuViewProps {
  tableId?: string;
  onExit: () => void;
}

export const CustomerMenuView: React.FC<CustomerMenuViewProps> = ({
  tableId,
  onExit,
}) => {
  const settings = store.settings;
  const table = store.tables.find(t => t.id === tableId) || store.tables[0];

  const [selectedCategory, setSelectedCategory] = useState('cat-all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{ product: Product; qty: number }[]>([]);
  const [orderSent, setOrderSent] = useState(false);

  const products = store.products.filter(p => p.isActive);

  const filteredProducts = products.filter(p => {
    const matchesCategory =
      selectedCategory === 'cat-all' || p.categoryId === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(i => {
          if (i.product.id === productId) {
            const next = i.qty + delta;
            return next > 0 ? { ...i, qty: next } : null;
          }
          return i;
        })
        .filter(Boolean) as { product: Product; qty: number }[]
    );
  };

  const totalAmount = cart.reduce((sum, i) => sum + (i.product.salePrice || i.product.price || 0) * i.qty, 0);

  const handleSendOrder = () => {
    if (cart.length === 0) return;

    const orderItems: OrderItem[] = cart.map(i => ({
      id: `item-${Date.now()}-${Math.random()}`,
      productId: i.product.id,
      productName: i.product.name,
      unitPrice: i.product.salePrice || i.product.price || 0,
      quantity: i.qty,
      subtotal: (i.product.salePrice || i.product.price || 0) * i.qty,
    }));

    store.createOrder({
      type: 'DINE_IN',
      tableId: table.id,
      tableName: table.name,
      customerName: 'Mehmon (QR)',
      items: orderItems,
      subtotal: totalAmount,
      discount: 0,
      tax: 0,
      total: totalAmount,
      paymentStatus: 'PENDING',
      notes: 'Mehmon tomonidan QR menyu orqali yuborildi',
    });

    setOrderSent(true);
    setCart([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif] pb-24">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{tr("Admin panelga qaytish")}</span>
          </button>

          <div className="text-center">
            <div className="text-sm font-black flex items-center gap-1">
              <Utensils className="w-4 h-4 text-blue-600" />
              <span>{settings.name}</span>
            </div>
            <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
              {table.name} ({zoneLabel(table.zone)})
            </div>
          </div>

          <div className="text-xs font-bold text-slate-500">
            {cart.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[11px]">
                {cart.reduce((s, i) => s + i.qty, 0)} {tr("ta")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Guest Welcome Banner & Wi-Fi */}
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {settings.wifiName && (
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
              <Wifi className="w-4 h-4" />
              <span>
                {tr("Restoran Wi-Fi:")} <strong>{settings.wifiName}</strong>
              </span>
            </div>
            <div className="text-blue-700 dark:text-blue-400 font-mono">
              {tr("Parol:")} <strong>{settings.wifiPassword}</strong>
            </div>
          </div>
        )}

        {/* Order Sent Alert */}
        {orderSent && (
          <div className="p-4 rounded-2xl bg-emerald-500 text-white shadow-lg flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2 text-xs font-bold">
              <CheckCircle2 className="w-5 h-5" />
              <span>{tr("Buyurtmangiz oshxonaga qabul qilindi! Tez orada tayyorlanadi.")}</span>
            </div>
            <button
              onClick={() => setOrderSent(false)}
              className="text-xs underline opacity-80 hover:opacity-100"
            >
              {tr("Yopish")}
            </button>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={tr("Taom yoki ichimlik nomini qidiring...")}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs shadow-xs focus:outline-hidden"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {INITIAL_CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === c.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {tr(c.name)}
            </button>
          ))}
        </div>

        {/* Dishes List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredProducts.map(p => {
            const inCart = cart.find(i => i.product.id === p.id);
            return (
              <div
                key={p.id}
                className="p-3.5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex gap-3.5"
              >
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-24 h-24 rounded-2xl object-cover bg-slate-100 shrink-0"
                />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                      {p.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                      {tr("Mazali va sifatli mahsulotlardan tayyorlangan restoran taomi.")}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                      {(p.salePrice || p.price || 0).toLocaleString()} UZS
                    </span>

                    {inCart ? (
                      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-xl">
                        <button
                          onClick={() => updateQty(p.id, -1)}
                          className="p-0.5 text-slate-500 hover:text-slate-800"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{inCart.qty}</span>
                        <button
                          onClick={() => updateQty(p.id, 1)}
                          className="p-0.5 text-slate-500 hover:text-slate-800"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(p)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                      >
                        {tr("+ Qo‘shish")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Bottom Cart Bar (if items in cart) */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-2xl z-50">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] text-slate-400">{tr("Jami buyurtma:")}</div>
              <div className="text-base font-black text-slate-900 dark:text-white">
                {totalAmount.toLocaleString()} UZS
              </div>
            </div>

            <button
              onClick={handleSendOrder}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-600/30 flex items-center gap-2 transition"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{tr("Oshxonaga yuborish (")}{cart.reduce((s, i) => s + i.qty, 0)} {tr("ta)")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
