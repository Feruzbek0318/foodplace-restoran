import React, { useRef, useState } from 'react';
import { ChefHat, Store, LogIn, Upload, ArrowLeft, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { tr, trMessage } from '../../locales';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { readBackupFile, restoreBackup } from '../../services/backup';

interface Props {
  onCreateNew: () => void;
}

// First screen of a fresh installation: start a new restaurant, or sign in to an existing
// one by restoring its backup onto this device.
export const WelcomeView: React.FC<Props> = ({ onCreateNew }) => {
  const [mode, setMode] = useState<'choose' | 'restore'>('choose');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      const backup = await readBackupFile(file);
      await restoreBackup(backup);
      // Reload so the store starts from the restored data and shows the login screen
      window.location.reload();
    } catch (err) {
      setError(trMessage(err instanceof Error ? err.message : String(err)));
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100 flex items-center justify-center p-4 relative">
      <LanguageSwitcher className="absolute top-4 right-4" />

      <div className="w-full max-w-3xl">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">{tr('FoodPlace’ga xush kelibsiz')}</h1>
          <p className="text-slate-400 mt-2">{tr('Restoran & Kafe Boshqaruv Tizimi')}</p>
        </div>

        {mode === 'choose' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <button
              onClick={() => setMode('restore')}
              className="group text-left p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500 hover:bg-white/10 transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-4">
                <LogIn className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold">{tr('Menda akkaunt bor')}</h2>
              <p className="text-sm text-slate-400 mt-1">{tr('Mavjud restoran ma’lumotlarini shu qurilmaga tiklab, tizimga kiring')}</p>
              <span className="inline-block mt-4 text-sm font-bold text-blue-400 group-hover:translate-x-1 transition">{tr('Kirish')} →</span>
            </button>

            <button
              onClick={onCreateNew}
              className="group text-left p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-emerald-500 hover:bg-white/10 transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-4">
                <Store className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold">{tr('Yangi restoran ochish')}</h2>
              <p className="text-sm text-slate-400 mt-1">{tr('Admin akkaunt, restoran va birinchi filialni noldan yarating')}</p>
              <span className="inline-block mt-4 text-sm font-bold text-emerald-400 group-hover:translate-x-1 transition">{tr('Boshlash')} →</span>
            </button>
          </div>
        ) : (
          <div className="max-w-lg mx-auto p-6 rounded-3xl bg-white/5 border border-white/10">
            <button onClick={() => { setMode('choose'); setError(''); }} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4" /> {tr('Orqaga')}
            </button>
            <h2 className="text-xl font-bold">{tr('Mavjud akkaunt bilan kirish')}</h2>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              {tr('Bu qurilmada hali restoran ma’lumotlari yo‘q. Boshqa qurilmada Sozlamalar → Tizim → “Zaxira nusxa yuklab olish” orqali olingan faylni tanlang — barcha xodimlar, mahsulotlar va buyurtmalar tiklanadi, so‘ng o‘z login va parolingiz bilan kirasiz.')}
            </p>

            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleFile} />
            <button
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 font-bold transition"
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              {busy ? tr('Tiklanmoqda...') : tr('Zaxira faylini tanlash')}
            </button>

            {error && (
              <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
              </div>
            )}

            <div className="mt-5 flex items-start gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              {tr('Parollar faylda shifrlangan (xeshlangan) holda saqlanadi.')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
