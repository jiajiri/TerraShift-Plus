import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import enTranslations from './en.json';
import swTranslations from './sw.json';

const translations = {
  en: enTranslations,
  sw: swTranslations,
};

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem('terrashift_lang');
      if (saved === 'sw' || saved === 'en') return saved;
    } catch (e) {
      // Ignore localStorage errors
    }
    return 'en';
  });

  const setLang = useCallback((newLang) => {
    const validLang = newLang === 'sw' ? 'sw' : 'en';
    setLangState(validLang);
    try {
      localStorage.setItem('terrashift_lang', validLang);
    } catch (e) {
      // Ignore localStorage errors
    }
    document.documentElement.lang = validLang === 'sw' ? 'sw-TZ' : 'en';
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === 'sw' ? 'sw-TZ' : 'en';
  }, [lang]);

  const t = useCallback((key, vars = {}) => {
    if (!key) return '';
    const currentDict = translations[lang] || translations.en;
    const fallbackDict = translations.en;

    // Resolve dot-notation path
    const getVal = (dict, path) => {
      if (!dict) return undefined;
      const parts = path.split('.');
      let cur = dict;
      for (const part of parts) {
        if (cur && typeof cur === 'object' && part in cur) {
          cur = cur[part];
        } else {
          return undefined;
        }
      }
      return cur;
    };

    let val = getVal(currentDict, key);
    if (val === undefined || val === null) {
      val = getVal(fallbackDict, key);
    }
    if (val === undefined || val === null) {
      return key; // return key fallback
    }

    if (typeof val !== 'string') {
      return val;
    }

    // Replace {var} templates
    return val.replace(/\{(\w+)\}/g, (match, vName) => {
      return vars[vName] !== undefined ? vars[vName] : match;
    });
  }, [lang]);

  const value = useMemo(() => ({
    lang,
    setLang,
    t,
  }), [lang, setLang, t]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}

export default I18nContext;
