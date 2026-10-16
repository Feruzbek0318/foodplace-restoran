import { AsyncImage } from '../../components/common/AsyncImage';
import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit2, Trash2, Camera } from 'lucide-react';
import { store } from '../../services/store';
import { INITIAL_CATEGORIES } from '../../data/mockData';
import { Product } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { uploadImage, getImageUrl } from '../../utils/storage';
import { tr } from '../../locales';

export const InventoryView: React.FC = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>(store.products);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [editProduct, setEditProduct] = useState<Partial<Product> | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Sync with store
  useEffect(() => {
    const unsub = store.subscribe(() => setProducts([...store.products]));
    return unsub;
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const id = await uploadImage(file);
      setEditProduct(prev => prev ? { ...prev, image: id } : null);
      const url = await getImageUrl(id);
      setImagePreview(url || '');
    } catch (err) {
      alert(t('error_save'));
    } finally {
      setIsUploading(false);
    }
  };

  const saveProduct = () => {
    if (!editProduct || !editProduct.name) return;
    if (editProduct.id) {
      store.updateProduct(editProduct.id, editProduct);
    } else {
      store.addProduct({
        image: '',
        costPrice: 0,
        stock: 0,
        minStock: 0,
        unit: 'portion',
        categoryId: 'cat-national',
        ...editProduct,
        isAvailable: true,
      } as Omit<Product, 'id'>);
    }
    setEditProduct(null);
  };

  const handleDelete = (id: string) => {
    store.deleteProduct(id);
    setDeleteConfirm(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('products')}</h1>
        </div>
        <button
          onClick={() => { setEditProduct({ name: '', price: 0, costPrice: 0, stock: 0, categoryId: 'cat-national' }); setImagePreview(''); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t('add_product')}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-sm">
            <tr>
              <th className="px-6 py-4 font-medium">{t('name')}</th>
              <th className="px-6 py-4 font-medium">{t('price')}</th>
              <th className="px-6 py-4 font-medium">{t('stock')}</th>
              <th className="px-6 py-4 font-medium text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                      <AsyncImage srcId={p.image} className="w-full h-full object-cover" />{false ? (
                         <img src={p.image.startsWith('http') ? p.image : `${p.image}`} alt="" className="w-full h-full object-cover" />
                      ) : <Package className="w-5 h-5 text-slate-400" />}
                    </div>
                    <span className="font-medium text-slate-900 dark:text-white">{p.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{(p.price || p.salePrice || 0).toLocaleString()} UZS</td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{p.stock}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => { setEditProduct(p); setImagePreview(p.image || ''); }} className="p-2 text-slate-400 hover:text-blue-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteConfirm(p.id)} className="p-2 text-slate-400 hover:text-rose-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">{t('no_data')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{editProduct.id ? t('edit') : t('add_product')}</h2>
            
            <div className="flex items-center gap-4">
               <div className="relative group cursor-pointer">
                  <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : <Camera className="w-6 h-6 text-slate-400" />}
                  </div>
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl cursor-pointer">
                    <Camera className="w-5 h-5 text-white" />
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
               </div>
               <div className="text-sm text-slate-500">{isUploading ? t('loading') : t('photo_upload')}</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('name')}</label>
                <input type="text" value={editProduct.name || ''} onChange={e => setEditProduct({...editProduct, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{tr("Toifa")}</label>
                <select value={editProduct.categoryId || 'cat-national'} onChange={e => setEditProduct({...editProduct, categoryId: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  {INITIAL_CATEGORIES.filter(c => c.id !== 'cat-all').map(c => <option key={c.id} value={c.id}>{tr(c.name)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('price')}</label>
                <input type="number" value={editProduct.price || 0} onChange={e => setEditProduct({...editProduct, price: +e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('stock')}</label>
                <input type="number" value={editProduct.stock || 0} onChange={e => setEditProduct({...editProduct, stock: +e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setEditProduct(null)} className="px-5 py-2 rounded-xl text-slate-600 hover:bg-slate-100">{t('cancel')}</button>
              <button onClick={saveProduct} className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">{t('save')}</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('delete')}?</h3>
              <p className="text-slate-500 text-sm">{t('delete_confirm')}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">{t('cancel')}</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700">{t('delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
