// ... (ensure this file exists and is correct, I created it in a previous step) ...
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Contract } from '@/api/entities';
import { useTranslation } from '@/components/utils/i18n';

export function useContractForm(contract = null, onSuccess) { // Added onSuccess
  const { t } = useTranslation();
  const { toast } = useToast();

  const initialState = {
    provider_id: '',
    contract_number: '',
    name_en: '',
    name_he: '',
    valid_from: null,
    valid_to: null,
    status: 'draft',
    scope_rules: [], 
    payment_terms: {
      payment_days: 30,
      requires_invoice: true,
      payment_method: 'direct_deposit'
    },
    special_conditions: [], 
    description: '', 
    reference_number: '', 
    // ...contract // Apply initial contract data after defaults
  };
  
  const [formData, setFormData] = useState(() => {
    const initial = {...initialState};
    if (contract) {
        const merged = { ...initial, ...contract };
        // Ensure dates are in 'YYYY-MM-DD' or null for DatePicker
        merged.valid_from = contract.valid_from ? new Date(contract.valid_from).toISOString().split('T')[0] : null;
        merged.valid_to = contract.valid_to ? new Date(contract.valid_to).toISOString().split('T')[0] : null;
        return merged;
    }
    return initial;
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (contract) {
      const mergedData = { ...initialState, ...contract };
      mergedData.valid_from = contract.valid_from ? new Date(contract.valid_from).toISOString().split('T')[0] : null;
      mergedData.valid_to = contract.valid_to ? new Date(contract.valid_to).toISOString().split('T')[0] : null;
      
      // If legacy start_date/end_date are present and valid_from/to are not, use them.
      if (contract.start_date && !mergedData.valid_from) {
        mergedData.valid_from = new Date(contract.start_date).toISOString().split('T')[0];
      }
      if (contract.end_date && !mergedData.valid_to) {
        mergedData.valid_to = new Date(contract.end_date).toISOString().split('T')[0];
      }
      setFormData(mergedData);
    } else {
      setFormData(initialState);
    }
  }, [contract]);

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  }, [errors]);
  
  const updateNestedField = useCallback((parentField, childField, value) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: value
      }
    }));
     if (errors[parentField]?.[childField]) {
      setErrors(prev => ({
        ...prev,
        [parentField]: {
          ...(prev[parentField] || {}), // Ensure parentField exists
          [childField]: null
        }
      }));
    }
  }, [errors]);

  const validate = useCallback(() => {
    const newErrors = {};
    if (!formData.provider_id) newErrors.provider_id = t('validation.required', { field: t('contracts.provider') });
    if (!formData.contract_number?.trim()) newErrors.contract_number = t('validation.required', { field: t('contracts.contractNumber') });
    if (!formData.name_en?.trim()) newErrors.name_en = t('validation.required', { field: t('contracts.nameEn') });
    if (!formData.name_he?.trim()) newErrors.name_he = t('validation.required', { field: t('contracts.nameHe') });
    if (!formData.valid_from) newErrors.valid_from = t('validation.required', { field: t('contracts.validFrom') });
    if (!formData.valid_to) newErrors.valid_to = t('validation.required', { field: t('contracts.validTo') });
    
    if (formData.valid_from && formData.valid_to && new Date(formData.valid_from) > new Date(formData.valid_to)) {
      newErrors.valid_to = t('validation.dateAfter', { field: t('contracts.validTo'), compareField: t('contracts.validFrom') });
    }
    
    if (formData.payment_terms && (!formData.payment_terms.payment_days || formData.payment_terms.payment_days <= 0)) {
      if (!newErrors.payment_terms) newErrors.payment_terms = {};
      newErrors.payment_terms.payment_days = t('validation.positiveRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  const resetForm = useCallback(() => {
    const resetState = {...initialState};
     if (contract) { // If editing, reset to original contract values
        const merged = { ...initialState, ...contract };
        merged.valid_from = contract.valid_from ? new Date(contract.valid_from).toISOString().split('T')[0] : null;
        merged.valid_to = contract.valid_to ? new Date(contract.valid_to).toISOString().split('T')[0] : null;
        if (contract.start_date && !merged.valid_from) {
            merged.valid_from = new Date(contract.start_date).toISOString().split('T')[0];
        }
        if (contract.end_date && !merged.valid_to) {
            merged.valid_to = new Date(contract.end_date).toISOString().split('T')[0];
        }
        setFormData(merged);
    } else {
        setFormData(initialState);
    }
    setErrors({});
  }, [contract, initialState]);

  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (!validate()) return false;

    setIsSubmitting(true);
    try {
      const dataToSave = { ...formData };
      // Ensure date fields are in YYYY-MM-DD format if they are Date objects
      if (dataToSave.valid_from && typeof dataToSave.valid_from !== 'string') {
        dataToSave.valid_from = new Date(dataToSave.valid_from).toISOString().split('T')[0];
      }
      if (dataToSave.valid_to && typeof dataToSave.valid_to !== 'string') {
        dataToSave.valid_to = new Date(dataToSave.valid_to).toISOString().split('T')[0];
      }

      let savedContract;
      if (contract?.id) {
        savedContract = await Contract.update(contract.id, dataToSave);
        toast({ title: t('contracts.updateSuccess') });
      } else {
        savedContract = await Contract.create(dataToSave);
        toast({ title: t('contracts.createSuccess') });
      }
      if (onSuccess) onSuccess(savedContract);
      return true;
    } catch (error) {
      console.error('Error saving contract:', error);
      toast({ variant: "destructive", title: t('contracts.saveError'), description: error.message });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, contract, onSuccess, t, toast, validate]);

  return {
    formData,
    errors,
    isSubmitting,
    updateField,
    updateNestedField,
    handleSubmit,
    resetForm,
    validate
  };
}