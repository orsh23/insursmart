// Simple environment check utilities
export const isDevelopment = () => true;
export const isProduction = () => false;
export const isBrowser = () => typeof window !== 'undefined';
export const isServer = () => typeof window === 'undefined';