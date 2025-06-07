// Content of components/hooks/useAsyncState.js
import { useState, useCallback } from 'react';

/**
 * A hook to manage asynchronous operations with loading and error states.
 * @param {Function} asyncFunction - The asynchronous function to execute.
 * @param {boolean} immediate - Whether to execute the function immediately on mount.
 * @returns {Object} - { data, error, loading, execute }
 */
export default function useAsyncState(asyncFunction, immediate = false) {
  const [loading, setLoading] = useState(immediate);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setData(null);
    setError(null);
    try {
      const response = await asyncFunction(...args);
      setData(response);
      setLoading(false);
      return response;
    } catch (err) {
      setError(err);
      setLoading(false);
      // Re-throw the error so it can be caught by callers if needed
      // Or handle it globally here, e.g., via a toast notification
      // console.error("useAsyncState error:", err); 
      throw err;
    }
  }, [asyncFunction]);

  // useEffect(() => {
  //   if (immediate) {
  //     execute();
  //   }
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [execute, immediate]); // Removed 'execute' from deps if it causes re-runs due to asyncFunction identity change

  return { data, error, loading, execute, setData, setLoading, setError };
}