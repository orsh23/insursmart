
import React, { createContext, useState, useEffect, useContext } from 'react';
import { User } from '@/api/entities';
import { translations, DEFAULT_LANGUAGE, RTL_LANGUAGES, interpolate } from '@/components/utils/i18n-utils'; // Assuming i18n-utils exists

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [isRTL, setIsRTL] = useState(RTL_LANGUAGES.includes(DEFAULT_LANGUAGE));

  // Translation function
  const t = (key, params = {}) => {
    const keys = key.split('.');
    let current = translations[language] || translations.en;

    for (const k of keys) {
      if (current && typeof current === 'object' && Object.prototype.hasOwnProperty.call(current, k)) {
        current = current[k];
      } else {
        // Fallback to English if key not found in current language
        let fallbackCurrent = translations.en;
        for (const fk of keys) {
          if (fallbackCurrent && typeof fallbackCurrent === 'object' &&
              Object.prototype.hasOwnProperty.call(fallbackCurrent, fk)) {
            fallbackCurrent = fallbackCurrent[fk];
          } else {
            return Object.prototype.hasOwnProperty.call(params, 'defaultValue') ? params.defaultValue : key;
          }
        }
        current = fallbackCurrent;
        break;
      }
    }

    if (typeof current === 'string') {
      return interpolate(current, params);
    }
    return Object.prototype.hasOwnProperty.call(params, 'defaultValue') ? params.defaultValue : key;
  };

  // Action to set language
  const updateLanguage = async (newLanguage) => {
    if (translations[newLanguage]) {
      try {
        // Optimistically update UI
        setLanguage(newLanguage);
        setIsRTL(RTL_LANGUAGES.includes(newLanguage));
        await User.updateMyUserData({ preferred_language: newLanguage });
      } catch (error) {
        console.error("Failed to save language preference:", error);
        // Revert if API call fails (optional, or show error toast)
        // For simplicity, not reverting here but logging error.
      }
    } else {
      console.warn(`Language '${newLanguage}' not supported.`);
    }
  };

  // Action to initialize language from user data
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        const currentUser = await User.me();
        if (currentUser && currentUser.preferred_language && translations[currentUser.preferred_language]) {
          setLanguage(currentUser.preferred_language);
          setIsRTL(RTL_LANGUAGES.includes(currentUser.preferred_language));
        } else {
          // If no user preference or invalid, keep default or set a fallback
          setLanguage(DEFAULT_LANGUAGE);
          setIsRTL(RTL_LANGUAGES.includes(DEFAULT_LANGUAGE));
        }
      } catch (err) {
        console.warn("Could not fetch user language, using default.", err);
        setLanguage(DEFAULT_LANGUAGE);
        setIsRTL(RTL_LANGUAGES.includes(DEFAULT_LANGUAGE));
      }
    };

    initializeLanguage();
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: updateLanguage, isRTL, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export default LanguageContext;
