// Content of components/hooks/useModal.js
import { useState, useCallback } from 'react';

/**
 * Hook to manage modal visibility and data.
 * @param {boolean} initialVisibility - Initial visibility state of the modal.
 * @param {any} initialData - Initial data to be passed to the modal.
 * @returns {{
 *  isModalOpen: boolean,
 *  modalData: any,
 *  openModal: (data?: any) => void,
 *  closeModal: () => void,
 *  toggleModal: (data?: any) => void,
 *  setModalData: (data: any) => void
 * }}
 */
export default function useModal(initialVisibility = false, initialData = null) {
  const [isModalOpen, setIsModalOpen] = useState(initialVisibility);
  const [modalData, setModalData] = useState(initialData);

  const openModal = useCallback((data = null) => {
    setModalData(data);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    // Optionally clear data on close, depending on requirements
    // setModalData(null); 
  }, []);

  const toggleModal = useCallback((data = null) => {
    setIsModalOpen(prev => {
      const newOpenState = !prev;
      if (newOpenState) { // If opening
        if (data !== null) { // Only set data if provided, otherwise keep existing
            setModalData(data);
        }
      } else { // If closing
        // Optionally clear data: setModalData(null);
      }
      return newOpenState;
    });
  }, []);


  return {
    isModalOpen,
    modalData,
    openModal,
    closeModal,
    toggleModal,
    setModalData, // Allow direct setting of modal data if needed
  };
}