import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Claim } from '@/api/entities';
import { useLanguage } from '../context/LanguageContext';

export function useClaimForm(initialClaim = null, onSuccess) {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  // Initial form state with defaults
  const initialState = {
    rfc_id: '',
    provider_id: '',
    provider_name: '',
    doctor_id: '',
    doctor_name: '',
    insured_id: '',
    insured_name: '',
    policy_id: '',
    policy_number: '',
    diagnosis_codes: [],
    procedure_codes: [],
    procedure_date: '',
    quantities: [],
    submitted_prices: [],
    calculated_prices: [],
    total_submitted: 0,
    total_calculated: 0,
    approved_amount: 0,
    currency: 'ILS',
    status: 'submitted',
    rejection_reason: '',
    validation_errors: [],
    validation_warnings: [],
    notes: '',
    ...initialClaim
  };
  
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Update form data when initialClaim changes
  useEffect(() => {
    if (initialClaim) {
      setFormData({
        ...initialState,
        ...initialClaim
      });
    } else {
      setFormData(initialState);
    }
  }, [initialClaim]);
  
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear related error
    if (Object.prototype.hasOwnProperty.call(errors, field)) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  }, [errors]);
  
  const updateArrayItem = useCallback((field, index, value) => {
    setFormData(prev => {
      const array = [...(prev[field] || [])];
      array[index] = value;
      return {
        ...prev,
        [field]: array
      };
    });
  }, []);
  
  const addArrayItem = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), value]
    }));
  }, []);
  
  const removeArrayItem = useCallback((field, index) => {
    setFormData(prev => {
      const array = [...(prev[field] || [])];
      array.splice(index, 1);
      return {
        ...prev,
        [field]: array
      };
    });
  }, []);
  
  // Calculate totals whenever procedure items change
  useEffect(() => {
    // Only run if we have both quantities and prices
    if (formData.quantities?.length > 0 && formData.submitted_prices?.length > 0) {
      // Ensure arrays are same length
      const length = Math.min(formData.quantities.length, formData.submitted_prices.length);
      
      // Calculate total submitted
      let total = 0;
      for (let i = 0; i < length; i++) {
        const quantity = parseFloat(formData.quantities[i]) || 0;
        const price = parseFloat(formData.submitted_prices[i]) || 0;
        total += quantity * price;
      }
      
      // Update total submitted without triggering full form update
      setFormData(prev => ({
        ...prev,
        total_submitted: total
      }));
    }
  }, [formData.quantities, formData.submitted_prices]);
  
  const validate = useCallback(() => {
    const newErrors = {};
    
    // Required fields
    if (!formData.provider_id) {
      newErrors.provider_id = t('validation.required', { field: t('claims.provider') });
    }
    
    if (!formData.insured_id) {
      newErrors.insured_id = t('validation.required', { field: t('claims.insured') });
    }
    
    if (!formData.procedure_codes?.length) {
      newErrors.procedure_codes = t('validation.requiredArray', { field: t('claims.procedureCodes') });
    }
    
    if (!formData.procedure_date) {
      newErrors.procedure_date = t('validation.required', { field: t('claims.procedureDate') });
    }
    
    if (!formData.submitted_prices?.length || formData.submitted_prices.some(price => price <= 0)) {
      newErrors.submitted_prices = t('validation.requiredPositive', { field: t('claims.submittedPrices') });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);
  
  const resetForm = useCallback(() => {
    setFormData(initialClaim ? { ...initialState, ...initialClaim } : initialState);
    setErrors({});
  }, [initialClaim]);
  
  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    
    if (!validate()) {
      return false;
    }
    
    setIsSubmitting(true);
    
    try {
      let savedClaim;
      if (initialClaim?.id) {
        savedClaim = await Claim.update(initialClaim.id, formData);
        toast({
          title: t('claims.updateSuccess'),
        });
      } else {
        savedClaim = await Claim.create(formData);
        toast({
          title: t('claims.createSuccess'),
        });
      }
      
      if (onSuccess) {
        onSuccess(savedClaim);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving claim:', error);
      
      toast({
        variant: "destructive",
        title: t('claims.saveError'),
        description: error.message
      });
      
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, initialClaim, onSuccess, t, toast, validate]);
  
  return {
    formData,
    errors,
    isSubmitting,
    updateField,
    updateArrayItem,
    addArrayItem,
    removeArrayItem,
    handleSubmit,
    resetForm,
    validate
  };
}