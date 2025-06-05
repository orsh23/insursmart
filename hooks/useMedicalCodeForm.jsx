import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../ui/use-toast'; // Corrected path
import { MedicalCode } from '../.@/api/entities/MedicalCode';
import { useLanguage } from '../context/LanguageContext'; // Corrected path
import { createMessage } from '../utils/messages'; // Corrected path
import { CODE_SYSTEM_OPTIONS, CODE_STATUSES } from '../utils/constants'; // Corrected path

export function useMedicalCodeForm(initialCode = null, onSuccess, dialogOpen = false) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const getInitialState = useCallback(() => {
    const defaults = {
      id: undefined, // Explicitly undefined if not in initialCode
      code: '',
      code_system: (Array.isArray(CODE_SYSTEM_OPTIONS) && CODE_SYSTEM_OPTIONS.length > 0) 
        ? (CODE_SYSTEM_OPTIONS[0]?.value || '') 
        : '',
      description_en: '',
      description_he: '',
      tags: [],
      catalog_path: '',
      status: (Array.isArray(CODE_STATUSES) && CODE_STATUSES.length > 0) 
        ? (CODE_STATUSES[0]?.value || 'active') 
        : 'active',
    };

    if (initialCode && typeof initialCode === 'object') {
      // initialCode is a non-null object, merge it with defaults
      return {
        ...defaults, // Start with defaults
        ...initialCode, // Spread initialCode over defaults. Fields in initialCode will take precedence.
        // Ensure tags is always an array. If initialCode.tags is undefined/null, it will use defaults.tags.
        // If initialCode.tags is an array, it will be used.
        tags: Array.isArray(initialCode.tags) ? [...initialCode.tags] : defaults.tags,
      };
    }
    // initialCode is null, undefined, or not an object, return pure defaults
    return defaults;
  }, [initialCode]);

  const [formData, setFormData] = useState(() => getInitialState());
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog closes or initial code changes
  useEffect(() => {
    // Only reset if dialog is closed or if initialCode's identity has changed (or if formData is not reflecting initialCode)
    if (!dialogOpen || initialCode?.id !== formData?.id) {
      setFormData(getInitialState());
      setErrors({});
    }
  }, [dialogOpen, initialCode, getInitialState, formData?.id]);

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (Object.prototype.hasOwnProperty.call(errors, field)) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  const validate = useCallback(() => {
    const newErrors = {};
    if (!formData?.code?.trim()) {
      newErrors.code = t('validation.required', { 
        field: t('medicalCodes.codeNumber', 'Code Number') 
      });
    }
    if (!formData?.code_system) {
      newErrors.code_system = t('validation.required', { 
        field: t('medicalCodes.codeSystem', 'Code System') 
      });
    }
    if (!formData?.description_en?.trim() && !formData?.description_he?.trim()) {
      newErrors.description_en = t('validation.requiredEither', { 
        field: t('medicalCodes.descriptionEn', 'Description (English)') 
      });
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  const resetForm = useCallback(() => {
    setFormData(getInitialState());
    setErrors({});
    setIsSubmitting(false);
  }, [getInitialState]);

  const handleSubmit = useCallback(async (event) => {
    if (event) event.preventDefault();
    if (!validate()) return false;

    setIsSubmitting(true);
    try {
      let savedCode;
      const currentId = formData?.id; // Prefer formData.id as it's the editable state
      
      const payload = { ...formData };
      // Remove id from payload if it's undefined, to prevent sending it for new records
      if (payload.id === undefined) {
        delete payload.id;
      }

      if (currentId) {
        savedCode = await MedicalCode.update(currentId, payload);
        toast(createMessage(t, 'success', 'update', 'medicalCode'));
      } else {
        savedCode = await MedicalCode.create(payload);
        toast(createMessage(t, 'success', 'create', 'medicalCode'));
      }
      
      if (onSuccess) onSuccess(savedCode);
      return true;
    } catch (error) {
      console.error("Error saving medical code:", error);
      toast(createMessage(t, 'error', 
        formData?.id ? 'update' : 'create', 
        'medicalCode', 
        error
      ));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSuccess, t, toast, validate]); // Removed initialCode from dependencies as formData.id is source of truth

  return {
    formData,
    errors,
    isSubmitting,
    updateField,
    handleSubmit,
    resetForm,
    validate,
    setFormData // Expose setFormData for more complex scenarios if needed
  };
}