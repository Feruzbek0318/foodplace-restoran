import React, { useState, useRef } from 'react';
import { Plus, Save, MousePointer2, RotateCw, Copy, Trash2, Settings2, Grid2x2, Circle, Square } from 'lucide-react';
import { store } from '../../services/store';
import { RestaurantTable, TableShape } from '../../types';
import { motion, useDragControls } from 'framer-motion';
import { useTranslation } from '../../hooks/useTranslation';
import { tr } from '../../locales';

interface Props {
  tables: RestaurantTable[];
  onTableClick: (t: RestaurantTable) => void;
  canEdit: boolean;
}

export const TablesMap: React.FC<Props> = ({ tables, onTableClick, canEdit }) => {
  const { t } = useTranslation();
  const [isEditMode, setIsEditMode] = useState(false);
  const [localTables, setLocalTables] = useState<RestaurantTable[]>(tables);
  const [selectedForEdit, setSelectedForEdit] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const saveLayout = () => {
    // Keep live status/order links from the store; take layout fields from the editor
    store.saveTables(localTables.map(t => {
      const live = store.tables.find(x => x.id === t.id);
      return live ? { ...t, status: live.status, currentOrderId: live.currentOrderId } : t;
    }));
    setIsEditMode(false);
    setSelectedForEdit(null);
  };

  const addTable = () => {
    const newTable: RestaurantTable = {
      id: `tbl-${Date.now()}`,
      number: localTables.length + 1,
      name: `${tr('Stol')} ${localTables.length + 1}`,
      capacity: 4,
      zone: 'HALL',
      status: 'AVAILABLE',
      // Lay new tables out in a grid so they don't stack on top of each other
      x: 40 + (localTables.length % 5) * 110,
      y: 40 + Math.floor(localTables.length / 5) * 110,
      width: 80,
      height: 80,
      rotation: 0,
      shape: 'RECTANGLE'
    };
    setLocalTables([...localTables, newTable]);
    setSelectedForEdit(newTable.id);
  };

  const updateSelected = (updates: Partial<RestaurantTable>) => {
    if (!selectedForEdit) return;
    setLocalTables(prev => prev.map(t => t.id === selectedForEdit ? { ...t, ...updates } : t));
  };

  const removeTable = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm(t('confirm_delete'))) {
      setLocalTables(prev => prev.filter(t => t.id !== id));
      if (selectedForEdit === id) setSelectedForEdit(null);
    }
  };

  const duplicateTable = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const source = localTables.find(t => t.id === id);
    if (!source) return;
    const newTable = {
      ...source,
      id: `tbl-${Date.now()}`,
      number: localTables.length + 1,
      name: `${tr('Stol')} ${localTables.length + 1}`,
      x: (source.x || 0) + 20,
      y: (source.y || 0) + 20
    };
    setLocalTables([...localTables, newTable]);
  };

  const selectedTableObj = localTables.find(t => t.id === selectedForEdit);

  return (
    <div className="flex flex-col h-[70vh] border border-slate-200 dark:border-slate-700 rounded-3xl bg-slate-50 dark:bg-slate-900/50 overflow-hidden relative shadow-inner">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 z-20 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('map_layout')}</h3>
        {canEdit && (
          <div className="flex items-center gap-2">
            {!isEditMode ? (
              <button
                onClick={() => setIsEditMode(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 rounded-lg hover:bg-blue-200 transition"
              >
                <MousePointer2 className="w-3.5 h-3.5" /> {t('edit')}
              </button>
            ) : (
              <>
                <button
                  onClick={addTable}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" /> {t('add_table')}
                </button>
                <button
                  onClick={saveLayout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md"
                >
                  <Save className="w-3.5 h-3.5" /> {t('save')}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Map Area */}
        <div 
          ref={containerRef}
          className="flex-1 relative overflow-auto bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] touch-none"
          onClick={() => isEditMode && setSelectedForEdit(null)}
        >
          {localTables.map(t => {
            const isPositioned = t.x !== undefined && t.y !== undefined;
            const w = t.width || 80;
            const h = t.height || 80;
            const isSelected = isEditMode && selectedForEdit === t.id;
            
            return (
              <motion.div
                key={t.id}
                drag={isEditMode}
                dragMomentum={false}
                dragConstraints={containerRef}
                onDragEnd={(e, info) => {
                  if(!isEditMode) return;
                  setLocalTables(prev => prev.map(tbl => 
                    tbl.id === t.id 
                    ? { ...tbl, x: (tbl.x || 0) + info.offset.x, y: (tbl.y || 0) + info.offset.y } 
                    : tbl
                  ));
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isEditMode) setSelectedForEdit(t.id);
                  else onTableClick(t);
                }}
                initial={{
                  x: isPositioned ? t.x : (t.number * 90) % 600,
                  y: isPositioned ? t.y : Math.floor((t.number * 90) / 600) * 90 + 20,
                  rotate: t.rotation || 0
                }}
                animate={{
                  rotate: t.rotation || 0
                }}
                style={{
                  width: w,
                  height: h,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  borderRadius: t.shape === 'ROUND' ? '50%' : t.shape === 'SQUARE' ? '12px' : '8px',
                }}
                className={`cursor-${isEditMode ? 'move' : 'pointer'} flex flex-col items-center justify-center shadow-md border-2 transition-colors ${
                  isSelected ? 'border-indigo-500 ring-4 ring-indigo-500/30 z-10' :
                  t.status === 'AVAILABLE' ? 'bg-emerald-100 border-emerald-400 dark:bg-emerald-900/60 dark:border-emerald-600 text-emerald-800 dark:text-emerald-200' :
                  t.status === 'OCCUPIED' ? 'bg-amber-100 border-amber-400 dark:bg-amber-900/60 dark:border-amber-600 text-amber-800 dark:text-amber-200' :
                  t.status === 'WAITING_ORDER' ? 'bg-rose-100 border-rose-400 dark:bg-rose-900/60 dark:border-rose-600 text-rose-800 dark:text-rose-200 animate-pulse' :
                  'bg-blue-100 border-blue-400 dark:bg-blue-900/60 dark:border-blue-600 text-blue-800 dark:text-blue-200'
                }`}
              >
                <span className="text-xl font-black">{t.number}</span>
                <span className="text-[10px] font-bold opacity-80">{t.capacity}</span>
                
                {isSelected && (
                  <div className="absolute -top-3 -right-3 flex gap-1 bg-white dark:bg-slate-800 p-1 rounded-full shadow-lg border border-slate-200 dark:border-slate-700">
                    <button onClick={(e) => duplicateTable(t.id, e)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-blue-500">
                      <Copy className="w-3 h-3" />
                    </button>
                    <button onClick={(e) => removeTable(t.id, e)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-rose-500">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Properties Sidebar (Visible only in edit mode with a selection) */}
        {isEditMode && selectedTableObj && (
          <div className="w-64 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 p-4 flex flex-col gap-4 overflow-y-auto">
            <h4 className="text-sm font-bold flex items-center gap-2 mb-2">
              <Settings2 className="w-4 h-4" />
              {tr("Stol Parametrlari")}
            </h4>
            
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">{tr("Stol №")}</label>
              <input 
                type="number" 
                value={selectedTableObj.number}
                onChange={e => updateSelected({ number: parseInt(e.target.value) || 0 })}
                className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">{tr("Sig'imi (Kishi)")}</label>
              <input 
                type="number" 
                value={selectedTableObj.capacity}
                onChange={e => updateSelected({ capacity: parseInt(e.target.value) || 2 })}
                className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{tr("Shakli")}</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => updateSelected({ shape: 'RECTANGLE', width: 120, height: 80 })}
                  className={`flex-1 p-2 rounded-lg border ${selectedTableObj.shape === 'RECTANGLE' || !selectedTableObj.shape ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'} flex justify-center`}
                >
                  <Grid2x2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => updateSelected({ shape: 'SQUARE', width: 90, height: 90 })}
                  className={`flex-1 p-2 rounded-lg border ${selectedTableObj.shape === 'SQUARE' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'} flex justify-center`}
                >
                  <Square className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => updateSelected({ shape: 'ROUND', width: 90, height: 90 })}
                  className={`flex-1 p-2 rounded-lg border ${selectedTableObj.shape === 'ROUND' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'} flex justify-center`}
                >
                  <Circle className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">{tr("Kengligi")}</label>
                <input 
                  type="number" 
                  value={selectedTableObj.width || 80}
                  onChange={e => updateSelected({ width: parseInt(e.target.value) || 80 })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">{tr("Uzunligi")}</label>
                <input 
                  type="number" 
                  value={selectedTableObj.height || 80}
                  onChange={e => updateSelected({ height: parseInt(e.target.value) || 80 })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{tr("Aylantirish")}</label>
              <div className="flex items-center gap-2">
                <input 
                  type="range" 
                  min="0" max="360" step="15"
                  value={selectedTableObj.rotation || 0}
                  onChange={e => updateSelected({ rotation: parseInt(e.target.value) || 0 })}
                  className="flex-1 accent-blue-600"
                />
                <span className="text-xs font-bold w-8 text-right">{selectedTableObj.rotation || 0}°</span>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
