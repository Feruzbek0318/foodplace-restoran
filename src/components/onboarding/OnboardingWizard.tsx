import React, { useState } from 'react';
import { Store, MapPin, CheckCircle, ArrowRight, ArrowLeft, User, Image as ImageIcon } from 'lucide-react';
import { store } from '../../services/store';
import { uploadImage } from '../../utils/storage';
import { tr } from '../../locales';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

interface Props {
  onComplete: () => void;
  /** Returns to the welcome screen from the first step */
  onBack?: () => void;
}

export const OnboardingWizard: React.FC<Props> = ({ onComplete, onBack }) => {
  const [step, setStep] = useState(1);
  
  // Owner info
  const [ownerName, setOwnerName] = useState('');
  const [ownerUsername, setOwnerUsername] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Restaurant info
  const [restaurantName, setRestaurantName] = useState('');
  const [currency, setCurrency] = useState('UZS');
  const [logoId, setLogoId] = useState('');
  
  // Branch info
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchPhone, setBranchPhone] = useState('');

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => (step === 1 ? onBack?.() : setStep(s => s - 1));

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const id = await uploadImage(file);
        setLogoId(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleComplete = () => {
    // 1. Create branch first so the owner can be attached to it
    const branch = store.addBranch({
      name: branchName,
      address: branchAddress,
      phone: branchPhone,
      managerName: ownerName,
      isActive: true
    });

    // 2. Create owner
    store.addUser({
      fullName: ownerName,
      username: ownerUsername,
      password: ownerPassword,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      branchId: branch.id,
      permissions: ['ALL']
    });

    // 3. Save restaurant settings
    store.updateSettings({
      ...store.settings,
      name: restaurantName,
      currency,
      logoUrl: logoId,
      setupCompleted: true
    });

    // Wait for password hash to complete before logging in
    setTimeout(async () => {
      await store.login(ownerUsername, ownerPassword);
      onComplete();
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 relative">
      <LanguageSwitcher className="absolute top-4 right-4" />
      <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden">
        {/* Progress header */}
        <div className="bg-slate-100 dark:bg-slate-900/50 px-8 py-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center relative">
          <div className="absolute bottom-0 left-0 h-1 bg-blue-600 transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }} />
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`flex flex-col items-center gap-2 z-10 ${step >= i ? 'text-blue-600' : 'text-slate-400 dark:text-slate-500'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${step >= i ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                {step > i ? <CheckCircle className="w-5 h-5" /> : i}
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider">{i === 1 ? tr("Egasi") : i === 2 ? tr("Restoran") : i === 3 ? tr("Filial") : tr("Tayyor")}</span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{tr("Admin akkauntini yarating")}</h2>
              </div>
              <div className="space-y-4 max-w-sm mx-auto">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{tr("To'liq ismingiz")}</label>
                  <input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white" placeholder={tr("F.I.SH.")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{tr("Login (Username)")}</label>
                  <input type="text" value={ownerUsername} onChange={e => setOwnerUsername(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{tr("Parol")}</label>
                  <input type="password" value={ownerPassword} onChange={e => setOwnerPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{tr("Parolni tasdiqlang")}</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white" />
                  {ownerPassword && confirmPassword && ownerPassword !== confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{tr("Parollar mos kelmadi!")}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Store className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{tr("Restoraningizni sozlang")}</h2>
              </div>
              <div className="space-y-4 max-w-sm mx-auto">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{tr("Restoran nomi")}</label>
                  <input type="text" value={restaurantName} onChange={e => setRestaurantName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white" placeholder={tr("Masalan: Milliy Taomlar")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{tr("Restoran Logotipi")}</label>
                  <div className="relative w-full h-24 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                    {logoId ? <div className="text-green-600 font-bold flex items-center gap-2"><CheckCircle className="w-5 h-5"/> {tr("Yuklandi")}</div> : <ImageIcon className="text-slate-400" />}
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{tr("Valyuta")}</label>
                  <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">
                    <option value="UZS">{tr("UZS (So'm)")}</option>
                    <option value="USD">{tr("USD (Dollar)")}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{tr("Birinchi filialingiz")}</h2>
              </div>
              <div className="space-y-4 max-w-sm mx-auto">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{tr("Filial nomi")}</label>
                  <input type="text" value={branchName} onChange={e => setBranchName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white" placeholder={tr("Masalan: Chilonzor filiali")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{tr("Manzil")}</label>
                  <input type="text" value={branchAddress} onChange={e => setBranchAddress(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{tr("Aloqa telefoni")}</label>
                  <input type="text" value={branchPhone} onChange={e => setBranchPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white" />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">{tr("Tizim tayyor!")}</h2>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={step === 1 && !onBack}
            className={`px-6 py-2.5 rounded-xl flex items-center gap-2 font-medium transition-colors ${step === 1 && !onBack ? 'opacity-0 pointer-events-none' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
          >
            <ArrowLeft className="w-5 h-5" /> {tr("Orqaga")}
          </button>
          
          {step < 4 ? (
            <button
              onClick={nextStep}
              disabled={
                (step === 1 && (!ownerName || !ownerUsername || !ownerPassword || ownerPassword !== confirmPassword)) ||
                (step === 2 && !restaurantName.trim()) ||
                (step === 3 && !branchName.trim())
              }
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {tr("Keyingi")} <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="px-8 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center gap-2 font-medium transition-colors shadow-lg shadow-green-600/20"
            >
              {tr("Tizimga kirish")} <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
