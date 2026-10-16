import React, { useState } from 'react';
import { Menu, Search, Bell, Moon, Sun, User, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { store } from '../../services/store';
import { useTranslation } from '../../hooks/useTranslation';
import { AsyncImage } from './AsyncImage';
import { tr, roleLabel } from '../../locales';
import { checkViewPermission } from '../../utils/permissions';

interface Props {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenSearch: () => void;
  onToggleNotifications: () => void;
  unreadNotificationsCount: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<Props> = ({
  currentView,
  onNavigate,
  onOpenSearch,
  onToggleNotifications,
  unreadNotificationsCount,
  darkMode,
  onToggleDarkMode,
  onToggleMobileMenu
}) => {
  const { t } = useTranslation();
  const user = store.currentUser;
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 z-30 sticky top-0 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <button onClick={onToggleMobileMenu} className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden">
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Real Search Button */}
        <button 
          onClick={onOpenSearch}
          className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl w-96 max-w-md border border-slate-200 dark:border-slate-700 hover:border-blue-500/50 transition-all text-slate-500 text-sm text-left"
        >
          <Search className="w-4 h-4" />
          <span className="flex-1">{t('search')} (Ctrl+K)</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button 
          onClick={onToggleNotifications}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>

        {/* Theme Toggle */}
        <button onClick={onToggleDarkMode} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:block">
          {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

        {/* Profile */}
        <div className="relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-sm shrink-0 overflow-hidden">
              {user?.avatarUrl ? <AsyncImage srcId={user.avatarUrl} className="w-full h-full object-cover" /> : user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block pr-2">
              <div className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">{user?.fullName}</div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-none">{roleLabel(user?.role)}</div>
            </div>
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
                <button onClick={() => { setShowProfileMenu(false); onNavigate('profile'); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <User className="w-4 h-4" />
                  {tr("Mening profilim")}
                </button>
                {checkViewPermission('settings') && (
                  <button onClick={() => { setShowProfileMenu(false); onNavigate('settings'); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <SettingsIcon className="w-4 h-4" />
                  {tr("Sozlamalar")}
                </button>
                )}
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
                <button onClick={() => { setShowProfileMenu(false); store.logout(); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10">
                  <LogOut className="w-4 h-4" />
                  {tr("Tizimdan chiqish")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
