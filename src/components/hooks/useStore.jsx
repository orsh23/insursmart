// Content of components/hooks/useStore.js
import { useContext } from 'react';
import { AppStoreContext } // Assuming AppStoreContext is defined elsewhere and provides the Zustand store
    from '@/components/store/useAppStore'; // Adjust path as necessary

/**
 * Custom hook to access the Zustand store.
 * @param {Function} selector - A selector function to pick parts of the store's state.
 * @param {Function} [equalityFn] - Optional equality function for the selector.
 * @returns The selected state from the store.
 * @throws {Error} if used outside of an AppStoreProvider that makes the store available.
 */
const useStore = (selector, equalityFn) => {
  const store = useContext(AppStoreContext);
  if (!store) {
    throw new Error('useStore must be used within an AppStoreProvider.');
  }
  return store(selector, equalityFn);
};

export default useStore;