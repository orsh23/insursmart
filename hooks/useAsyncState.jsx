import { useState, useCallback } from 'react';

export default function useAsyncState(asyncFunction, initialState = null) {
  const [data, setData] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const execute = useCallback(async (...args) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await asyncFunction(...args);
      setData(result);
      return result;
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [asyncFunction]);
  
  const reset = useCallback(() => {
    setData(initialState);
    setError(null);
    setIsLoading(false);
  }, [initialState]);
  
  return {
    data,
    isLoading,
    error,
    execute,
    reset,
    setData
  };
}