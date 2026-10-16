import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Camera, Shield, Lock, Unlock } from 'lucide-react';
import { store } from '../../services/store';
import { User as UserType, UserRole } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { getImageUrl, uploadImage } from '../../utils/storage';
import { tr, trMessage, roleLabel } from '../../locales';
import { PERMISSIONS, DEFAULT_PERMISSIONS } from '../../utils/permissions';

const ROLE_OPTIONS: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CASHIER', 'WAITER', 'KITCHEN'];

const inputClass =
  'w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 dark:text-white focus:ring-2 focus:ring-blue-500/50';

export const EmployeesView: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserType[]>(store.users);
  const [editUser, setEditUser] = useState<Partial<UserType> | null>(null);
  const [formError, setFormError] = useState('');
  const [pageError, setPageError] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const me = store.currentUser;
  const iAmSuperAdmin = me?.role === 'SUPER_ADMIN';

  useEffect(() => {
    const unsub = store.subscribe(() => setUsers([...store.users]));
    return unsub;
  }, []);

  useEffect(() => {
    if (!pageError) return;
    const timer = setTimeout(() => setPageError(''), 3500);
    return () => clearTimeout(timer);
  }, [pageError]);

  // Only a Super Admin may create, edit or grant the Super Admin role
  const canManage = (u: Partial<UserType>) => iAmSuperAdmin || u.role !== 'SUPER_ADMIN';
  const isSelf = (u: Partial<UserType>) => !!u.id && u.id === me?.id;
  const availableRoles = ROLE_OPTIONS.filter(r => iAmSuperAdmin || r !== 'SUPER_ADMIN');

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const id = await uploadImage(file);
      setEditUser(prev => (prev ? { ...prev, avatarUrl: id } : null));
      const url = await getImageUrl(id);
      setImagePreview(url || '');
    } catch {
      setFormError(t('error_save'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setEditUser(prev => (prev ? { ...prev, role, permissions: [...(DEFAULT_PERMISSIONS[role] || [])] } : null));
  };

  const togglePermission = (id: string) => {
    setEditUser(prev => {
      if (!prev || prev.role === 'SUPER_ADMIN') return prev;
      const current = prev.permissions || [];
      return { ...prev, permissions: current.includes(id) ? current.filter(p => p !== id) : [...current, id] };
    });
  };

  const saveUser = () => {
    if (!editUser) return;
    const fullName = editUser.fullName?.trim() || '';
    const username = editUser.username?.trim() || '';
    if (!fullName || !username) {
      setFormError(tr('Ism va login majburiy'));
      return;
    }
    if (!/^[a-zA-Z0-9._-]{3,}$/.test(username)) {
      setFormError(tr('Login kamida 3 ta lotin harf yoki raqamdan iborat bo‘lsin'));
      return;
    }
    if (store.users.some(u => u.id !== editUser.id && u.username.toLowerCase() === username.toLowerCase())) {
      setFormError(tr('Bu login band'));
      return;
    }
    // New employees must get a real password; for existing ones an empty field keeps the old one
    if ((!editUser.id || editUser.password) && (editUser.password || '').length < 6) {
      setFormError(tr("Parol kamida 6 ta belgidan iborat bo'lishi kerak"));
      return;
    }
    if (!canManage(editUser)) {
      setFormError(tr('Super Adminni faqat Super Admin o‘zgartira oladi'));
      return;
    }
    const role = (editUser.role || 'WAITER') as UserRole;
    const permissions = role === 'SUPER_ADMIN' ? ['ALL'] : editUser.permissions || [];

    if (editUser.id) {
      const original = store.users.find(u => u.id === editUser.id);
      if (isSelf(editUser) && original && (original.role !== role || original.permissions?.join() !== permissions.join())) {
        setFormError(tr('O‘z rolingiz va huquqlaringizni o‘zgartira olmaysiz'));
        return;
      }
      store.updateUser(editUser.id, {
        fullName,
        username,
        phone: editUser.phone?.trim() || '',
        role,
        permissions,
        avatarUrl: editUser.avatarUrl,
        ...(editUser.password ? { password: editUser.password } : {}),
      });
    } else {
      store.addUser({
        fullName,
        username,
        email: editUser.email || '',
        phone: editUser.phone?.trim() || '',
        role,
        status: 'ACTIVE',
        branchId: store.activeBranchId,
        avatarUrl: editUser.avatarUrl,
        password: editUser.password!,
        permissions,
      });
    }
    setFormError('');
    setEditUser(null);
  };

  const handleDelete = (id: string) => {
    const error = store.deleteUser(id);
    if (error) setPageError(trMessage(error));
    setDeleteConfirm(null);
  };

  const handleToggleStatus = (u: UserType) => {
    const error = store.toggleUserStatus(u.id);
    if (error) setPageError(trMessage(error));
  };

  const openEdit = async (u: UserType) => {
    setFormError('');
    setEditUser({ ...u, password: '' });
    setImagePreview(u.avatarUrl ? (await getImageUrl(u.avatarUrl)) || '' : '');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('employees')}</h1>
        <button
          onClick={() => {
            setFormError('');
            setEditUser({ fullName: '', username: '', phone: '', role: 'WAITER', permissions: [...(DEFAULT_PERMISSIONS.WAITER || [])] });
            setImagePreview('');
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          {tr('Yangi xodim')}
        </button>
      </div>

      {pageError && (
        <div className="px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-sm font-medium">{pageError}</div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 font-medium text-slate-500">{t('name')}</th>
              <th className="px-6 py-4 font-medium text-slate-500">{t('role')}</th>
              <th className="px-6 py-4 font-medium text-slate-500">{t('phone')}</th>
              <th className="px-6 py-4 font-medium text-slate-500">{tr('Holat')}</th>
              <th className="px-6 py-4 font-medium text-slate-500 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {users.map(u => {
              const blocked = u.status === 'BLOCKED';
              const locked = !canManage(u);
              return (
                <tr key={u.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${blocked ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {u.fullName} {isSelf(u) && <span className="text-xs font-medium text-blue-600">({tr('Siz')})</span>}
                    </div>
                    <div className="text-sm text-slate-500">{u.username}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-semibold">{roleLabel(u.role)}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{u.phone || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${blocked ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                      {blocked ? tr('Bloklangan') : tr('Faol')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap space-x-1">
                    <button disabled={locked} onClick={() => openEdit(u)} title={t('edit')} className="p-2 text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      disabled={locked || isSelf(u)}
                      onClick={() => handleToggleStatus(u)}
                      title={blocked ? tr('Blokdan chiqarish') : tr('Bloklash')}
                      className="p-2 text-slate-400 hover:text-amber-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      {blocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </button>
                    <button
                      disabled={locked || isSelf(u)}
                      onClick={() => setDeleteConfirm(u.id)}
                      title={t('delete')}
                      className="p-2 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">{editUser.id ? t('edit') : tr('Yangi xodim')}</h2>

            <div className="flex gap-6 flex-col md:flex-row flex-1">
              <div className="flex-1 space-y-4">
                <div className="flex justify-center mb-2">
                  <div className="relative group cursor-pointer">
                    <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                      {imagePreview ? <img src={imagePreview} alt="" className="w-full h-full object-cover" /> : <Camera className="w-6 h-6 text-slate-400" />}
                    </div>
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center rounded-full cursor-pointer text-white">
                      <span className="text-xs">{isUploading ? t('loading') : t('photo_upload')}</span>
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-slate-300">{t('name')}</label>
                  <input type="text" value={editUser.fullName || ''} onChange={e => setEditUser({ ...editUser, fullName: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-slate-300">{t('login')}</label>
                  <input type="text" autoComplete="off" value={editUser.username || ''} onChange={e => setEditUser({ ...editUser, username: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-slate-300">{t('phone')}</label>
                  <input type="tel" value={editUser.phone || ''} onChange={e => setEditUser({ ...editUser, phone: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-slate-300">{editUser.id ? tr('Yangi parol') : t('password')}</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={editUser.password || ''}
                    placeholder={editUser.id ? tr("O'zgartirish uchun kiriting...") : tr('Kamida 6 ta belgi')}
                    onChange={e => setEditUser({ ...editUser, password: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-slate-300">{t('role')}</label>
                  <select
                    value={editUser.role || ''}
                    disabled={isSelf(editUser)}
                    onChange={e => handleRoleChange(e.target.value as UserRole)}
                    className={`${inputClass} disabled:opacity-60`}
                  >
                    {availableRoles.map(r => (
                      <option key={r} value={r}>{roleLabel(r)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex-1 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 dark:text-white">{tr('Ruxsatlar')}</h3>
                </div>

                {editUser.role === 'SUPER_ADMIN' ? (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium border border-blue-200 dark:border-blue-800">
                    {tr("Super Admin tizimning barcha imkoniyatlariga to'liq kirish huquqiga ega. Individual ruxsatlar talab etilmaydi.")}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-2">
                    {PERMISSIONS.map(pg => (
                      <label
                        key={pg.id}
                        className={`flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition ${isSelf(editUser) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                      >
                        <input
                          type="checkbox"
                          disabled={isSelf(editUser)}
                          checked={editUser.permissions?.includes(pg.id) || false}
                          onChange={() => togglePermission(pg.id)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500/30 dark:bg-slate-900"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{tr(pg.label)}</span>
                      </label>
                    ))}
                    {isSelf(editUser) && <p className="text-xs text-slate-500">{tr('O‘z rolingiz va huquqlaringizni o‘zgartira olmaysiz')}</p>}
                  </div>
                )}
              </div>
            </div>

            {formError && <p className="mt-4 text-sm font-medium text-rose-600">{formError}</p>}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <button onClick={() => { setEditUser(null); setFormError(''); }} className="px-6 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                {t('cancel')}
              </button>
              <button onClick={saveUser} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-md shadow-blue-600/20 transition">
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold mb-2 dark:text-white">{t('delete')}?</h3>
            <p className="text-slate-500 text-sm mb-6">{t('delete_confirm')}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                {t('cancel')}
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-700 shadow-md shadow-rose-600/20 transition">
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
