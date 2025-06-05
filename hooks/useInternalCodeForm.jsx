import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { InternalCode } from '@/api/entities';
import { useLanguage } from '@/components/context/LanguageContext';
import { createMessage } from '@/components/utils/messages';

export function useInternalCodeForm(initialCode = null, onSuccess, dialogOpen = false) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const getInitialState = () => ({
    code_number: '',
    description_en: '',
    description_he: '',
    category_id: '',
    category_path: '',
    tags: [],
    is_billable: true,
    is_active: true,
    ...(initialCode ? {
      ...initialCode,
      tags: initialCode.tags || [],
    } : {})
  });

  const [formData, setFormData] = useState(getInitialState());
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog closes
  useEffect(() => {
    if (!dialogOpen) {
      resetForm();
    }
  }, [dialogOpen]);

  // Reset form when initial data changes
  useEffect(() => {
    setFormData(getInitialState());
  }, [initialCode]);

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (Object.prototype.hasOwnProperty.call(errors, field)) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  const validate = useCallback(() => {
    const newErrors = {};
    if (!formData.code_number?.trim()) {
      newErrors.code_number = t('validation.required', { field: t('internalCodes.codeNumber') });
    }
    if (!formData.description_en?.trim() && !formData.description_he?.trim()) {
      newErrors.description_en = t('validation.requiredEither', { field: t('internalCodes.descriptionEn') });
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  const resetForm = useCallback(() => {
    setFormData(getInitialState());
    setErrors({});
    setIsSubmitting(false);
  }, []);

  const handleSubmit = useCallback(async (event) => {
    if (event) event.preventDefault();
    if (!validate()) return false;

    setIsSubmitting(true);
    try {
      let savedCode;
      if (initialCode?.id) {
        savedCode = await InternalCode.update(initialCode.id, formData);
        toast(createMessage(t, 'success', 'update', 'internalCode'));
      } else {
        savedCode = await InternalCode.create(formData);
        toast(createMessage(t, 'success', 'create', 'internalCode'));
      }
      if (onSuccess) onSuccess(savedCode);
      return true;
    } catch (error) {
      console.error("Error saving internal code:", error);
      toast(createMessage(t, 'error', initialCode?.id ? 'update' : 'create', 'internalCode', error));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, initialCode, onSuccess, t, toast, validate]);

  return {
    formData,
    errors,
    isSubmitting,
    updateField,
    handleSubmit,
    resetForm,
    validate
  };
}