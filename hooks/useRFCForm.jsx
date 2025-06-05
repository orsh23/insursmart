import { useState, useEffect, useCallback } from 'react';
import { RequestForCommitment } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/components/utils/i18n';

/**
 * Custom hook for Request for Commitment form state management
 * 
 * @param {Object} initialData Initial form data 
 * @param {Function} onSubmitSuccess Callback after successful submission
 * @returns {Object} Form state and handlers
 */
export default function useRFCForm(initialData = null, onSubmitSuccess = () => {}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
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
    notes: '',
    status: 'draft',
    validation_errors: [],
    validation_warnings: []
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form with data if provided
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [initialData]);
  
  // Update a single field
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when it's updated
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [formErrors]);
  
  // Reset form to initial or empty state
  const resetForm = useCallback(() => {
    setFormData({
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
      notes: '',
      status: 'draft',
      validation_errors: [],
      validation_warnings: []
    });
    setFormErrors({});
  }, []);
  
  // Set all form data at once
  const setFormDataFull = useCallback((data) => {
    setFormData(data);
    setFormErrors({});
  }, []);
  
  // Validate form
  const validateForm = useCallback(() => {
    const errors = {};
    
    // Validation logic
    if (!formData.provider_id) {
      errors.provider_id = t('validation.required', 'This field is required');
    }
    
    if (!formData.insured_id) {
      errors.insured_id = t('validation.required', 'This field is required');
    }
    
    if (!formData.procedure_codes || formData.procedure_codes.length === 0) {
      errors.procedure_codes = t('validation.requiredArray', 'At least one item is required');
    }
    
    if (!formData.procedure_date) {
      errors.procedure_date = t('validation.required', 'This field is required');
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, t]);
  
  // Submit form
  const submitForm = useCallback(async () => {
    if (!validateForm()) {
      toast({
        title: t('form.validationFailed', 'Validation Failed'),
        description: t('form.pleaseCheckErrors', 'Please check form for errors'),
        variant: 'destructive'
      });
      return false;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create or update
      if (initialData?.id) {
        await RequestForCommitment.update(initialData.id, formData);
        toast({
          title: t('rfc.updateSuccess', 'Request Updated'),
          description: t('rfc.updateSuccessDetail', 'Request for commitment was successfully updated')
        });
      } else {
        await RequestForCommitment.create(formData);
        toast({
          title: t('rfc.createSuccess', 'Request Created'),
          description: t('rfc.createSuccessDetail', 'Request for commitment was successfully created')
        });
      }
      
      onSubmitSuccess();
      return true;
    } catch (error) {
      toast({
        title: t('rfc.saveFailed', 'Save Failed'),
        description: error.message,
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, initialData, validateForm, toast, t, onSubmitSuccess]);
  
  return {
    formData,
    formErrors,
    isSubmitting,
    updateField,
    resetForm,
    setFormData: setFormDataFull,
    validateForm,
    submitForm
  };
}