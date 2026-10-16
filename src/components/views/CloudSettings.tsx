import React, { useState } from 'react';
import { Cloud, CloudOff, Copy, Check, Loader2, AlertCircle, KeyRound, Unplug } from 'lucide-react';
import { store } from '../../services/store';
import { createBackup } from '../../services/backup';
import { createCloudRestaurant, disconnectThisDevice, startSync } from '../../services/cloudSync';
import { formatRestaurantKey } from '../../services/syncDiff';
import { useCloudState } from '../../hooks/useCloudState';
import { tr, trMessage } from '../../locales';

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  online: { label: 'Onlayn — real vaqtda sinxronlanmoqda', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  offline: { label: 'Internet yo‘q — o‘zgarishlar navbatda, ulanganda yuboriladi', className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  connecting: { label: 'Ulanmoqda...', className: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  error: { label: 'Xatolik', className: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  off: { label: 'Ulanmagan', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
};

export const CloudSettings: React.FC = () => {
  const cloud = useCloudState();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const isOwner = store.currentUser?.role === 'SUPER_ADMIN';

  const connect = async () => {
    setBusy(true);
    setError('');
    try {
      const backup = await createBackup();
      await createCloudRestaurant({ ...backup.data, __images: backup.images }, store.settings.name || 'FoodPlace');
      await startSync((key, value) => store.applyRemote(key, value));
      store.logAudit('CLOUD_CONNECTED', 'Restoran bulutga ulandi');
    } catch (err) {
      setError(trMessage(err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(false);
    }
  };

  const copyKey = async () => {
    if (!cloud.key) return;
    await navigator.clipboard.writeText(formatRestaurantKey(cloud.key));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!cloud.configured) {
    return (
      <div className="space-y-4 max-w-lg">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-4">{tr('Bulut sinxronizatsiya')}</h2>
        <div className="flex gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-600 dark:text-slate-300">
          <CloudOff className="w-5 h-5 shrink-0 text-slate-400" />
          {tr('Bu nusxada Firebase sozlanmagan, shuning uchun ma’lumotlar faqat shu qurilmada saqlanadi. Sozlash yo‘riqnomasi README faylida.')}
        </div>
      </div>
    );
  }

  const st = STATUS_STYLE[cloud.status] || STATUS_STYLE.off;

  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-4">{tr('Bulut sinxronizatsiya')}</h2>

      {!cloud.key ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {tr('Restoranni bulutga ulang: barcha qurilmalar (kassa, oshxona, ofitsiant) bitta ma’lumot bilan ishlaydi va o‘zgarishlar bir soniya ichida hammaga yetib boradi. Ulangach maxfiy restoran kaliti beriladi — u bilan boshqa qurilmalar qo‘shiladi.')}
          </p>
          {isOwner ? (
            <button
              onClick={connect}
              disabled={busy}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium transition"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
              {busy ? tr('Yuklanmoqda...') : tr('Bulutga ulash')}
            </button>
          ) : (
            <p className="text-sm text-slate-500">{tr('Bulutga faqat Super Admin ulay oladi.')}</p>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${st.className}`}>
            <Cloud className="w-4 h-4" /> {tr(st.label)}
            {cloud.status === 'error' && cloud.error ? `: ${cloud.error}` : ''}
          </div>

          {isOwner && (
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <KeyRound className="w-4 h-4" /> {tr('Restoran kaliti')}
              </div>
              <div className="flex items-stretch gap-2">
                <code data-testid="restaurant-key" className="flex-1 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-sm tracking-wide text-slate-900 dark:text-white break-all">
                  {formatRestaurantKey(cloud.key)}
                </code>
                <button onClick={copyKey} title={tr('Nusxalash')} className="px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {tr('Yangi qurilmada: Xush kelibsiz → “Menda akkaunt bor” → kalitni kiriting, so‘ng xodim o‘z login-paroli bilan kiradi. Kalitni faqat ishonchli xodimlarga bering — u restoran ma’lumotlariga kirish huquqini beradi.')}
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            {!confirmDisconnect ? (
              <button onClick={() => setConfirmDisconnect(true)} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-rose-600">
                <Unplug className="w-4 h-4" /> {tr('Shu qurilmani bulutdan uzish')}
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-300">{tr('Bu qurilma sinxronlanishni to‘xtatadi; restoran bulutda va boshqa qurilmalarda saqlanib qoladi. Davom etasizmi?')}</p>
                <div className="flex gap-3">
                  <button onClick={() => { disconnectThisDevice(); setConfirmDisconnect(false); }} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium">
                    {tr('Ha, uzish')}
                  </button>
                  <button onClick={() => setConfirmDisconnect(false)} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm">
                    {tr('Bekor qilish')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
        </div>
      )}
    </div>
  );
};
