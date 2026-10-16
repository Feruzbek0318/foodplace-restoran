import React from 'react';
import { Globe } from 'lucide-react';
import { store } from '../../services/store';

const LANGUAGES = [
  { id: 'uz', label: "O'zbekcha" },
  { id: 'ru', label: 'Русский' },
  { id: 'en', label: 'English' },
] as const;

// Compact language picker for screens shown before sign-in (login, onboarding)
export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => (
  <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm shadow-sm ${className}`}>
    <Globe className="w-4 h-4" />
    <select
      aria-label="Language"
      className="bg-transparent outline-none cursor-pointer"
      value={store.settings.language || 'uz'}
      onChange={e => store.updateSettings({ language: e.target.value as 'uz' | 'ru' | 'en' })}
    >
      {LANGUAGES.map(l => (
        <option key={l.id} value={l.id} className="text-slate-900">
          {l.label}
        </option>
      ))}
    </select>
  </label>
);
