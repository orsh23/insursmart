// hooks/useFormState.js
import { useState, useEffect, useCallback } from 'react';

/**
 * Manage form state: dirty tracking, validation, saving
 * @param {object} initialValues
 * @returns {{ values, setField, reset, isDirty, isSaving, setSaving, touched, setTouched }}
 */
export default function useFormState(initialValues = {}) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [isSaving, setSaving] = useState(false);

  const isDirty = Object.keys(values).some(
    (key) => values[key] !== initialValues[key]
  );

  const setField = useCallback((field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setTouched({});
  }, [initialValues]);

  return {
    values,
    setField,
    reset,
    isDirty,
    isSaving,
    setSaving,
    touched,
    setTouched,
  };
}