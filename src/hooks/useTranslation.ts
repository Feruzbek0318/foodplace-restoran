import { useState, useEffect } from 'react';
import { store } from '../services/store';
import { t } from '../locales';

export function useTranslation() {
  const [lang, setLang] = useState(store.settings.language || 'uz');

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      if (store.settings.language !== lang) {
        setLang(store.settings.language || 'uz');
      }
    });
    return unsubscribe;
  }, [lang]);

  return { t, lang };
}
