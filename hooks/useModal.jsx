// hooks/useModal.js
import { useState, useCallback } from 'react';

/**
 * Simple modal open/close state manager
 * @returns {{ isOpen: boolean, open: Function, close: Function, toggle: Function }}
 */
export default function useModal(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle
  };
}