// Content of components/hooks/useOutsideClick.js
import { useEffect, useRef } from 'react';

/**
 * Custom hook to detect clicks outside a specified element.
 * @param {Function} callback - Function to call when a click outside is detected.
 * @param {boolean} isActive - Optional flag to enable/disable the hook. Defaults to true.
 * @returns {React.RefObject} Ref to attach to the element to monitor.
 */
export default function useOutsideClick(callback, isActive = true) {
  const ref = useRef(null);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    // Add event listener for mousedown for better responsiveness than click
    document.addEventListener('mousedown', handleClickOutside);
    // For touch devices
    document.addEventListener('touchstart', handleClickOutside);


    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [ref, callback, isActive]); // Include isActive in dependencies

  return ref;
}