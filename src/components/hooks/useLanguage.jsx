// Content of components/hooks/useLanguage.js
import { useContext } from 'react';
import { LanguageContext } from '@/components/LanguageContext'; 

/**
 * Custom hook to access language context.
 * Provides current language, setter function, translation function (t), and RTL status.
 * @returns {{
 *  language: string,
 *  setLanguage: (lang: string) => void,
 *  t: (key: string, options?: object) => string,
 *  isRTL: boolean,
 *  languageDirection: 'ltr' | 'rtl'
 * }}
 * @throws {Error} if used outside of a LanguageProvider.
 */
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    // This error means you've forgotten to wrap your app (or part of it)
    // in a <LanguageProvider>.
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};