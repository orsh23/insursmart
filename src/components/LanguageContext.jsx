import React, { createContext, useContext, useState, useCallback } from 'react';
import { languageState } from './languageState'; // Import our global state

// Create a context that uses our global state
const LanguageContext = createContext(undefined);

// Make the provider use our global state
export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(languageState.getLanguage());

  // Update our global state when the context changes
  const updateLanguage = useCallback((newLang) => {
    setLanguage(newLang);
    languageState.setLanguage(newLang);
  }, []);

  // Subscribe to changes from the global state
  React.useEffect(() => {
    return languageState.subscribe(setLanguage);
  }, []);

  const t = useCallback((key, options) => { // Added options parameter
    return languageState.t(key, options); // Pass options to global t function
  }, [language]); // language dependency is actually handled by languageState internally

  const value = {
    language,
    setLanguage: updateLanguage,
    t,
    isRTL: language === 'he' // languageState.isRTL() might be better if it exists
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// Make useLanguage work with our global state
export function useLanguage() {
  // First try to get from context
  const context = useContext(LanguageContext);
  
  // If context exists, use it
  if (context !== undefined) {
    return context;
  }
  
  // Otherwise, return our global state directly
  // This part might indicate a setup issue if context is often undefined outside a Provider.
  // For now, keeping the direct fallback.
  console.warn("useLanguage used outside LanguageProvider, falling back to global state. This might not reflect Provider-set language if any.");
  return {
    language: languageState.getLanguage(),
    setLanguage: languageState.setLanguage,
    t: (key, options) => languageState.t(key, options), // Added options parameter
    isRTL: languageState.isRTL()
  };
}