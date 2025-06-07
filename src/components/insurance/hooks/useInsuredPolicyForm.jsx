import { useState, useCallback, useEffect } from 'react';
import { InsuredPolicy } from '@/api/entities'; // Entity for InsuredPolicy links
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/components/context/LanguageContext';

export function useInsuredPolicyForm(initialData = null, onSuccess) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getInitialState = useCallback(() => ({
    insured_id: '',
    policy_id: '',
    coverage_type: 'primary', // Default value
    start_date: '',
    end_date: null, // Optional
    active_flag: true, // Default value
    policy_number: '', // External policy number
    group_number: '', // Optional
    relationship_to_primary: 'self', // Default value
    notes: '',
    ...(initialData || {})
  }), [initialData]);

  const [formData, setFormData] = useState(getInitialState());
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData(getInitialState());
    setErrors({});
  }, [initialData, getInitialState]);

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);
  
  const validate = useCallback(() => {
    const newErrors = {};
    if (!formData.insured_id) {
      newErrors.insured_id = t('validation.required', { field: t('policyLinkage.insuredPerson') });
    }
    if (!formData.policy_id) {
      newErrors.policy_id = t('validation.required', { field: t('policyLinkage.policy') });
    }
    if (!formData.start_date) {
      newErrors.start_date = t('validation.required', { field: t('policyLinkage.startDate') });
    }
    if (!formData.coverage_type) {
      newErrors.coverage_type = t('validation.required', { field: t('policyLinkage.coverageType') });
    }
    // Add more validations if needed
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  const resetForm = useCallback(() => {
    setFormData(getInitialState());
    setErrors({});
  }, [getInitialState]);

  const handleSubmit = useCallback(async (event) => {
    if (event) event.preventDefault();
    if (!validate()) return false;

    setIsSubmitting(true);
    try {
      let savedData;
      const dataToSave = { ...formData };
      // Ensure end_date is null if empty string, or formatted correctly
      if (dataToSave.end_date === '') dataToSave.end_date = null;


      if (initialData?.id) {
        savedData = await InsuredPolicy.update(initialData.id, dataToSave);
        toast({ title: t('policyLinkage.updateSuccess') });
      } else {
        savedData = await InsuredPolicy.create(dataToSave);
        toast({ title: t('policyLinkage.createSuccess') });
      }
      if (onSuccess) onSuccess(savedData);
      return true;
    } catch (error) {
      console.error("Error saving policy linkage:", error);
      const errorMessage = error.response?.data?.detail || error.message || t('policyLinkage.saveError');
      toast({ variant: "destructive", title: t('policyLinkage.saveError'), description: errorMessage });
      if (error.response?.data?.errors) {
        setErrors(prev => ({...prev, ...error.response.data.errors}));
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, initialData, onSuccess, t, toast, validate]);

  return {
    formData,
    errors,
    isSubmitting,
    updateField,
    handleSubmit,
    resetForm,
  };
}