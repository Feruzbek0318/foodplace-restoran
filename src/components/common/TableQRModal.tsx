import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, QrCode, ExternalLink, Printer, Wifi, Utensils } from 'lucide-react';
import { RestaurantTable } from '../../types';
import { store } from '../../services/store';
import { tr } from '../../locales';

interface TableQRModalProps {
  table: RestaurantTable | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenCustomerMenu?: (tableId: string) => void;
}

export const TableQRModal: React.FC<TableQRModalProps> = ({
  table,
  isOpen,
  onClose,
  onOpenCustomerMenu,
}) => {
  const [qrSvg, setQrSvg] = useState('');
  const menuUrl = table ? `${window.location.origin}/?menu=true&table=${table.id}` : '';

  // Real, scannable QR code pointing to this table's digital menu
  useEffect(() => {
    if (!isOpen || !menuUrl) return;
    QRCode.toString(menuUrl, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0f172a', light: '#ffffff' } })
      .then(setQrSvg)
      .catch(() => setQrSvg(''));
  }, [isOpen, menuUrl]);

  if (!isOpen || !table) return null;

  const settings = store.settings;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-slate-900 dark:text-white">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold">{tr("Stol QR Kodu")}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Card Presentation */}
        <div className="p-6 text-center space-y-4">
          <div className="inline-block p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-md">
            {qrSvg ? (
              <div className="w-44 h-44 mx-auto [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            ) : (
              <div className="w-44 h-44 mx-auto bg-slate-100 rounded-lg animate-pulse" />
            )}
            <div className="text-[11px] font-bold text-slate-800 mt-2 flex items-center justify-center gap-1">
              <Utensils className="w-3 h-3 text-blue-600" />
              {table.name} • {settings.name}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {tr("Elektron menyu QR-kodi")}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {tr("Mehmonlar telefon kamerasini ushbu QR-kodga qaratish orqali menyuni ko‘rishlari va buyurtma berishlari mumkin.")}
            </p>
          </div>

          {/* Wi-Fi credentials info for guest convenience */}
          {settings.wifiName && (
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-3 text-xs text-slate-600 dark:text-slate-300">
              <Wifi className="w-4 h-4 text-blue-500" />
              <span>Wi-Fi: <strong>{settings.wifiName}</strong></span>
              <span>{tr("Parol:")} <strong>{settings.wifiPassword}</strong></span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                onClose();
                onOpenCustomerMenu?.(table.id);
              }}
              className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-blue-600/30 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{tr("Menyuni ko‘rish")}</span>
            </button>
            <button
              onClick={handlePrint}
              className="py-2.5 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{tr("Chop etish")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
