import { useState, useCallback, useEffect } from 'react';
import { InsuredPerson } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/components/context/LanguageContext';

export function useInsuredPersonForm(initialData = null, onSuccess) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getInitialState = useCallback(() => ({
    full_name: '',
    date_of_birth: '',
    gender: '', // Consider a default like 'other' or make it required
    phone: '',
    email: '',
    address: '',
    city: '',
    ...(initialData || {}),
    // Ensure identification is an object even if initialData.identification is null/undefined
    identification: {
        type: initialData?.identification?.type || '',
        number: initialData?.identification?.number || '',
    },
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

  const handleNestedChange = useCallback((parentField, childField, value) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: value,
      },
    }));
    if (errors[parentField]?.[childField] || errors[parentField]) {
        setErrors(prev => {
            const newErrors = { ...prev };
            if (newErrors[parentField] && typeof newErrors[parentField] === 'object') {
                delete newErrors[parentField][childField];
                if (Object.keys(newErrors[parentField]).length === 0) {
                    delete newErrors[parentField];
                }
            } else if (newErrors[parentField]) {
                 delete newErrors[parentField]; // If error was on parent object itself
            }
            return newErrors;
        });
    }
  }, [errors]);
  
  const validate = useCallback(() => {
    const newErrors = {};
    if (!formData.full_name?.trim()) {
      newErrors.full_name = t('validation.required', { field: t('insuredPersons.fullName') });
    }
    if (!formData.identification?.type) {
      if (!newErrors.identification) newErrors.identification = {};
      newErrors.identification.type = t('validation.required', { field: t('insuredPersons.idType') });
    }
    if (!formData.identification?.number?.trim()) {
      if (!newErrors.identification) newErrors.identification = {};
      newErrors.identification.number = t('validation.required', { field: t('insuredPersons.idNumber') });
    }
    // Add more validations as needed (e.g., date_of_birth format, email format)
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
      // Ensure identification is properly structured
      if (!dataToSave.identification) {
        dataToSave.identification = { type: '', number: ''};
      }


      if (initialData?.id) {
        savedData = await InsuredPerson.update(initialData.id, dataToSave);
        toast({ title: t('insuredPersons.updateSuccess') });
      } else {
        savedData = await InsuredPerson.create(dataToSave);
        toast({ title: t('insuredPersons.createSuccess') });
      }
      if (onSuccess) onSuccess(savedData);
      return true;
    } catch (error) {
      console.error("Error saving insured person:", error);
      const errorMessage = error.response?.data?.detail || error.message || t('insuredPersons.saveError');
      toast({ variant: "destructive", title: t('insuredPersons.saveError'), description: errorMessage });
      
      // Potentially set form-level errors if API returns field-specific errors
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
    handleNestedChange,
    handleSubmit,
    resetForm,
  };
}