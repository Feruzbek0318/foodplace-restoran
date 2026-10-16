import React, { useState } from 'react';
import { ChefHat, Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { store } from '../../services/store';
import { AsyncImage } from '../common/AsyncImage';
import { UserRole } from '../../types';
import { tr, trMessage } from '../../locales';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { version as APP_VERSION } from '../../../package.json';

interface LoginViewProps {
  onSuccessLogin: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccessLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg(tr("Iltimos, foydalanuvchi nomi va parolni kiriting"));
      return;
    }

    const result = await store.login(username, password, rememberMe);
    if (result.success) {
      if (store.currentUser?.requirePasswordReset) {
        setForcePasswordChange(true);
      } else {
        onSuccessLogin();
      }
    } else {
      setErrorMsg(result.message ? trMessage(result.message) : tr("Kirishda xatolik yuz berdi"));
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (newPassword !== confirmPassword) {
      setErrorMsg(tr("Parollar mos tushmadi"));
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg(tr("Parol kamida 6 ta belgidan iborat bo'lishi kerak"));
      return;
    }
    store.changeUserPassword(store.currentUser!.id, newPassword);
    onSuccessLogin();
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-900 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] relative">
      <LanguageSwitcher className="absolute top-4 right-4 z-20" />
      {/* Left Brand Showcase Banner (Matching Screen 1) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-12 flex-col justify-between">
        {/* Background Decorative Image with dark overlay */}
        <div
          className="absolute inset-0 opacity-25 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&auto=format&fit=crop&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            {store.settings.logoUrl ? (
              <AsyncImage srcId={store.settings.logoUrl} alt="Logo" className="w-12 h-12 rounded-2xl object-cover shadow-lg shadow-blue-500/30 bg-white" />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                <ChefHat className="w-7 h-7" />
              </div>
            )}
            <div>
              <div className="font-extrabold text-2xl tracking-tight text-white flex items-center gap-1.5">
                {store.settings.name || 'FoodPlace'}
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              </div>
              <div className="text-xs text-blue-300 font-medium">
                {tr("Restoran & Kafe Boshqaruv Tizimi")}
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-md space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            {tr("2026 Avtomatlashtirilgan Standart")}
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight leading-snug">
            {tr("Yaxshi ta'm.")} <br />
            <span className="text-blue-400">{tr("Yaxshi kayfiyat.")}</span>
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            {tr("Kassa, oshxona ekrani, ombor harakati, stollar xaritasi va moliyaviy hisobotlarni yagona, qulay va xavfsiz tizimda birlashtiring.")}
          </p>

          <div className="pt-4 grid grid-cols-2 gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{tr("Tezkor POS Kassa")}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{tr("Oshxona Display (KDS)")}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{tr("Interaktiv Stol Xaritasi")}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{tr("Real-time Hisobotlar")}</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500 font-mono">
          FoodPlace v{APP_VERSION}
        </div>
      </div>

      {/* Right Login Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-slate-900">
        <div className="w-full max-w-md space-y-8 bg-slate-900/60 p-8 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-md">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="lg:hidden flex justify-center mb-4">
              {store.settings.logoUrl ? (
                <AsyncImage srcId={store.settings.logoUrl} alt="Logo" className="w-12 h-12 rounded-2xl object-cover shadow-lg shadow-blue-500/30 bg-white" />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <ChefHat className="w-7 h-7" />
                </div>
              )}
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              {tr("Tizimga kirish")}
            </h2>
            <p className="text-xs text-slate-400">
              {tr("Hisobingiz bilan tizimga kiring va boshqaruvni davom ettiring")}
            </p>
          </div>

          {/* Error notice */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              {errorMsg}
            </div>
          )}

          {forcePasswordChange ? (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="p-3 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium leading-relaxed">
                {tr("Xavfsizlik talablariga muvofiq, tizimga kirish uchun vaqtinchalik parolni o'zgartirishingiz shart. Iltimos o'zingiz eslab qoladigan yangi parol kiriting.")}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">{tr("Yangi parol")}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder={tr("Kamida 6 ta belgi")}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm text-white placeholder-slate-500 transition"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">{tr("Parolni tasdiqlang")}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder={tr("Parolni qayta kiriting")}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm text-white placeholder-slate-500 transition"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition duration-200 mt-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{tr("Saqlash va Kirish")}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {tr("Foydalanuvchi nomi yoki telefon")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder={tr("admin yoki +998...")}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm text-white placeholder-slate-500 transition"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">{tr("Parol")}</label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition"
                  >
                    {tr("Parolni unutdingizmi?")}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-slate-800/80 border border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm text-white placeholder-slate-500 transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500/20"
                  />
                  <span>{tr("Meni eslab qolish")}</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition duration-200 mt-2 cursor-pointer"
              >
                <span>{tr("Kirish")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">{tr("Parolni tiklash")}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {tr("Xavfsizlik maqsadida parolni qayta tiklash Super Admin orqali amalga oshiriladi. Super Admin bilan bog‘laning yoki admin hisobi orqali kiring.")}
            </p>
            {store.settings.phone && (
              <div className="p-3 rounded-xl bg-slate-800 text-xs text-slate-300 font-mono">
                {tr('Restoran telefoni')}: {store.settings.phone}
              </div>
            )}
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
            >
              {tr("Yopish")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
