// Content of components/hooks/useFormState.js
import { useState, useCallback, useEffect } from 'react'; // Added useEffect

/**
 * A generic hook to manage form state, including dirty checking and reset.
 * @param {Object} initialValues - The initial values for the form.
 * @returns {Object} - { values, handleChange, handleSubmit, resetForm, isDirty, setValues }
 */
export default function useFormState(initialValues = {}) {
  const [values, setValues] = useState(initialValues);
  const [isDirty, setIsDirty] = useState(false);

  // Store initial values separately to compare for dirty state
  const [originalValues, setOriginalValues] = useState(JSON.parse(JSON.stringify(initialValues))); // Deep copy

  const handleChange = useCallback((eventOrName, value) => {
    setIsDirty(true); // Mark as dirty on any change
    if (typeof eventOrName === 'string') {
      // Handling direct name-value pair (e.g., for custom components)
      setValues(prevValues => ({
        ...prevValues,
        [eventOrName]: value,
      }));
    } else {
      // Handling standard input event
      const { name, value: inputValue, type, checked } = eventOrName.target;
      setValues(prevValues => ({
        ...prevValues,
        [name]: type === 'checkbox' ? checked : inputValue,
      }));
    }
  }, []);
  
  // Allows setting multiple values at once, e.g., from an API response or a reset
  const setFormValues = useCallback((newValues, resetDirtyState = false) => {
    setValues(newValues);
    if (resetDirtyState) {
      setOriginalValues(JSON.parse(JSON.stringify(newValues))); // Update original values
      setIsDirty(false);
    } else {
      // Check if newValues make the form dirty compared to original
      setIsDirty(JSON.stringify(newValues) !== JSON.stringify(originalValues));
    }
  }, [originalValues]);


  const handleSubmit = useCallback((onSubmitCallback) => (event) => {
    if (event) {
      event.preventDefault();
    }
    if (typeof onSubmitCallback === 'function') {
      onSubmitCallback(values);
    }
    // Optionally, after successful submission, you might want to reset dirty state
    // For example, by updating originalValues to current values
    // setOriginalValues(JSON.parse(JSON.stringify(values)));
    // setIsDirty(false);
  }, [values]);

  const resetForm = useCallback(() => {
    setValues(originalValues); // Reset to original values
    setIsDirty(false);
  }, [originalValues]);
  
  // Check if form is dirty (more robustly)
  useEffect(() => {
    setIsDirty(JSON.stringify(values) !== JSON.stringify(originalValues));
  }, [values, originalValues]);


  return {
    values,
    handleChange,
    handleSubmit,
    resetForm,
    isDirty,
    setValues: setFormValues, // Renamed for clarity from raw setValues to setFormValues
  };
}