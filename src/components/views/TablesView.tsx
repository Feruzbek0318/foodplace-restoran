import React, { useState } from 'react';
import { store } from '../../services/store';
import { RestaurantTable } from '../../types';
import { TablesMap } from './TablesMap';
import { TableQRModal } from '../common/TableQRModal';
import { tr } from '../../locales';
import { hasPermission } from '../../utils/permissions';

interface TablesViewProps {
  onNavigateToPosWithTable?: (tableId: string) => void;
  onOpenCustomerMenu?: (tableId: string) => void;
}

export const TablesView: React.FC<TablesViewProps> = ({
  onNavigateToPosWithTable,
  onOpenCustomerMenu,
}) => {
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [qrTable, setQrTable] = useState<RestaurantTable | null>(null);

  const tables = store.tables;
  const user = store.currentUser;
  const canEdit = user?.role === 'SUPER_ADMIN' || user?.permissions?.includes('tables_manage') || false;

  const handleTableClick = (table: RestaurantTable) => {
    setSelectedTable(table);
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {tr("Stollar Xaritasi")}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {tr("Stollarni interaktiv tarzda boshqaring")}
        </p>
      </div>

      <TablesMap tables={tables} onTableClick={handleTableClick} canEdit={canEdit} />

      {/* Selected Table Action Modal */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 relative">
            <button
              onClick={() => setSelectedTable(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full"
            >
              X
            </button>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-4">
              {tr("Stol")} {selectedTable.number}
            </h2>
            <div className="space-y-3">
              {hasPermission('POS') && (
              <button
                onClick={() => {
                  if (onNavigateToPosWithTable) onNavigateToPosWithTable(selectedTable.id);
                  setSelectedTable(null);
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
              >
                {tr("Buyurtma ochish (POS)")}
              </button>
              )}
              <button
                onClick={() => {
                  setQrTable(selectedTable);
                  setSelectedTable(null);
                }}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
              >
                {tr("QR Kodni ko'rish")}
              </button>
            </div>
          </div>
        </div>
      )}

      {qrTable && (
        <TableQRModal
          isOpen
          table={qrTable}
          onClose={() => setQrTable(null)}
          onOpenCustomerMenu={onOpenCustomerMenu}
        />
      )}
    </div>
  );
};
