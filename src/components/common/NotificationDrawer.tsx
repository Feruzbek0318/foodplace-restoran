import React from 'react';
import { Bell, CheckCheck, X, ShoppingBag, ChefHat, AlertTriangle, Clock, Shield } from 'lucide-react';
import { store } from '../../services/store';
import { NotificationItem } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { tr, trMessage } from '../../locales';
import { visibleNotifications } from '../../utils/permissions';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  if (!isOpen) return null;

  const notifications = visibleNotifications();

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'ORDER':
        return <ShoppingBag className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'KITCHEN':
        return <ChefHat className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'STOCK':
        return <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'SHIFT':
        return <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'SECURITY':
        return <Shield className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-hidden"
        >
          <div onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-screen max-w-md bg-white dark:bg-slate-800 shadow-2xl border-l border-slate-200 dark:border-slate-700 flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {tr("Bildirishnomalar")}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => store.markAllNotificationsRead()}
                    className="p-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg flex items-center gap-1 transition"
                    title={tr("Barchasini o‘qilgan deb belgilash")}
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span className="hidden sm:inline">{tr("O‘qildi")}</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <Bell className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <div className="text-sm font-medium">{tr("Hozircha bildirishnoma yo‘q")}</div>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (n.linkTo) {
                          onNavigate(n.linkTo);
                          onClose();
                        }
                      }}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex gap-3 ${
                        n.read
                          ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/50 opacity-75'
                          : 'bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-900/50 shadow-xs'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {trMessage(n.title)}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                            {trMessage(n.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {trMessage(n.message)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
