// hooks/useSearchParamsSync.js
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Sync React state with URL search params
 * @param {object} params - key-value pairs to sync to URL
 * @param {Array<string>} dependencies - keys to watch for change
 */
export default function useSearchParamsSync(params, dependencies = []) {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    for (const key of dependencies) {
      const value = params[key];
      if (value != null && value !== '') {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    }
    setSearchParams(newParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies.map(key => params[key]));

  return searchParams;
}