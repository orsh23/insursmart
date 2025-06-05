import React, { useState, useEffect } from 'react';

export default function NetworkErrorHandler({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    // Handle online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Global error handler for fetch/API failures
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (response.status >= 500) {
          setApiError('Server error. Please try again later.');
        }
        return response;
      } catch (error) {
        setApiError('Network error. Please check your connection.');
        throw error;
      }
    };
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.fetch = originalFetch;
    };
  }, []);
  
  // Clear API error after 5 seconds
  useEffect(() => {
    if (apiError) {
      const timer = setTimeout(() => setApiError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [apiError]);
  
  if (!isOnline) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-center p-6 max-w-md">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 text-red-500 mx-auto mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
          <h2 className="text-xl font-bold mb-2">You're offline</h2>
          <p className="mb-4">
            Please check your internet connection and try again.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <>
      {apiError && (
        <div className="fixed top-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md z-50 animate-in fade-in slide-in-from-right">
          <div className="flex">
            <div className="py-1">
              <svg 
                className="h-6 w-6 text-red-500 mr-4" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            <div>
              <p className="font-bold">Network Error</p>
              <p className="text-sm">{apiError}</p>
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
}