import { AsyncImage } from '../../components/common/AsyncImage';
import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, Camera } from 'lucide-react';
import { store } from '../../services/store';
import { Branch } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { uploadImage, getImageUrl } from '../../utils/storage';

export const BranchesView: React.FC = () => {
  const { t } = useTranslation();
  const [branches, setBranches] = useState<Branch[]>(store.branches);
  
  const [editBranch, setEditBranch] = useState<Partial<Branch> | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const unsub = store.subscribe(() => setBranches([...store.branches]));
    return unsub;
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const id = await uploadImage(file);
      setEditBranch(prev => prev ? { ...prev, address: prev.address, managerId: id } : null);
      const url = await getImageUrl(id);
      setImagePreview(url || '');
    } catch (err) {
      alert(t('error_save'));
    } finally {
      setIsUploading(false);
    }
  };

  const saveBranch = () => {
    if (!editBranch || !editBranch.name?.trim()) return;
    if (editBranch.id) {
      store.updateBranch(editBranch.id, editBranch);
    } else {
      store.addBranch({
        name: editBranch.name.trim(),
        address: editBranch.address || '',
        phone: editBranch.phone || '',
        isActive: true,
        ...(editBranch.managerId ? { managerId: editBranch.managerId } : {}),
      });
    }
    setEditBranch(null);
  };

  const handleDelete = (id: string) => {
    if (store.branches.length <= 1) { setDeleteConfirm(null); return; }
    store.deleteBranch(id);
    setDeleteConfirm(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('branches')}</h1>
        <button
          onClick={() => { setEditBranch({ name: '', phone: '', address: '' }); setImagePreview(''); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t('branch')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map(b => (
          <div key={b.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <AsyncImage srcId={b.managerId} className="w-full h-full object-cover rounded-xl" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditBranch(b)} className="p-2 text-slate-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => setDeleteConfirm(b.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg">{b.name}</h3>
              <p className="text-slate-500 text-sm mt-1">{b.address}</p>
              <p className="text-slate-500 text-sm">{b.phone}</p>
            </div>
          </div>
        ))}
      </div>

      {editBranch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-6">
            <h2 className="text-xl font-bold">{editBranch.id ? t('edit') : t('branch')}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('name')}</label>
                <input type="text" value={editBranch.name || ''} onChange={e => setEditBranch({...editBranch, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('phone')}</label>
                <input type="text" value={editBranch.phone || ''} onChange={e => setEditBranch({...editBranch, phone: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('address')}</label>
                <input type="text" value={editBranch.address || ''} onChange={e => setEditBranch({...editBranch, address: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setEditBranch(null)} className="px-5 py-2 rounded-xl text-slate-600 hover:bg-slate-100">{t('cancel')}</button>
              <button onClick={saveBranch} className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">{t('save')}</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 text-center space-y-6">
            <Trash2 className="w-12 h-12 text-rose-500 mx-auto" />
            <div>
              <h3 className="text-lg font-bold">{t('delete')}?</h3>
              <p className="text-slate-500 text-sm">{t('delete_confirm')}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 border rounded-xl">{t('cancel')}</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-xl">{t('delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
