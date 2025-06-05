import { useState, useCallback } from 'react';

/**
 * Hook to manage entity dialog open/close state and the current entity being edited
 * 
 * @returns {Object} Dialog state management functions and state
 */
export function useDialogState() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentEntity, setCurrentEntity] = useState(null);

  const openDialog = useCallback((entity = null) => {
    setCurrentEntity(entity);
    setIsDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    // Don't clear entity immediately to avoid UI flickering during dialog close animation
    // The form reset will happen before next dialog open
    setTimeout(() => {
      setCurrentEntity(null);
    }, 300); // Reasonable timeout for dialog close animation
  }, []);

  return {
    isDialogOpen,
    currentEntity,
    openDialog,
    closeDialog,
  };
}