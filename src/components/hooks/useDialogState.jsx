// Content of components/hooks/useDialogState.js
import { useState, useCallback } from 'react';

export function useDialogState(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [dialogData, setDialogData] = useState(null); // To pass data to the dialog

  const openDialog = useCallback((data = null) => {
    setDialogData(data);
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setDialogData(null); // Clear data on close
  }, []);

  const toggleDialog = useCallback((data = null) => {
    setIsOpen(prev => !prev);
    if (isOpen) { // If closing
        setDialogData(null);
    } else if (data) { // If opening with new data
        setDialogData(data);
    }
    // If opening without data, dialogData might retain old value if not cleared by closeDialog,
    // or if toggleDialog is called to open without new data. Consider if this is desired.
  }, [isOpen]);

  return {
    isOpen,
    openDialog,
    closeDialog,
    toggleDialog,
    dialogData, // Expose data for the dialog component to use
    setIsOpen, // Allow direct control if needed, though open/close/toggle are preferred
    setDialogData, // Allow direct update of dialog data if necessary
  };
}