import React, { createContext, useContext, useState, useEffect } from 'react';

const AppStoreContext = createContext(undefined);

export const useAppStore = () => {
  const context = useContext(AppStoreContext);
  if (context === undefined) {
    // Instead of throwing an error, return a default object with the expected properties
    return {
      theme: 'light',
      setTheme: () => {},
      sidebarOpen: true,
      setSidebarOpen: () => {},
      toggleSidebar: () => {},
    };
  }
  return context;
};

export const AppStoreProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

  const [sidebarOpen, setSidebarOpenState] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('sidebarOpen');
      return savedState !== null ? JSON.parse(savedState) : true;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
    }
  }, [sidebarOpen]);

  const setTheme = (newTheme) => setThemeState(newTheme);
  const toggleSidebar = () => setSidebarOpenState(prev => !prev);

  const value = {
    theme,
    setTheme,
    sidebarOpen,
    setSidebarOpen: setSidebarOpenState,
    toggleSidebar,
  };

  return (
    <AppStoreContext.Provider value={value}>
      {children}
    </AppStoreContext.Provider>
  );
};