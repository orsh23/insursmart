import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTranslation } from './translations';

// Language Context
const LanguageContext = createContext();

// Language Provider Component
export function LanguageProvider({ children, defaultLanguage = 'en' }) {
  const [language, setLanguage] = useState(() => {
    // Check localStorage first, then fall back to default
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('app_language');
      if (stored && ['en', 'he'].includes(stored)) {
        return stored;
      }
    }
    return defaultLanguage;
  });

  const [isRTL, setIsRTL] = useState(language === 'he');

  // Update RTL state when language changes
  useEffect(() => {
    const newIsRTL = language === 'he';
    setIsRTL(newIsRTL);
    
    // Update document direction
    if (typeof document !== 'undefined') {
      document.documentElement.dir = newIsRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
    
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_language', language);
    }
  }, [language]);

  // Translation function
  const t = React.useCallback((key, options = {}) => {
    return getTranslation(language, key, options);
  }, [language]);

  // Change language function
  const changeLanguage = React.useCallback((newLanguage) => {
    if (['en', 'he'].includes(newLanguage) && newLanguage !== language) {
      setLanguage(newLanguage);
    }
  }, [language]);

  const value = {
    language,
    setLanguage: changeLanguage,
    isRTL,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook to use language context
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// For backwards compatibility, also export the hook with the original name
export const useLanguageHook = useLanguage;