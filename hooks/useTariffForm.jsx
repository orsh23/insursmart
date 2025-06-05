import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../ui/use-toast';
import { Tariff } from '@/api/entities';
import { useTranslation } from '../utils/i18n';

// Define constants - currency options
const CURRENCY_OPTIONS = [
  { value: 'ILS', label: 'ILS (₪)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' }
];

// Define constants - finalization types
const FINALIZATION_TYPES = [
  { value: 'RFC', label: 'Request for Commitment' },
  { value: 'Claim', label: 'Claim' },
  { value: 'Hybrid', label: 'Hybrid' }
];

// Component types for composition
const COMPONENT_TYPES = [
  { value: 'Base', label: 'Base Price' },
  { value: 'DoctorFee', label: 'Doctor Fee' },
  { value: 'Implantables', label: 'Implantables' },
  { value: 'Hospitalization', label: 'Hospitalization' },
  { value: 'Drugs', label: 'Drugs' },
  { value: 'Other', label: 'Other' }
];

// Pricing models
const PRICING_MODELS = [
  { value: 'Fixed', label: 'Fixed Amount' },
  { value: 'BoMActual', label: 'Bill of Materials (Actual)' },
  { value: 'PerDay', label: 'Per Day Rate' },
  { value: 'Capped', label: 'Capped Amount' },
  { value: 'PerUnit', label: 'Per Unit' }
];

// Recipient types
const RECIPIENT_TYPES = [
  { value: 'Provider', label: 'Provider' },
  { value: 'Doctor', label: 'Doctor' },
  { value: 'Supplier', label: 'Supplier' },
  { value: 'Patient', label: 'Patient' }
];

export function useTariffForm(initialData = null) {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // Initial state creator function
  const getInitialState = useCallback(() => {
    const defaultState = {
      contract_id: '',
      insurance_code: '',
      doctor_id: '',
      base_price: 0,
      currency: 'ILS',
      finalization_type: 'Claim',
      composition: [],
      validation_rules: []
    };
    
    // If initialData is provided and is an object, merge with defaults
    if (initialData && typeof initialData === 'object') {
      return {
        ...defaultState,
        ...initialData,
        // Ensure arrays
        composition: Array.isArray(initialData.composition) ? initialData.composition : [],
        validation_rules: Array.isArray(initialData.validation_rules) ? initialData.validation_rules : []
      };
    }
    
    return defaultState;
  }, [initialData]);
  
  const [formData, setFormData] = useState(getInitialState());
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Update form when initialData changes
  useEffect(() => {
    setFormData(getInitialState());
    setFormErrors({});
  }, [initialData, getInitialState]);
  
  // Update a single field
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field if it exists
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [formErrors]);
  
  // Validate form
  const validateForm = useCallback(() => {
    const errors = {};
    
    // Required fields
    if (!formData.contract_id) {
      errors.contract_id = t('validation.required', { field: t('tariffs.contractId', { defaultValue: 'Contract ID' }) });
    }
    
    if (!formData.insurance_code) {
      errors.insurance_code = t('validation.required', { field: t('tariffs.insuranceCode', { defaultValue: 'Insurance Code' }) });
    }
    
    // Validate base_price is a positive number
    if (typeof formData.base_price !== 'number' || formData.base_price < 0) {
      errors.base_price = t('validation.positiveNumber', { field: t('tariffs.basePrice', { defaultValue: 'Base Price' }) });
    }
    
    // Validate composition items if any
    if (Array.isArray(formData.composition)) {
      const compositionErrors = [];
      formData.composition.forEach((item, index) => {
        const itemErrors = {};
        
        if (!item.component_type) {
          itemErrors.component_type = t('validation.required', { field: t('tariffs.componentType', { defaultValue: 'Component Type' }) });
        }
        
        if (!item.pricing_model) {
          itemErrors.pricing_model = t('validation.required', { field: t('tariffs.pricingModel', { defaultValue: 'Pricing Model' }) });
        }
        
        if (!item.recipient_type) {
          itemErrors.recipient_type = t('validation.required', { field: t('tariffs.recipientType', { defaultValue: 'Recipient Type' }) });
        }
        
        if (Object.keys(itemErrors).length > 0) {
          compositionErrors[index] = itemErrors;
        }
      });
      
      if (compositionErrors.length > 0) {
        errors.composition = compositionErrors;
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, t]);
  
  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return false;
    }
    
    setIsSubmitting(true);
    
    try {
      if (initialData?.id) {
        await Tariff.update(initialData.id, formData);
        toast({ 
          title: t('tariffs.updateSuccess', { defaultValue: 'Tariff updated successfully' })
        });
      } else {
        await Tariff.create(formData);
        toast({ 
          title: t('tariffs.createSuccess', { defaultValue: 'Tariff created successfully' })
        });
      }
      return true;
    } catch (error) {
      console.error('Error saving tariff:', error);
      toast({
        variant: 'destructive',
        title: t('tariffs.saveError', { defaultValue: 'Error saving tariff' }),
        description: error.message
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, initialData, t, toast, validateForm]);
  
  // Reset form
  const resetForm = useCallback((data = {}) => {
    if (data && typeof data === 'object') {
      setFormData({
        contract_id: data.contract_id || '',
        insurance_code: data.insurance_code || '',
        doctor_id: data.doctor_id || '',
        base_price: data.base_price || 0,
        currency: data.currency || 'ILS',
        finalization_type: data.finalization_type || 'Claim',
        composition: Array.isArray(data.composition) ? data.composition : [],
        validation_rules: Array.isArray(data.validation_rules) ? data.validation_rules : []
      });
    } else {
      setFormData(getInitialState());
    }
    setFormErrors({});
  }, [getInitialState]);
  
  return {
    formData,
    formErrors,
    isSubmitting,
    updateField,
    validateForm,
    handleSubmit,
    resetForm,
    setFormData,
    // Options arrays
    currencyOptions: CURRENCY_OPTIONS,
    finalizationTypeOptions: FINALIZATION_TYPES,
    componentTypeOptions: COMPONENT_TYPES,
    pricingModelOptions: PRICING_MODELS,
    recipientTypeOptions: RECIPIENT_TYPES
  };
}