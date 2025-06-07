// Content of components/hooks/useSearchParamsSync.js
import { useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom'; // Assuming react-router-dom is used

/**
 * A hook to synchronize state with URL search parameters.
 * @param {Object} state - The state object to sync.
 * @param {Function} setState - The function to update the state.
 * @param {Object} initialState - The initial state to compare against for default values.
 * @param {Array<string>} omitKeys - Optional array of keys to omit from URL sync.
 */
export default function useSearchParamsSync(state, setState, initialState = {}, omitKeys = []) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Effect to update state from URL on initial load or URL change
  useEffect(() => {
    const newStateFromUrl = { ...initialState }; // Start with defaults
    let changed = false;
    searchParams.forEach((value, key) => {
      if (omitKeys.includes(key)) return;

      try {
        // Attempt to parse JSON for arrays/objects, otherwise use as string
        const parsedValue = JSON.parse(value);
        newStateFromUrl[key] = parsedValue;
      } catch (e) {
        // If not JSON, check for boolean strings or keep as string
        if (value === 'true') newStateFromUrl[key] = true;
        else if (value === 'false') newStateFromUrl[key] = false;
        else newStateFromUrl[key] = value;
      }
      if (JSON.stringify(state[key]) !== JSON.stringify(newStateFromUrl[key])) {
        changed = true;
      }
    });
    
    // Also remove keys from state if they are not in URL but were in initialState
    Object.keys(initialState).forEach(key => {
        if(!searchParams.has(key) && !omitKeys.includes(key) && state.hasOwnProperty(key)) {
            if (state[key] !== initialState[key]) { // Only mark changed if different from initial default
                newStateFromUrl[key] = initialState[key]; // Reset to initial default
                changed = true;
            }
        }
    });


    if (changed) {
        // Update the local state only if it differs from what's derived from URL + defaults
        // This check helps prevent infinite loops if setState causes re-renders that re-trigger this effect.
        if (JSON.stringify(state) !== JSON.stringify(newStateFromUrl)) {
            setState(newStateFromUrl);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setState, JSON.stringify(initialState), JSON.stringify(omitKeys)]); // Stringify complex deps


  // Effect to update URL from state when state changes
  useEffect(() => {
    const newSearchParams = new URLSearchParams();
    Object.entries(state).forEach(([key, value]) => {
      if (omitKeys.includes(key)) return;

      // Only add to URL if not the initial default value or if explicitly different
      // This keeps the URL cleaner by omitting default parameters.
      const initialValue = initialState[key];
      if (JSON.stringify(value) !== JSON.stringify(initialValue) && value !== undefined ) {
         if (typeof value === 'object' || Array.isArray(value)) {
            newSearchParams.set(key, JSON.stringify(value));
        } else {
            newSearchParams.set(key, String(value));
        }
      }
    });
    
    // Only update search params if they've actually changed from current URL
    // This prevents unnecessary history entries.
    if (newSearchParams.toString() !== searchParams.toString()) {
        setSearchParams(newSearchParams, { replace: true }); // Use replace to avoid too many history entries
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, setSearchParams, JSON.stringify(initialState), JSON.stringify(omitKeys)]); // Stringify complex deps

  // No return value needed as this hook manages side effects.
}