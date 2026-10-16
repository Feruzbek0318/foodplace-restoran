import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowRight,
  Flame,
  Volume2,
  Check,
} from 'lucide-react';
import { store } from '../../services/store';
import { Order, OrderStatus } from '../../types';
import { tr, orderTypeLabel } from '../../locales';

// createdAt is stored as a locale string like "2026-10-15 10:14:33"
const formatElapsed = (createdAt: string | undefined, now: number) => {
  if (!createdAt) return '--:--';
  const started = new Date(createdAt.replace(' ', 'T')).getTime();
  if (Number.isNaN(started)) return '--:--';
  const totalSec = Math.max(0, Math.floor((now - started) / 1000));
  const m = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

export const KitchenView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>((store.orders || []));
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll/sync from reactive store
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setOrders([...(store.orders || [])]);
    });
    return () => unsubscribe();
  }, []);

  const newOrders = orders.filter(o => o.status === 'NEW');
  const preparingOrders = orders.filter(o => o.status === 'PREPARING');
  const readyOrders = orders.filter(o => o.status === 'READY');

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      // AudioContext unavailable
    }
  };

  const handleUpdateStatus = (orderId: string, status: OrderStatus) => {
    playChime();
    store.updateOrderStatus(orderId, status);
  };

  return (
    <div className="space-y-6">
      {/* KDS Header (Matching Screen 6) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/30">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {tr("Oshxona (KDS)")}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {tr("Real-time buyurtmalar ro‘yxati, tayyorlash vaqti va oshxona nazorati")}
            </p>
          </div>
        </div>

        {/* Live Counters and Sound toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              soundEnabled
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>{soundEnabled ? tr("Ovoz yoqilgan") : tr("Ovoz o‘chiq")}</span>
          </button>
        </div>
      </div>

      {/* 3 Status Columns Kanban Grid (Matching Screen 6) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Column 1: Yangi Buyurtmalar (NEW) */}
        <div className="flex flex-col rounded-3xl bg-slate-100/70 dark:bg-slate-800/50 p-4 border border-slate-200/80 dark:border-slate-700/80">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></span>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {tr("Yangi buyurtmalar")}
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
              {newOrders.length}
            </span>
          </div>

          <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[calc(100vh-16rem)]">
            {newOrders.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-slate-400">
                <ChefHat className="w-8 h-8 opacity-30 mb-2" />
                <span className="text-xs">{tr("Yangi buyurtmalar yo‘q")}</span>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {newOrders.map(order => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    key={order.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-blue-500/40 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {order.id}
                        </span>
                        <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                          {order.tableName || orderTypeLabel(order.type)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{order.createdAt?.split(' ')[1] || '02:45'}</span>
                      </div>
                    </div>

                    {/* Dishes Items */}
                    <div className="space-y-1.5 py-1 border-y border-slate-100 dark:border-slate-700 text-xs">
                      {(order.items || []).map(item => (
                        <div key={item.id} className="flex items-center justify-between font-medium">
                          <span className="text-slate-800 dark:text-slate-200">
                            {item.quantity}x {item.productName}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-[11px] text-amber-800 dark:text-amber-300">
                        <strong>{tr("Izoh:")}</strong> {order.notes}
                      </div>
                    )}

                    <button
                      onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-blue-600/30 transition cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{tr("Qabul qilish & Boshlash")}</span>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Column 2: Tayyorlanmoqda (PREPARING) */}
        <div className="flex flex-col rounded-3xl bg-slate-100/70 dark:bg-slate-800/50 p-4 border border-slate-200/80 dark:border-slate-700/80">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {tr("Tayyorlanmoqda")}
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
              {preparingOrders.length}
            </span>
          </div>

          <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[calc(100vh-16rem)]">
            {preparingOrders.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-slate-400">
                <Flame className="w-8 h-8 opacity-30 mb-2" />
                <span className="text-xs">{tr("Hozirda pishirilayotgan taom yo‘q")}</span>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {preparingOrders.map(order => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    key={order.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-amber-500/40 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {order.id}
                        </span>
                        <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                          {order.tableName || orderTypeLabel(order.type)}
                        </div>
                      </div>
                      {/* Live elapsed indicator */}
                      <div className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatElapsed(order.createdAt, now)}</span>
                      </div>
                    </div>

                    {/* Dishes Items */}
                    <div className="space-y-1.5 py-1 border-y border-slate-100 dark:border-slate-700 text-xs">
                      {(order.items || []).map(item => (
                        <div key={item.id} className="flex items-center justify-between font-medium">
                          <span className="text-slate-800 dark:text-slate-200">
                            {item.quantity}x {item.productName}
                          </span>
                          <Check className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-[11px] text-amber-800 dark:text-amber-300">
                        <strong>{tr("Izoh:")}</strong> {order.notes}
                      </div>
                    )}

                    <button
                      onClick={() => handleUpdateStatus(order.id, 'READY')}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/30 transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{tr("Tayyor bo‘ldi")}</span>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Column 3: Tayyor (READY) */}
        <div className="flex flex-col rounded-3xl bg-slate-100/70 dark:bg-slate-800/50 p-4 border border-slate-200/80 dark:border-slate-700/80">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {tr("Tayyor (Olib ketishga)")}
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
              {readyOrders.length}
            </span>
          </div>

          <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[calc(100vh-16rem)]">
            {readyOrders.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 opacity-30 mb-2" />
                <span className="text-xs">{tr("Tayyor kutayotgan buyurtma yo‘q")}</span>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {readyOrders.map(order => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    key={order.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-emerald-500/40 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {order.id}
                        </span>
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {order.tableName || orderTypeLabel(order.type)}
                        </div>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                        {tr("Ofitsiant chaqirildi")}
                      </span>
                    </div>

                    {/* Dishes Items */}
                    <div className="space-y-1 py-1 border-y border-slate-100 dark:border-slate-700 text-xs">
                      {(order.items || []).map(item => (
                        <div key={item.id} className="text-slate-700 dark:text-slate-300 font-medium">
                          {item.quantity}x {item.productName}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleUpdateStatus(order.id, 'SERVED')}
                      className="w-full py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <span>{tr("Mijozga berildi")}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
