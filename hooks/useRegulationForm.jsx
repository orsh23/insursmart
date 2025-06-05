import { useState, useCallback, useEffect } from 'react';
import { Regulation } from '../.@/api/entities/Regulation'; // Ensure correct path
import { useToast } from '../ui/use-toast';
import { useTranslation } from '../utils/i18n';
import { messages } from '../utils/messages'; // Ensure this path is correct and file exists

const getInitialFormData = (initialData) => {
  const defaults = {
    title_en: '',
    title_he: '',
    description_en: '',
    description_he: '',
    regulation_type: (REGULATION_TYPES.length > 0 ? REGULATION_TYPES[0].value : ''), // Assuming REGULATION_TYPES is defined
    is_active: true,
    effective_date: null, // Use null for dates for DatePicker
    end_date: null,
    document_url: '',
    tags: [],
    id: null,
  };
  if (initialData && typeof initialData === 'object') {
    return {
      ...defaults,
      ...initialData,
      // Ensure dates are valid Date objects or null for DatePicker
      effective_date: initialData.effective_date ? new Date(initialData.effective_date) : null,
      end_date: initialData.end_date ? new Date(initialData.end_date) : null,
      tags: Array.isArray(initialData.tags) ? initialData.tags : [],
    };
  }
  return defaults;
};

// Define REGULATION_TYPES here or ensure it's imported and available
// This should ideally come from constants.js and be used by getRegulationTypeOptions
const REGULATION_TYPES = [
    { value: "Insurance", labelKey: "regulationTypes.insurance" },
    { value: "Healthcare", labelKey: "regulationTypes.healthcare" },
    { value: "Internal", labelKey: "regulationTypes.internal" },
    { value: "Legal", labelKey: "regulationTypes.legal" },
    { value: "Other", labelKey: "regulationTypes.other" },
];


export function useRegulationForm(initialDataProp, onSaveSuccessCallback) {
    const { t } = useTranslation();
    const { toast } = useToast();

    const [formData, setFormData] = useState(() => getInitialFormData(initialDataProp));
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Effect to synchronize formData when initialDataProp changes
    useEffect(() => {
        setFormData(getInitialFormData(initialDataProp));
        setFormErrors({}); // Clear errors when data changes
    }, [initialDataProp]);

    const updateField = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors[field];
                return newErrors;
            });
        }
    }, [formErrors]);

    const validateForm = useCallback(() => {
        const errors = {};
        if (!formData.title_en && !formData.title_he) {
            errors.title_en = t('validation.requiredEither', { field: t('regulations.title') });
        }
        if (!formData.regulation_type) {
            errors.regulation_type = t('validation.required', { field: t('regulations.type') });
        }
        if (!formData.effective_date) {
            errors.effective_date = t('validation.required', { field: t('regulations.effectiveDate') });
        }
        // Add more validations as needed (e.g., date logic, URL format)
        if (formData.end_date && formData.effective_date && new Date(formData.end_date) < new Date(formData.effective_date)) {
            errors.end_date = t('validation.endDateAfterStartDate', { defaultValue: 'End date must be after effective date.' });
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData, t]);

    const resetForm = useCallback((dataToResetTo) => {
        // If specific data is provided for reset, use it, otherwise use initialDataProp
        const effectiveInitialData = dataToResetTo !== undefined ? dataToResetTo : initialDataProp;
        setFormData(getInitialFormData(effectiveInitialData));
        setFormErrors({});
    }, [initialDataProp]); // Dependency on initialDataProp ensures resetForm "knows" the latest initial data

    const handleFormSubmit = useCallback(async (event) => {
        if (event) event.preventDefault(); // Prevent default if it's a form event
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const dataToSave = { ...formData };
            // Ensure dates are in ISO string format for saving, if they are Date objects
            if (dataToSave.effective_date instanceof Date) {
                dataToSave.effective_date = dataToSave.effective_date.toISOString().split('T')[0];
            }
            if (dataToSave.end_date instanceof Date) {
                dataToSave.end_date = dataToSave.end_date.toISOString().split('T')[0];
            }


            if (onSaveSuccessCallback) {
                 // onSaveSuccessCallback is the 'onSubmit' prop from RegulationDialog,
                 // which is 'handleSubmit' from Regulations.jsx.
                 // This 'handleSubmit' expects the raw form data and handles create/update.
                await onSaveSuccessCallback(dataToSave);
            }
            // Success toast is handled by the parent component's handleSubmit

        } catch (error) {
            console.error("Error saving regulation:", error);
            toast(messages.error(t, error.message || 'Failed to save regulation.'));
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, validateForm, onSaveSuccessCallback, toast, t]);

    return {
        formData,
        formErrors,
        isSubmitting,
        updateField,
        handleFormSubmit,
        resetForm,
        setFormData, // Expose setFormData if direct manipulation is needed
    };
}