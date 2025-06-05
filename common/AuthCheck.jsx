import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';

export default function AuthCheck({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await User.me();
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
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
              d="M12 15v2m0 0l-3 3m3-3l3 3m0 0v-2m0 0l-3-3m3 3l3-3M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" 
            />
          </svg>
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to access this application.</p>
          <button
            onClick={() => User.login()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return children;
}