import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Contract } from '@/api/entities';
import { Provider } from '@/api/entities'; // For provider selection
import { useLanguage } from '../context/LanguageContext';
import { CONTRACT_STATUSES, PAYMENT_METHODS } from '@/components/utils/constants';
import { formatDateForInput, parseDateFromInput } from '@/components/utils/date-utils'; // For date handling

export function useContractForm(initialContract = null, onSuccess) {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const getInitialState = () => ({
    provider_id: '',
    contract_number: '',
    name_en: '',
    name_he: '',
    valid_from: '', // Store as YYYY-MM-DD string
    valid_to: '',   // Store as YYYY-MM-DD string
    status: CONTRACT_STATUSES[0]?.value || 'draft',
    scope_rules: [], // This will be complex, handle separately or in a sub-form
    payment_terms: {
      payment_days: 30,
      requires_invoice: true,
      payment_method: PAYMENT_METHODS[0]?.value || 'direct_deposit'
    },
    special_conditions: [], // Array of strings
    ...(initialContract ? {
        ...initialContract,
        valid_from: initialContract.valid_from ? formatDateForInput(initialContract.valid_from) : '',
        valid_to: initialContract.valid_to ? formatDateForInput(initialContract.valid_to) : '',
        payment_terms: {
            ...(initialState.payment_terms), // Ensure defaults
            ...(initialContract.payment_terms || {})
        },
        scope_rules: initialContract.scope_rules || [],
        special_conditions: initialContract.special_conditions || [],
    } : {})
  });
  
  const [formData, setFormData] = useState(getInitialState());
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [providers, setProviders] = useState([]); // For provider dropdown

  // Fetch providers for dropdown
  useEffect(() => {
    const fetchProviders = async () => {
        try {
            const providerList = await Provider.list('name.en'); // Sort by name
            setProviders(providerList || []);
        } catch (error) {
            console.error("Error fetching providers for contract form:", error);
            // Optionally show a toast or set an error state for the dropdown
        }
    };
    fetchProviders();
  }, []);
  
  useEffect(() => {
    setFormData(getInitialState());
  }, [initialContract]);
  
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (Object.prototype.hasOwnProperty.call(errors, field)) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);
  
  const updateNestedField = useCallback((parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...(prev[parent] || {}), [field]: value }
    }));
    if (Object.prototype.hasOwnProperty.call(errors, parent) && 
        errors[parent] && Object.prototype.hasOwnProperty.call(errors[parent], field)) {
      setErrors(prev => ({
        ...prev,
        [parent]: { ...(prev[parent] || {}), [field]: null }
      }));
    }
  }, [errors]);

  const handleListChange = useCallback((field, newList) => {
    setFormData(prev => ({ ...prev, [field]: newList }));
  }, []);
  
  const validate = useCallback(() => {
    const newErrors = {};
    if (!formData.provider_id) {
      newErrors.provider_id = t('validation.required', { field: t('contracts.provider') });
    }
    if (!formData.contract_number?.trim()) {
      newErrors.contract_number = t('validation.required', { field: t('contracts.contractNumber') });
    }
    if (!formData.name_en?.trim() && !formData.name_he?.trim()) {
      newErrors.name_en = t('validation.requiredEither', { field: t('contracts.name') });
    }
    if (!formData.valid_from) {
      newErrors.valid_from = t('validation.required', { field: t('contracts.startDate') });
    }
    if (!formData.valid_to) {
      newErrors.valid_to = t('validation.required', { field: t('contracts.endDate') });
    }
    if (formData.valid_from && formData.valid_to && parseDateFromInput(formData.valid_from) > parseDateFromInput(formData.valid_to)) {
      newErrors.valid_to = t('validation.endAfterStart');
    }
    if (formData.payment_terms?.payment_days && (parseInt(formData.payment_terms.payment_days, 10) < 0 || isNaN(parseInt(formData.payment_terms.payment_days, 10)))) {
        if(!newErrors.payment_terms) newErrors.payment_terms = {};
        newErrors.payment_terms.payment_days = t('validation.positiveNumber', { field: t('contracts.paymentDays')});
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);
  
  const resetForm = useCallback(() => {
    setFormData(getInitialState());
    setErrors({});
  }, [initialContract]);
  
  const handleSubmit = useCallback(async (event) => {
    if (event) event.preventDefault();
    if (!validate()) return false;

    setIsSubmitting(true);
    try {
      let savedContract;
      const dataToSave = {
        ...formData,
        // Ensure dates are correctly formatted if needed by backend, though entity SDK might handle it
        // payment_terms.payment_days should be a number
        payment_terms: {
            ...formData.payment_terms,
            payment_days: parseInt(formData.payment_terms.payment_days, 10) || 0
        }
      };

      if (initialContract?.id) {
        savedContract = await Contract.update(initialContract.id, dataToSave);
        toast({ title: t('contracts.updateSuccess') });
      } else {
        savedContract = await Contract.create(dataToSave);
        toast({ title: t('contracts.createSuccess') });
      }
      if (onSuccess) onSuccess(savedContract);
      return true;
    } catch (error) {
      console.error("Error saving contract:", error);
      toast({ variant: "destructive", title: t('contracts.saveError'), description: error.message });
      // Potentially parse error for specific field issues from backend
      if (error.details && typeof error.details === 'object') {
        setErrors(prev => ({ ...prev, ...error.details }));
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, initialContract, onSuccess, t, toast, validate]);

  return {
    formData,
    errors,
    isSubmitting,
    providers, // Expose providers for dropdown
    updateField,
    updateNestedField,
    handleListChange, // For special_conditions
    handleSubmit,
    resetForm,
    validate
  };
}