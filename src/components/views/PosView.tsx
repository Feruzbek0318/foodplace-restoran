import { AsyncImage } from '../../components/common/AsyncImage';
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Utensils,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle,
  Receipt,
  User,
  Hash,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { store } from '../../services/store';
import { Product, OrderItem, OrderType, PaymentMethod, RestaurantTable } from '../../types';
import { INITIAL_CATEGORIES } from '../../data/mockData';
import { ReceiptModal } from '../common/ReceiptModal';
import { tr, unitLabel, zoneLabel } from '../../locales';
import { calcOrderTotals, changeDue } from '../../utils/calc';

interface PosViewProps {
  onOrderCreated?: (orderId: string) => void;
  onNavigateToShifts?: () => void;
}

export const PosView: React.FC<PosViewProps> = ({ onOrderCreated, onNavigateToShifts }) => {
  // Payments are only accepted while a cashier shift is open, so cash is always accounted for
  const activeShift = store.getActiveShift();
  const [selectedCategory, setSelectedCategory] = useState('cat-all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('DINE_IN');
  const [selectedTableId, setSelectedTableId] = useState<string>('tbl-1');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Cart items state
  const [cart, setCart] = useState<OrderItem[]>([]);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashGiven, setCashGiven] = useState<number>(0);

  // Created Order for Receipt
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const products = store.products.filter(p => p.isAvailable !== false);
  const tables = store.tables;

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory =
        selectedCategory === 'cat-all' || p.categoryId === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Add to cart
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unitPrice,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random()}`,
          productId: product.id,
          productName: product.name,
          unitPrice: product.salePrice || product.price || 0,
          quantity: 1,
          subtotal: product.salePrice || product.price || 0,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return { ...item, quantity: newQty, subtotal: newQty * item.unitPrice };
          }
          return item;
        })
        .filter(Boolean) as OrderItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setOrderNotes('');
    setDiscountPercent(0);
  };

  // Calculations
  const taxRate = store.settings.taxRatePercent || 0;
  const { subtotal, discount: discountAmount, tax: taxAmount, total } = calcOrderTotals(cart, discountPercent, taxRate);
  const cashChange = changeDue(cashGiven, total);

  // Selected table info
  const selectedTable = tables.find(t => t.id === selectedTableId);

  // Submit Order & Process Payment
  const handleProcessOrder = () => {
    if (cart.length === 0 || !store.getActiveShift()) return;

    const newOrder = store.createOrder({
      type: orderType,
      tableId: orderType === 'DINE_IN' ? selectedTableId : undefined,
      tableName: orderType === 'DINE_IN' ? selectedTable?.name : undefined,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      items: cart,
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total,
      paymentMethod: selectedPaymentMethod,
      paymentStatus: 'PAID',
      notes: orderNotes.trim() || undefined,
    });

    setCompletedOrder(newOrder);
    setShowPaymentModal(false);
    setShowReceipt(true);
    clearCart();

    if (onOrderCreated) {
      onOrderCreated(newOrder.id);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[calc(100vh-6.5rem)]">
      {/* Left Column: Categories + Products Catalog (65%) */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs overflow-hidden">
        {/* Top Filter Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={tr("Mahsulot qidirish...")}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-700/60 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden border border-transparent focus:border-blue-500 transition"
            />
          </div>

          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {tr("Mavjud mahsulotlar:")} <span className="font-bold text-slate-800 dark:text-slate-200">{filteredProducts.length}</span> {tr("ta")}
          </div>
        </div>

        {/* Categories Tabs Scrollable */}
        <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {INITIAL_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tr(cat.name)}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <Utensils className="w-10 h-10 mb-2 opacity-30" />
              <div className="text-sm font-medium">{tr("Mahsulot topilmadi")}</div>
              <div className="text-xs text-slate-500">{tr("Boshqa toifani tanlang yoki qidiruv so‘zini o‘zgartiring")}</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredProducts.map(product => {
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock > 0 && product.stock <= product.minStock;

                return (
                  <div
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    className={`group relative p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isOutOfStock
                        ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed'
                        : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 hover:border-blue-500 hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Product Image */}
                      <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 mb-2.5">
                        <AsyncImage
                          srcId={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        {isLowStock && (
                          <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                            {tr("Kam qoldi")}
                          </span>
                        )}
                        {isOutOfStock && (
                          <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500 text-white shadow-xs">
                            {tr("Tugagan")}
                          </span>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                        {product.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {product.barcode ? `${tr('Kod:')} ${product.barcode}` : `${tr('Qoldiq:')} ${product.stock ?? 0}`}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                      <div>
                        <div className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                          {(product.salePrice || product.price || 0).toLocaleString()} UZS
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {tr("Qoldiq:")} {product.stock} {unitLabel(product.unit)}
                        </div>
                      </div>

                      <button
                        disabled={isOutOfStock}
                        className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/40 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center transition shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: CURRENT ORDER Cart (35%) - Matching Screen 3 */}
      <div className="w-full lg:w-96 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs flex flex-col justify-between overflow-hidden">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span>{tr("Joriy buyurtma")}</span>
              {cart.length > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                  {cart.length}
                </span>
              )}
            </div>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
              >
                {tr("Tozalash")}
              </button>
            )}
          </div>

          {/* Dining Type & Table Selector */}
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setOrderType('DINE_IN')}
                className={`py-1.5 rounded-lg transition ${
                  orderType === 'DINE_IN'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tr("Zalda")}
              </button>
              <button
                onClick={() => setOrderType('TAKEAWAY')}
                className={`py-1.5 rounded-lg transition ${
                  orderType === 'TAKEAWAY'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tr("Olib ketish")}
              </button>
              <button
                onClick={() => setOrderType('DELIVERY')}
                className={`py-1.5 rounded-lg transition ${
                  orderType === 'DELIVERY'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tr("Yetkazish")}
              </button>
            </div>

            {orderType === 'DINE_IN' && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedTableId}
                  onChange={e => setSelectedTableId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden"
                >
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({zoneLabel(t.zone)}) - {t.status === 'AVAILABLE' ? tr("🟢 Bo‘sh") : tr("🔴 Band")}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Cart Item Rows */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
              <Receipt className="w-10 h-10 mb-2 opacity-30" />
              <div className="text-xs font-bold">{tr("Buyurtma hali bo‘sh")}</div>
              <div className="text-[11px] text-slate-500 text-center max-w-[200px] mt-1">
                {tr("Chapdagi mahsulotlarni tanlang va savatga qo‘shing")}
              </div>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {cart.map(item => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  key={item.productId}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.productName}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {(item.unitPrice || 0).toLocaleString()} UZS
                    </div>
                  </div>

                  {/* Quantity Buttons */}
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 shadow-xs">
                    <button
                      onClick={() => updateQuantity(item.productId, -1)}
                      className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 p-0.5"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center text-slate-800 dark:text-slate-200">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, 1)}
                      className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 p-0.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right min-w-[70px]">
                    <div className="text-xs font-black text-slate-900 dark:text-white">
                      {(item.subtotal || 0).toLocaleString()}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-[10px] text-rose-500 hover:text-rose-600 font-medium cursor-pointer"
                    >
                      {tr("O‘chirish")}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Cart Calculations & Payment Trigger */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80 space-y-3">
          {/* Optional order notes & discount */}
          {cart.length > 0 && (
            <div className="space-y-2">
              <input
                type="text"
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                placeholder={tr("Oshxona uchun izoh (masalan: Kam tuzli...)")}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-700 rounded-lg text-xs border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden"
              />

              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <Tag className="w-3 h-3" /> {tr("Chegirma:")}
                </span>
                <div className="flex gap-1">
                  {[0, 5, 10, 15].map(pct => (
                    <button
                      key={pct}
                      onClick={() => setDiscountPercent(pct)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        discountPercent === pct
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pricing breakdown */}
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-1">
            <div className="flex justify-between">
              <span>{tr("Jami (Oraliq):")}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {(subtotal || 0).toLocaleString()} UZS
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>{tr("Chegirma (")}{discountPercent}%):</span>
                <span>-{(discountAmount || 0).toLocaleString()} UZS</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between text-xs text-slate-500">
                <span>{tr("QQS / Xizmat (")}{taxRate}%):</span>
                <span>+{taxAmount.toLocaleString()} UZS</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-1.5 border-t border-slate-200 dark:border-slate-700">
              <span>{tr("To‘lov summasi:")}</span>
              <span className="text-blue-600 dark:text-blue-400">
                {(total || 0).toLocaleString()} UZS
              </span>
            </div>
          </div>

          {!activeShift && (
            <div className="mb-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3">
              <span>{tr("To‘lov qabul qilish uchun avval smena oching")}</span>
              {onNavigateToShifts && (
                <button onClick={onNavigateToShifts} className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold">
                  {tr("Smena ochish")}
                </button>
              )}
            </div>
          )}

          {/* Main Action Button */}
          <button
            disabled={cart.length === 0 || !activeShift}
            onClick={() => {
              setCashGiven(total);
              setShowPaymentModal(true);
            }}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-extrabold rounded-2xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <Banknote className="w-4 h-4" />
            <span>{tr("To‘lov qilish")}</span>
          </button>
        </div>
      </div>

      {/* Payment Processing Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {tr("To‘lovni qabul qilish")}
                </h3>
                <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                  {(total || 0).toLocaleString()} UZS
                </span>
              </div>

              {/* Payment Methods Options */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">{tr("To‘lov usulini tanlang:")}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'CASH', label: tr("Naqd"), icon: Banknote },
                    { id: 'CARD', label: tr("Karta"), icon: CreditCard },
                    { id: 'CLICK', label: 'Click', icon: Smartphone },
                    { id: 'PAYME', label: 'Payme', icon: Smartphone },
                    { id: 'UZUM', label: 'Uzum', icon: Smartphone },
                    { id: 'MIXED', label: tr("Aralash"), icon: Banknote },
                  ].map(method => {
                    const Icon = method.icon;
                    const isSelected = selectedPaymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedPaymentMethod(method.id as PaymentMethod)}
                        className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash Tendered and Change Calculation */}
              <AnimatePresence mode="popLayout">
                {selectedPaymentMethod === 'CASH' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {tr("Mijoz bergan naqd summa:")}
                      </span>
                      <input
                        type="number"
                        value={cashGiven}
                        onChange={e => setCashGiven(Number(e.target.value))}
                        className="w-32 px-3 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-600 text-right text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Quick denomination buttons */}
                    <div className="flex gap-1.5 overflow-x-auto py-1">
                      {[50000, 100000, 200000].map(amt => (
                        <button
                          key={amt}
                          onClick={() => setCashGiven(amt)}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                        >
                          {(amt || 0).toLocaleString()} UZS
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-600 font-bold">
                      <span className="text-slate-600 dark:text-slate-400">{tr("Qaytim (Sdacha):")}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 text-sm">
                        {(cashChange || 0).toLocaleString()} UZS
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition"
                >
                  {tr("Bekor qilish")}
                </button>
                <button
                  onClick={handleProcessOrder}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{tr("To‘lovni yakunlash")}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        order={completedOrder}
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
      />
    </div>
  );
};
