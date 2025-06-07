// Content of components/hooks/useFilterPersistence.js
import { useState, useEffect, useCallback } from 'react';

// Helper functions for local storage
const loadFromStorage = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error loading from localStorage key "${key}":`, error);
    return defaultValue;
  }
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to localStorage key "${key}":`, error);
  }
};


/**
 * A hook to manage and persist filter state using localStorage.
 * @param {string} storageKey - The localStorage key for persisting filters.
 * @param {object} initialFilters - The initial state of the filters.
 * @returns {object} - { filters, setFilter, resetFilters, setFiltersBatch }
 */
export default function useFilterPersistence(storageKey, initialFilters = {}) {
  const [filters, setFiltersState] = useState(() => {
    return loadFromStorage(storageKey, initialFilters);
  });

  // Update localStorage whenever filters change
  useEffect(() => {
    saveToStorage(storageKey, filters);
  }, [filters, storageKey]);

  const setFilter = useCallback((filterName, value) => {
    setFiltersState(prevFilters => ({
      ...prevFilters,
      [filterName]: value,
    }));
  }, []);
  
  const setFiltersBatch = useCallback((newFilters) => {
    setFiltersState(prevFilters => ({
      ...prevFilters,
      ...newFilters,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(initialFilters);
    // Optionally clear from storage too, or let useEffect handle it
    // localStorage.removeItem(storageKey); 
  }, [initialFilters]); // Removed storageKey from deps as it's constant for hook instance

  return {
    filters,
    setFilter,
    setFiltersBatch, // For setting multiple filters at once
    resetFilters,
    // Expose setFiltersState directly if more complex state updates are needed by the component
    // _setRawFilters: setFiltersState 
  };
}