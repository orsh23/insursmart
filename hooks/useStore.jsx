import { useState, useCallback } from 'react';

// This is a simple hook-based store replacement for Zustand
export function createStore(initialState = {}) {
  // Create a custom hook that components can use
  return function useCustomStore() {
    const [state, setState] = useState(initialState);
    
    const updateState = useCallback((updater) => {
      setState(prevState => {
        // Handle function or object updates
        const newState = typeof updater === 'function' 
          ? updater(prevState) 
          : { ...prevState, ...updater };
        return newState;
      });
    }, []);
    
    return [state, updateState];
  };
}

// Create app-level stores here
export const useAppSettingsStore = createStore({
  language: 'he',
  theme: 'light',
  isMenuOpen: false
});

export const useAuthStore = createStore({
  user: null,
  isLoading: true,
  userRole: null,
  error: null
});

export const useUIStore = createStore({
  activeTab: null,
  modalOpen: false,
  modalContent: null,
  toasts: []
});