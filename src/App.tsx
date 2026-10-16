import { ErrorBoundary } from './components/ErrorBoundary';
import { checkViewPermission, firstAllowedView, visibleNotifications } from './utils/permissions';
import { t } from './locales';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { store } from './services/store';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { NotificationDrawer } from './components/common/NotificationDrawer';

// Views
import { LoginView } from './components/views/LoginView';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { WelcomeView } from './components/onboarding/WelcomeView';
import { DashboardView } from './components/views/DashboardView';
import { PosView } from './components/views/PosView';
import { OrdersView } from './components/views/OrdersView';
import { TablesView } from './components/views/TablesView';
import { KitchenView } from './components/views/KitchenView';
import { InventoryView } from './components/views/InventoryView';
import { StockView } from './components/views/StockView';
import { ReportsView } from './components/views/ReportsView';
import { EmployeesView } from './components/views/EmployeesView';
import { BranchesView } from './components/views/BranchesView';
import { ExpensesView } from './components/views/ExpensesView';
import { CustomersView } from './components/views/CustomersView';
import { ShiftsView } from './components/views/ShiftsView';
import { AuditLogView } from './components/views/AuditLogView';
import { SettingsView } from './components/views/SettingsView';
import { ProfileView } from './components/views/ProfileView';
import { CustomerMenuView } from './components/views/CustomerMenuView';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(store.isAuthenticated);
  const [currentView, setCurrentView] = useState<string>(() => (store.isAuthenticated ? firstAllowedView() : 'dashboard'));
  const [selectedOrderIdForDetail, setSelectedOrderIdForDetail] = useState<string | undefined>();
  const [isCustomerMenuOpen, setIsCustomerMenuOpen] = useState(false);
  const [customerMenuTableId, setCustomerMenuTableId] = useState<string>('tbl-1');

  // Modals & Drawers
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [darkMode, setDarkMode] = useState(store.settings?.theme === 'dark');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreatingRestaurant, setIsCreatingRestaurant] = useState(false);
  // Bumped on every store change so Header/Sidebar re-read store.currentUser and store.settings
  const [, setStoreVersion] = useState(0);

  // Subscribe to reactive store changes
  useEffect(() => {
    // Check URL params for QR Code menu
    const params = new URLSearchParams(window.location.search);
    if (params.get('menu') === 'true') {
      const tableId = params.get('table') || 'tbl-1';
      setCustomerMenuTableId(tableId);
      setIsCustomerMenuOpen(true);
    }

    const applyTheme = (theme: string) => {
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    
    // Initial theme apply
    if (store.settings?.theme) {
      applyTheme(store.settings.theme);
    }
    
    const unsubscribe = store.subscribe(() => {
      setIsAuthenticated(store.isAuthenticated);
      setStoreVersion(v => v + 1);
      applyTheme(store.settings?.theme || 'light');
    });
    return () => unsubscribe();
  }, []);

  // If the current section becomes unavailable (permissions changed), move to an allowed one
  useEffect(() => {
    if (isAuthenticated && !checkViewPermission(currentView)) setCurrentView(firstAllowedView());
  });

  // Keyboard shortcut Ctrl+K / Cmd+K for Global Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (view: string, detailId?: string) => {
    if (view === 'qr-menu') {
      setIsCustomerMenuOpen(true);
      return;
    }
    if (detailId) {
      setSelectedOrderIdForDetail(detailId);
    } else {
      setSelectedOrderIdForDetail(undefined);
    }
    setCurrentView(view);
  };

  const toggleDarkMode = () => {
    const nextTheme = darkMode ? 'light' : 'dark';
    store.updateSettings({ ...store.settings, theme: nextTheme });
  };

  // If Guest Customer Menu is open
  if (isCustomerMenuOpen) {
    return (
      <CustomerMenuView
        tableId={customerMenuTableId}
        onExit={() => setIsCustomerMenuOpen(false)}
      />
    );
  }

  // Fresh installation: ask whether to sign in to an existing restaurant or create a new one
  if (store.users.length === 0) {
    if (!isCreatingRestaurant) {
      return <WelcomeView onCreateNew={() => setIsCreatingRestaurant(true)} />;
    }
    return (
      <OnboardingWizard
        onBack={() => setIsCreatingRestaurant(false)}
        onComplete={() => {
          setIsCreatingRestaurant(false);
          setIsAuthenticated(true);
          setCurrentView(firstAllowedView());
        }}
      />
    );
  }

  // If not logged in, display Login Screen
  if (!isAuthenticated) {
    return (
      <LoginView
        onSuccessLogin={() => {
          setIsAuthenticated(true);
          // Land on the first section this user is allowed to open
          setCurrentView(firstAllowedView());
        }}
      />
    );
  }

  // Render view router



  const renderCurrentView = () => {
    // Sections the user may not open are never shown: fall back to their first allowed section
    const view = checkViewPermission(currentView) ? currentView : firstAllowedView();
    switch (view) {
      case 'dashboard':
        return <DashboardView />;
      case 'pos':
        return (
          <PosView
            onNavigateToShifts={checkViewPermission('shifts') ? () => setCurrentView('shifts') : undefined}
            onOrderCreated={orderId => {
              // Optionally stay or navigate
            }}
          />
        );
      case 'orders':
        return (
          <OrdersView
            onNavigateToPos={() => setCurrentView('pos')}
            initialSelectedOrderId={selectedOrderIdForDetail}
          />
        );
      case 'tables':
        return (
          <TablesView
            onNavigateToPosWithTable={tableId => {
              setCurrentView('pos');
            }}
            onOpenCustomerMenu={tableId => {
              setCustomerMenuTableId(tableId);
              setIsCustomerMenuOpen(true);
            }}
          />
        );
      case 'kitchen':
        return <KitchenView />;
      case 'inventory':
        return <StockView />;
      case 'products':
        return <InventoryView />;
      case 'reports':
      case 'finance':
        return <ReportsView />;
      case 'branches':
        return <BranchesView />;
      case 'employees':
        return <EmployeesView />;
      case 'expenses':
        return <ExpensesView />;
      case 'customers':
        return <CustomersView />;
      case 'shifts':
        return <ShiftsView />;
      case 'audit':
        return <AuditLogView />;
      case 'profile':
        return <ProfileView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] lg:pl-64">
      {/* Top Header */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenSearch={() => setIsSearchOpen(true)}
        onToggleNotifications={() => setIsNotificationsOpen(prev => !prev)}
        unreadNotificationsCount={visibleNotifications().filter(n => !n.read).length}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
      />

      {/* Main Workspace with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto"
            >
              {renderCurrentView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>


      {/* Global Quick Search Modal (Cmd+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Real-time Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
