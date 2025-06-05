import { useState, useEffect } from 'react';
import { User } from '@/api/entities';

export default function useLanguage(defaultLang = 'he') {
  const [language, setLanguage] = useState(defaultLang);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function loadUserLanguage() {
      try {
        setIsLoading(true);
        const userData = await User.me();
        setLanguage(userData.preferred_language || defaultLang);
      } catch (error) {
        console.error('Error loading language preferences:', error);
        setError(error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadUserLanguage();
  }, [defaultLang]);
  
  const updateLanguage = async (newLanguage) => {
    try {
      setIsLoading(true);
      await User.updateMyUserData({ preferred_language: newLanguage });
      setLanguage(newLanguage);
    } catch (error) {
      console.error('Error updating language preference:', error);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // FIXED: Always return a boolean for isRTL
  const isRTL = Boolean(language === 'he');
  
  // Development safety check
  if (typeof isRTL !== 'boolean') {
    console.warn("Warning: isRTL should be a boolean, got:", isRTL);
  }
  
  return { 
    language, 
    setLanguage: updateLanguage, 
    isRTL, 
    isLoading, 
    error 
  };
}