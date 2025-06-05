import { useState, useEffect, useCallback } from 'react';
import { saveToStorage, loadFromStorage } from '@/components/utils/storage';

/**
 * Hook for persisting filter state to localStorage
 * 
 * @param {string} storageKey Key for localStorage
 * @param {Object} defaultFilters Default filter values
 * @returns {[Object, Function, Function]} [filters, setFilters, resetFilters]
 */
export function useFilterPersistence(storageKey, defaultFilters = {}) {
  // Load initial filters from storage or use defaults
  const [filters, setFiltersState] = useState(() => 
    loadFromStorage(`${storageKey}_filters`, defaultFilters)
  );
  
  // Save filters to storage whenever they change
  useEffect(() => {
    saveToStorage(`${storageKey}_filters`, filters);
  }, [filters, storageKey]);
  
  // Wrapper for setFilters
  const setFilters = useCallback((newFilters) => {
    if (typeof newFilters === 'function') {
      setFiltersState(prev => {
        const updated = newFilters(prev);
        return updated;
      });
    } else {
      setFiltersState(prev => ({ ...prev, ...newFilters }));
    }
  }, []);
  
  // Reset to defaults and clear storage
  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    saveToStorage(`${storageKey}_filters`, defaultFilters);
  }, [defaultFilters, storageKey]);
  
  return [filters, setFilters, resetFilters];
}