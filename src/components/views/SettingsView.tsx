import React, { useEffect, useState } from 'react';
import { User, Building2, MapPin, Globe, Moon, Bell, Shield, Monitor, Save, Camera, CheckCircle2, AlertCircle } from 'lucide-react';
import { store } from '../../services/store';
import { useTranslation } from '../../hooks/useTranslation';
import { trMessage } from '../../locales';
import { AsyncImage } from '../common/AsyncImage';
import { BranchesView } from './BranchesView';
import { uploadImage } from '../../utils/storage';
import { RestaurantSettings } from '../../types';
import { downloadBackup, readBackupFile, restoreBackup } from '../../services/backup';

type Notice = { type: 'success' | 'error'; text: string } | null;

const inputClass =
  'w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white';
const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1';
const headingClass = 'text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-4';

// Tabs whose fields are applied by the header "Save" button
const SAVE_TABS = ['profile', 'restaurant', 'notifications'];

export const SettingsView: React.FC = () => {
  const { t } = useTranslation();
  const currentUser = store.currentUser;
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState<RestaurantSettings>({ ...store.settings });
  const [profile, setProfile] = useState({ fullName: currentUser?.fullName || '', phone: currentUser?.phone || '' });
  const [notice, setNotice] = useState<Notice>(null);

  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordNotice, setPasswordNotice] = useState<Notice>(null);

  const [backupNotice, setBackupNotice] = useState<Notice>(null);
  const [restoreBusy, setRestoreBusy] = useState(false);

  const [resetStep, setResetStep] = useState(false);
  const [resetWord, setResetWord] = useState('');

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2500);
    return () => clearTimeout(timer);
  }, [notice]);

  const updateField = <K extends keyof RestaurantSettings>(key: K, value: RestaurantSettings[K]) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  // Language and theme take effect immediately, so they are written straight to the store
  const applyNow = <K extends keyof RestaurantSettings>(key: K, value: RestaurantSettings[K]) => {
    updateField(key, value);
    store.updateSettings({ [key]: value } as Partial<RestaurantSettings>);
  };

  const handleSave = () => {
    store.updateSettings({ ...settings, name: settings.name.trim() });
    if (currentUser && (profile.fullName.trim() !== currentUser.fullName || profile.phone !== (currentUser.phone || ''))) {
      store.updateUser(currentUser.id, { fullName: profile.fullName.trim(), phone: profile.phone.trim() });
    }
    setNotice({ type: 'success', text: t('s_saved') });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const id = await uploadImage(file);
      updateField('logoUrl', id);
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : t('error_save') });
    }
  };

  const handleChangePassword = async () => {
    if (!currentUser) return;
    if (!(await store.verifyPassword(currentUser.id, passwords.current))) {
      setPasswordNotice({ type: 'error', text: t('s_pw_wrong') });
      return;
    }
    if (passwords.next.length < 6) {
      setPasswordNotice({ type: 'error', text: t('s_pw_short') });
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setPasswordNotice({ type: 'error', text: t('s_pw_mismatch') });
      return;
    }
    await store.changeUserPassword(currentUser.id, passwords.next);
    setPasswords({ current: '', next: '', confirm: '' });
    setPasswordNotice({ type: 'success', text: t('s_pw_changed') });
  };

  const handleDownloadBackup = async () => {
    try {
      await downloadBackup(store.settings.name);
      setBackupNotice({ type: 'success', text: t('s_backup_done') });
    } catch {
      setBackupNotice({ type: 'error', text: t('error_save') });
    }
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!window.confirm(t('s_restore_confirm'))) return;
    setRestoreBusy(true);
    try {
      const backup = await readBackupFile(file);
      await restoreBackup(backup);
      window.location.reload();
    } catch (err) {
      setBackupNotice({ type: 'error', text: trMessage(err instanceof Error ? err.message : String(err)) });
      setRestoreBusy(false);
    }
  };

  const handleFactoryReset = () => {
    store.factoryReset();
    window.location.reload();
  };

  const tabs = [
    { id: 'profile', icon: User, label: t('profile') },
    { id: 'restaurant', icon: Building2, label: t('restaurant') },
    { id: 'branches', icon: MapPin, label: t('branches') },
    { id: 'language', icon: Globe, label: t('language') },
    { id: 'appearance', icon: Moon, label: t('appearance') },
    { id: 'notifications', icon: Bell, label: t('notifications') },
    { id: 'security', icon: Shield, label: t('security') },
    { id: 'system', icon: Monitor, label: t('system') },
  ];

  const NoticeBox = ({ value }: { value: Notice }) =>
    value ? (
      <div
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${
          value.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
        }`}
      >
        {value.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
        {value.text}
      </div>
    ) : null;

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{t('settings')}</h1>
            <p className="text-slate-500">{t('s_subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <NoticeBox value={notice} />
            {SAVE_TABS.includes(activeTab) && (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm shadow-blue-500/20"
              >
                <Save className="w-5 h-5" />
                <span className="hidden sm:inline">{t('save')}</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Tabs Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 lg:p-8 min-h-[500px]">
            {activeTab === 'profile' && (
              <div className="space-y-6 max-w-lg">
                <h2 className={headingClass}>{t('s_profile_title')}</h2>
                <div>
                  <label className={labelClass}>{t('s_full_name')}</label>
                  <input type="text" className={inputClass} value={profile.fullName} onChange={e => setProfile({ ...profile, fullName: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>{t('phone')}</label>
                  <input type="tel" className={inputClass} value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>{t('login')}</label>
                  <input type="text" className={`${inputClass} bg-slate-50 dark:bg-slate-800 text-slate-500 cursor-not-allowed`} value={currentUser?.username || ''} disabled />
                </div>
                <div>
                  <label className={labelClass}>{t('s_role')}</label>
                  <input type="text" className={`${inputClass} bg-slate-50 dark:bg-slate-800 text-slate-500 cursor-not-allowed`} value={currentUser?.role || ''} disabled />
                </div>
              </div>
            )}

            {activeTab === 'restaurant' && (
              <div className="space-y-6 max-w-lg">
                <h2 className={headingClass}>{t('s_restaurant_title')}</h2>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{t('s_logo')}</label>
                  <div className="flex items-start gap-6">
                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-slate-50 dark:bg-slate-800 overflow-hidden relative group">
                      {settings.logoUrl ? (
                        <AsyncImage srcId={settings.logoUrl} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-8 h-8 text-slate-400" />
                      )}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-500 mb-2">{t('s_logo_hint')}</p>
                      {settings.logoUrl && (
                        <button
                          onClick={() => updateField('logoUrl', '')}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          {t('s_logo_remove')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{t('s_restaurant_name')}</label>
                  <input type="text" className={inputClass} value={settings.name || ''} onChange={e => updateField('name', e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>{t('phone')}</label>
                    <input type="tel" className={inputClass} value={settings.phone || ''} onChange={e => updateField('phone', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>{t('s_currency')}</label>
                    <select className={inputClass} value={settings.currency || 'UZS'} onChange={e => updateField('currency', e.target.value)}>
                      <option value="UZS">UZS (So'm)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{t('address')}</label>
                  <input type="text" className={inputClass} value={settings.address || ''} onChange={e => updateField('address', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>{t('s_tax')}</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className={inputClass}
                    value={settings.taxRatePercent ?? 0}
                    onChange={e => updateField('taxRatePercent', Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  />
                  <p className="mt-1 text-xs text-slate-500">{t('s_tax_hint')}</p>
                </div>
                <div>
                  <label className={labelClass}>{t('s_receipt_footer')}</label>
                  <input type="text" className={inputClass} value={settings.receiptFooter || ''} onChange={e => updateField('receiptFooter', e.target.value)} />
                </div>
              </div>
            )}

            {activeTab === 'branches' && (
              <div className="-m-6">
                <BranchesView />
              </div>
            )}

            {activeTab === 'language' && (
              <div className="space-y-6 max-w-lg">
                <h2 className={headingClass}>{t('s_language_title')}</h2>
                <div>
                  <label className={labelClass}>{t('s_system_language')}</label>
                  <select
                    className={inputClass}
                    value={settings.language || 'uz'}
                    onChange={e => applyNow('language', e.target.value as RestaurantSettings['language'])}
                  >
                    <option value="uz">O'zbekcha</option>
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                  </select>
                  <p className="mt-2 text-sm text-slate-500">{t('s_language_hint')}</p>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6 max-w-lg">
                <h2 className={headingClass}>{t('appearance')}</h2>
                <div>
                  <label className={labelClass}>{t('s_theme')}</label>
                  <select
                    className={inputClass}
                    value={settings.theme || 'light'}
                    onChange={e => applyNow('theme', e.target.value as RestaurantSettings['theme'])}
                  >
                    <option value="light">{t('light_mode')}</option>
                    <option value="dark">{t('dark_mode')}</option>
                    <option value="system">{t('system_mode')}</option>
                  </select>
                  <p className="mt-2 text-sm text-slate-500">{t('s_theme_hint')}</p>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6 max-w-lg">
                <h2 className={headingClass}>{t('notifications')}</h2>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 rounded border-slate-300" checked={settings.soundAlerts !== false} onChange={e => updateField('soundAlerts', e.target.checked)} />
                    <span className="text-slate-700 dark:text-slate-300">{t('s_sound_alerts')}</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 rounded border-slate-300" checked={settings.shiftReportAlerts !== false} onChange={e => updateField('shiftReportAlerts', e.target.checked)} />
                    <span className="text-slate-700 dark:text-slate-300">{t('s_shift_alerts')}</span>
                  </label>
                  <label className="flex items-center gap-3 opacity-50 cursor-not-allowed">
                    <input type="checkbox" className="w-5 h-5 rounded border-slate-300" checked={false} disabled />
                    <span className="text-slate-700 dark:text-slate-300">{t('s_sms_alerts')}</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6 max-w-lg">
                <h2 className={headingClass}>{t('security')}</h2>
                <div>
                  <label className={labelClass}>{t('s_old_password')}</label>
                  <input type="password" autoComplete="current-password" className={inputClass} value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>{t('s_new_password')}</label>
                  <input type="password" autoComplete="new-password" className={inputClass} value={passwords.next} onChange={e => setPasswords({ ...passwords, next: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>{t('s_confirm_password')}</label>
                  <input type="password" autoComplete="new-password" className={inputClass} value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} />
                </div>
                <NoticeBox value={passwordNotice} />
                <button
                  onClick={handleChangePassword}
                  disabled={!passwords.current || !passwords.next || !passwords.confirm}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
                >
                  {t('s_change_password')}
                </button>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-6 max-w-lg">
                <h2 className={headingClass}>{t('system')}</h2>
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-sm mb-2 dark:text-slate-300">{t('s_version')}: <strong>1.0.0</strong></p>
                    <p className="text-sm dark:text-slate-300">{t('s_storage')}: <strong>{t('s_storage_value')}</strong></p>
                    <button className="px-4 py-2 mt-4 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition" onClick={() => window.location.reload()}>
                      {t('s_reload')}
                    </button>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">{t('s_backup_title')}</h3>
                    <p className="text-sm text-slate-500 mb-4">{t('s_backup_desc')}</p>
                    <div className="flex flex-wrap gap-3">
                      <button onClick={handleDownloadBackup} className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition">
                        {t('s_backup_download')}
                      </button>
                      {currentUser?.role === 'SUPER_ADMIN' && (
                        <label className={`px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition ${restoreBusy ? 'opacity-60 pointer-events-none' : ''}`}>
                          {restoreBusy ? t('loading') : t('s_backup_restore')}
                          <input type="file" accept="application/json,.json" className="hidden" onChange={handleRestoreBackup} />
                        </label>
                      )}
                    </div>
                    <div className="mt-3"><NoticeBox value={backupNotice} /></div>
                  </div>

                  {currentUser?.role === 'SUPER_ADMIN' && (
                    <div className="mt-8 border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 p-5 rounded-2xl">
                      <h3 className="text-rose-600 dark:text-rose-400 font-bold mb-2">{t('s_reset_title')}</h3>
                      <p className="text-rose-500/80 dark:text-rose-400/80 text-sm mb-4">{t('s_reset_desc')}</p>

                      {!resetStep ? (
                        <button
                          onClick={() => setResetStep(true)}
                          className="px-4 py-2.5 bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/60 rounded-xl text-sm font-medium transition"
                        >
                          {t('s_reset_button')}
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <label className="block text-sm font-bold text-rose-600 dark:text-rose-400">{t('s_reset_confirm')}</label>
                          <input type="text" className={inputClass} value={resetWord} onChange={e => setResetWord(e.target.value)} placeholder="TOZALASH" />
                          <div className="flex gap-3">
                            <button
                              onClick={handleFactoryReset}
                              disabled={resetWord.trim().toUpperCase() !== 'TOZALASH'}
                              className="px-4 py-2.5 bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-bold transition shadow-lg shadow-rose-600/20"
                            >
                              {t('s_reset_yes')}
                            </button>
                            <button
                              onClick={() => { setResetStep(false); setResetWord(''); }}
                              className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl text-sm font-medium transition"
                            >
                              {t('cancel')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
