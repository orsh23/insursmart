// components/utils/labels.js
import { translations } from './i18n'; // Assuming translations are here

export function getLabel(key, language = 'en', fallback = '') {
  const langTranslations = translations[language] || translations.en || {};
  const keys = key.split('.');
  let current = langTranslations;

  for (const k of keys) {
    if (current && typeof current === 'object' && Object.prototype.hasOwnProperty.call(current, k)) {
      current = current[k];
    } else {
      // Fallback to English if key not found in current language
      let fallbackCurrent = translations.en || {};
      for (const fk of keys) {
        if (fallbackCurrent && typeof fallbackCurrent === 'object' && 
            Object.prototype.hasOwnProperty.call(fallbackCurrent, fk)) {
          fallbackCurrent = fallbackCurrent[fk];
        } else {
          return fallback || key; // Return key or provided fallback if not found
        }
      }
      current = fallbackCurrent;
      break;
    }
  }

  return typeof current === 'string' ? current : (fallback || key);
}