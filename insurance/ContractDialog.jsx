
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Not used in final outline but good to keep if scope rules become text area
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Contract } from '@/api/entities'; // Assuming this path and entity structure
import { useLanguageHook } from '@/components/useLanguageHook'; // Assuming this hook provides t, language, isRTL
import { useToast } from "@/components/ui/use-toast";
import FormField from '@/components/shared/FormField'; // Assuming this component exists
import BilingualInput from '@/components/forms/BilingualInput'; // Assuming this component exists
import { Save, X, Trash2, Plus } from 'lucide-react';
import { parseISO, format, isValid } from 'date-fns';

// Minimal LoadingSpinner component for demonstration, replace with actual if available
const LoadingSpinner = ({ size = 'md' }) => {
  const spinnerSize = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }[size];

  return (
    <div className={`animate-spin rounded-full border-b-2 border-current ${spinnerSize}`} role="status">
      <span className="sr-only">Loading...</span>
    </div>
  );
};

const getDefaultFormData = () => ({
  provider_id: '',
  contract_number: '',
  name_en: '',
  name_he: '',
  valid_from: null,
  valid_to: null,
  status: 'draft', // Default status
  scope_rules: [], // Simplified for now
  payment_terms: { payment_days: 30, requires_invoice: true, payment_method: 'direct_deposit' }, // Default payment terms
  special_conditions: [], // Array of strings
});

export default function ContractDialog({ isOpen, onCloseDialog, contractData, providerOptions }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const [formData, setFormData] = useState(getDefaultFormData());
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) { // Only update formData when dialog opens or contractData changes
      if (contractData) {
        setFormData({
          ...getDefaultFormData(), // Start with defaults to ensure all fields are present
          ...contractData,
          valid_from: contractData.valid_from ? parseISO(contractData.valid_from) : null,
          valid_to: contractData.valid_to ? parseISO(contractData.valid_to) : null,
          payment_terms: contractData.payment_terms || getDefaultFormData().payment_terms, // Ensure payment_terms is an object
          scope_rules: contractData.scope_rules || [],
          special_conditions: contractData.special_conditions || [],
        });
      } else {
        setFormData(getDefaultFormData());
      }
      setErrors({}); // Clear errors when dialog opens or data changes
    }
  }, [contractData, isOpen]);

  const validateField = useCallback((name, value, currentFormData) => {
    let errorMsg = '';
    switch (name) {
      case 'provider_id':
        if (!value) errorMsg = t('validation.requiredField', { fieldName: t('fields.provider', { defaultValue: 'Provider' }) });
        break;
      case 'contract_number':
        if (!value) errorMsg = t('validation.requiredField', { fieldName: t('fields.contractNumber', { defaultValue: 'Contract Number' }) });
        else if (value.length > 100) errorMsg = t('validation.maxLength', { fieldName: t('fields.contractNumber', { defaultValue: 'Contract Number' }), max: 100 });
        break;
      case 'name_en':
        if (!value && !currentFormData.name_he) errorMsg = t('validation.bilingualRequired', { fieldName1: t('fields.contractNameEn', { defaultValue: 'Name (English)' }), fieldName2: t('fields.contractNameHe', { defaultValue: 'Name (Hebrew)' }) });
        else if (value && value.length > 200) errorMsg = t('validation.maxLength', { fieldName: t('fields.contractNameEn', { defaultValue: 'Name (English)' }), max: 200 });
        break;
      case 'name_he':
        if (!value && !currentFormData.name_en) errorMsg = t('validation.bilingualRequired', { fieldName1: t('fields.contractNameEn', { defaultValue: 'Name (English)' }), fieldName2: t('fields.contractNameHe', { defaultValue: 'Name (Hebrew)' }) });
        else if (value && value.length > 200) errorMsg = t('validation.maxLength', { fieldName: t('fields.contractNameHe', { defaultValue: 'Name (Hebrew)' }), max: 200 });
        break;
      case 'valid_from':
        if (!value) errorMsg = t('validation.requiredField', { fieldName: t('fields.validFrom', { defaultValue: 'Valid From' }) });
        else if (currentFormData.valid_to && isValid(value) && isValid(currentFormData.valid_to) && value > currentFormData.valid_to) errorMsg = t('validation.dateCannotBeAfter', { date1: t('fields.validFrom', { defaultValue: 'Valid From' }), date2: t('fields.validTo', { defaultValue: 'Valid To' }) });
        break;
      case 'valid_to':
        if (!value) errorMsg = t('validation.requiredField', { fieldName: t('fields.validTo', { defaultValue: 'Valid To' }) });
        else if (currentFormData.valid_from && isValid(value) && isValid(currentFormData.valid_from) && value < currentFormData.valid_from) errorMsg = t('validation.dateCannotBeBefore', { date1: t('fields.validTo', { defaultValue: 'Valid To' }), date2: t('fields.validFrom', { defaultValue: 'Valid From' }) });
        break;
      case 'status':
        if (!value) errorMsg = t('validation.requiredField', { fieldName: t('fields.status', { defaultValue: 'Status' }) });
        break;
      case 'payment_days':
        if (value === null || value === undefined || value < 0) { // Check for null, undefined, or negative values
            errorMsg = t('validation.positiveNumber', { fieldName: t('fields.paymentDays', { defaultValue: 'Payment Days' }) });
        }
        break;
      default:
        break;
    }
    return errorMsg;
  }, [t]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValidForm = true;

    // Validate main fields
    ['provider_id', 'contract_number', 'name_en', 'name_he', 'valid_from', 'valid_to', 'status'].forEach(key => {
      const error = validateField(key, formData[key], formData);
      if (error) {
        newErrors[key] = error;
        isValidForm = false;
      }
    });

    // Validate payment_days specifically
    const paymentDaysError = validateField('payment_days', formData.payment_terms.payment_days, formData);
    if (paymentDaysError) {
        newErrors.payment_days = paymentDaysError;
        isValidForm = false;
    }

    setErrors(newErrors);
    return isValidForm;
  }, [formData, validateField]);

  const handleChange = useCallback((name, value) => {
    setFormData(prev => {
      const updatedFormData = { ...prev, [name]: value };
      if (errors[name]) {
        // Re-validate field immediately if it had an error
        const error = validateField(name, value, updatedFormData);
        setErrors(prevErrors => ({ ...prevErrors, [name]: error }));
      }
      return updatedFormData;
    });
  }, [errors, validateField]);
  
  const handleBilingualChange = useCallback((name_en, name_he) => {
    setFormData(prev => {
        const updatedFormData = { ...prev, name_en, name_he };
        if (errors.name_en || errors.name_he) {
            const errorEn = validateField('name_en', name_en, updatedFormData);
            const errorHe = validateField('name_he', name_he, updatedFormData);
            setErrors(prevErrors => ({ ...prevErrors, name_en: errorEn, name_he: errorHe }));
        }
        return updatedFormData;
    });
  }, [errors, validateField]);

  const handleDateChange = useCallback((name, date) => {
    setFormData(prev => {
      const updatedFormData = { ...prev, [name]: date };
      // Re-validate current date field and potentially the other date field
      const currentError = validateField(name, date, updatedFormData);
      let otherDateError = '';
      if (name === 'valid_from') {
          otherDateError = validateField('valid_to', updatedFormData.valid_to, updatedFormData);
      } else if (name === 'valid_to') {
          otherDateError = validateField('valid_from', updatedFormData.valid_from, updatedFormData);
      }
      setErrors(prevErrors => ({ 
          ...prevErrors, 
          [name]: currentError, 
          ...(name === 'valid_from' && { valid_to: otherDateError }),
          ...(name === 'valid_to' && { valid_from: otherDateError })
      }));
      return updatedFormData;
    });
  }, [errors, validateField]);
  
  const handlePaymentTermsChange = useCallback((name, value) => {
    setFormData(prev => {
        let parsedValue = value;
        if (name === 'payment_days') {
            parsedValue = value === '' ? null : parseInt(value, 10); // Allow empty string to clear field, but validate for null on submit
        }
        if (name === 'requires_invoice') parsedValue = value === 'true';

        const updatedPaymentTerms = { ...prev.payment_terms, [name]: parsedValue };
        const updatedFormData = { ...prev, payment_terms: updatedPaymentTerms };

        if (name === 'payment_days' && errors.payment_days) {
            const error = validateField('payment_days', parsedValue, updatedFormData);
            setErrors(prevErrors => ({ ...prevErrors, payment_days: error }));
        }
        return updatedFormData;
    });
  }, [errors, validateField]);
  
  const handleAddSpecialCondition = useCallback(() => {
    setFormData(prev => ({
        ...prev,
        special_conditions: [...(prev.special_conditions || []), '']
    }));
  }, []);

  const handleSpecialConditionChange = useCallback((index, value) => {
    setFormData(prev => {
        const newConditions = [...(prev.special_conditions || [])];
        newConditions[index] = value;
        return { ...prev, special_conditions: newConditions };
    });
  }, []);
  
  const handleRemoveSpecialCondition = useCallback((index) => {
    setFormData(prev => {
        const newConditions = [...(prev.special_conditions || [])];
        newConditions.splice(index, 1);
        return { ...prev, special_conditions: newConditions };
    });
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        title: t('validation.formHasErrorsTitle', {defaultValue: 'Validation Error'}),
        description: t('validation.formHasErrorsDesc', {defaultValue: 'Please correct the errors in the form.'}),
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const dataToSave = {
        ...formData,
        valid_from: formData.valid_from ? format(formData.valid_from, 'yyyy-MM-dd') : null,
        valid_to: formData.valid_to ? format(formData.valid_to, 'yyyy-MM-dd') : null,
        special_conditions: (formData.special_conditions || []).filter(sc => sc.trim() !== ''), // Remove empty conditions
        // Ensure payment_terms.payment_days is a number or null/undefined if not set
        payment_terms: {
            ...formData.payment_terms,
            payment_days: formData.payment_terms.payment_days === null ? null : Number(formData.payment_terms.payment_days)
        }
      };

      let result;
      if (contractData?.id) {
        result = await Contract.update(contractData.id, dataToSave);
        toast({
            title: t('contracts.updateSuccessTitle', {defaultValue: 'Contract Updated'}),
            description: t('contracts.updateSuccessDesc', {defaultValue: 'Contract details have been successfully updated.'}),
        });
        onCloseDialog(true, 'update', dataToSave.name_en || dataToSave.contract_number);
      } else {
        result = await Contract.create(dataToSave);
        toast({
            title: t('contracts.createSuccessTitle', {defaultValue: 'Contract Created'}),
            description: t('contracts.createSuccessDesc', {defaultValue: 'New contract has been successfully created.'}),
        });
        onCloseDialog(true, 'create', dataToSave.name_en || dataToSave.contract_number);
      }
    } catch (error) {
      console.error("Failed to save contract:", error);
      toast({
        title: t('errors.saveFailedTitle', {defaultValue: 'Save Failed'}),
        description: error.message || t('errors.genericSaveError', {defaultValue: 'An error occurred while saving the contract.'}),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contractStatusOptions = [
    { value: 'draft', label: t('contractStatus.draft', {defaultValue: 'Draft'}) },
    { value: 'active', label: t('contractStatus.active', {defaultValue: 'Active'}) },
    { value: 'expired', label: t('contractStatus.expired', {defaultValue: 'Expired'}) },
    { value: 'terminated', label: t('contractStatus.terminated', {defaultValue: 'Terminated'}) },
  ];
  
  const paymentMethodOptions = [
      { value: 'direct_deposit', label: t('paymentMethods.direct_deposit', {defaultValue: 'Direct Deposit'})},
      { value: 'check', label: t('paymentMethods.check', {defaultValue: 'Check'})},
      { value: 'credit', label: t('paymentMethods.credit', {defaultValue: 'Credit'})},
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onCloseDialog(false); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:text-gray-100" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {contractData?.id ? t('contracts.editTitle', {defaultValue: 'Edit Contract'}) : t('contracts.addTitle', {defaultValue: 'New Contract'})}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 p-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t('fields.provider', {defaultValue: 'Provider'})} error={errors.provider_id} required>
              <Select
                value={formData.provider_id}
                onValueChange={(value) => handleChange('provider_id', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                  <SelectValue placeholder={t('filters.selectProvider', {defaultValue: 'Select Provider'})} />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:text-gray-200">
                  {providerOptions.map(option => (
                    <SelectItem key={option.value} value={option.value} className="dark:hover:bg-gray-600">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label={t('fields.contractNumber', {defaultValue: 'Contract Number'})} error={errors.contract_number} required>
              <Input
                value={formData.contract_number}
                onChange={(e) => handleChange('contract_number', e.target.value)}
                disabled={isSubmitting}
                placeholder={t('fields.enterContractNumber', {defaultValue: 'Enter contract number'})}
                className="dark:bg-gray-700 dark:border-gray-600"
              />
            </FormField>
          </div>

          <BilingualInput
            labelEn={t('fields.contractNameEn', {defaultValue: 'Name (English)'})}
            labelHe={t('fields.contractNameHe', {defaultValue: 'Name (Hebrew)'})}
            valueEn={formData.name_en}
            valueHe={formData.name_he}
            onChangeEn={(val) => handleBilingualChange(val, formData.name_he)}
            onChangeHe={(val) => handleBilingualChange(formData.name_en, val)}
            errorEn={errors.name_en}
            errorHe={errors.name_he}
            required={true} 
            currentLanguage={language}
            disabled={isSubmitting}
            inputClassName="dark:bg-gray-700 dark:border-gray-600"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t('fields.validFrom', {defaultValue: 'Valid From'})} error={errors.valid_from} required>
              <DatePicker
                selected={formData.valid_from}
                onSelect={(date) => handleDateChange('valid_from', date)}
                className="w-full dark:bg-gray-700 dark:border-gray-600"
                inputProps={{className: "dark:bg-gray-700 dark:text-white dark:border-gray-600"}}
                disabled={isSubmitting}
                placeholder={t('fields.pickDate', {defaultValue: 'Pick a date'})}
              />
            </FormField>
            <FormField label={t('fields.validTo', {defaultValue: 'Valid To'})} error={errors.valid_to} required>
              <DatePicker
                selected={formData.valid_to}
                onSelect={(date) => handleDateChange('valid_to', date)}
                className="w-full dark:bg-gray-700 dark:border-gray-600"
                inputProps={{className: "dark:bg-gray-700 dark:text-white dark:border-gray-600"}}
                disabled={isSubmitting}
                placeholder={t('fields.pickDate', {defaultValue: 'Pick a date'})}
              />
            </FormField>
          </div>

          <FormField label={t('fields.status', {defaultValue: 'Status'})} error={errors.status} required>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange('status', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                <SelectValue placeholder={t('filters.selectStatus', {defaultValue: 'Select Status'})} />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-700 dark:text-gray-200">
                {contractStatusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value} className="dark:hover:bg-gray-600">{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          
          <fieldset className="border p-3 rounded-md dark:border-gray-600">
            <legend className="text-sm font-medium px-1 dark:text-gray-300">{t('fields.paymentTerms', {defaultValue: 'Payment Terms'})}</legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <FormField label={t('fields.paymentDays', {defaultValue: 'Payment Days'})} error={errors.payment_days}>
                    <Input 
                        type="number" 
                        value={formData.payment_terms.payment_days ?? ''} 
                        onChange={(e) => handlePaymentTermsChange('payment_days', e.target.value)} 
                        className="dark:bg-gray-700 dark:border-gray-600"
                        min="0"
                        disabled={isSubmitting}
                        placeholder="e.g. 30"
                    />
                </FormField>
                 <FormField label={t('fields.requiresInvoice', {defaultValue: 'Requires Invoice'})}>
                    <Select
                        value={String(formData.payment_terms.requires_invoice)}
                        onValueChange={(value) => handlePaymentTermsChange('requires_invoice', value)}
                        disabled={isSubmitting}
                    >
                        <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-700 dark:text-gray-200">
                            <SelectItem value="true" className="dark:hover:bg-gray-600">{t('common.yes', {defaultValue: 'Yes'})}</SelectItem>
                            <SelectItem value="false" className="dark:hover:bg-gray-600">{t('common.no', {defaultValue: 'No'})}</SelectItem>
                        </SelectContent>
                    </Select>
                </FormField>
                <FormField label={t('fields.paymentMethod', {defaultValue: 'Payment Method'})}>
                     <Select
                        value={formData.payment_terms.payment_method}
                        onValueChange={(value) => handlePaymentTermsChange('payment_method', value)}
                        disabled={isSubmitting}
                    >
                        <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                            <SelectValue placeholder={t('filters.selectMethod', {defaultValue: 'Select Method'})} />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-700 dark:text-gray-200">
                           {paymentMethodOptions.map(option => (
                                <SelectItem key={option.value} value={option.value} className="dark:hover:bg-gray-600">{option.label}</SelectItem>
                           ))}
                        </SelectContent>
                    </Select>
                </FormField>
            </div>
          </fieldset>

          <FormField label={t('fields.specialConditions', {defaultValue: 'Special Conditions'})}>
            {(formData.special_conditions || []).map((condition, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                    <Input
                        value={condition}
                        onChange={(e) => handleSpecialConditionChange(index, e.target.value)}
                        placeholder={t('contracts.conditionPlaceholder', {defaultValue: `Condition ${index + 1}`})}
                        className="flex-grow dark:bg-gray-700 dark:border-gray-600"
                        disabled={isSubmitting}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveSpecialCondition(index)} disabled={isSubmitting} className="text-red-500 hover:text-red-700 dark:hover:bg-gray-700">
                        <Trash2 className="h-4 w-4"/>
                    </Button>
                </div>
            ))}
            <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={handleAddSpecialCondition} 
                disabled={isSubmitting}
                className="mt-1 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
                <Plus className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} /> {t('buttons.addCondition', {defaultValue: 'Add Condition'})}
            </Button>
          </FormField>

          {/* TODO: Scope Rules - This is complex and might need a dedicated component or simpler UI for now */}
          {/* 
          <FormField label="Scope Rules">
             <Textarea value={JSON.stringify(formData.scope_rules, null, 2)} onChange={(e) => handleChange('scope_rules', JSON.parse(e.target.value))} rows={3} placeholder="JSON array of scope rules"/>
          </FormField> 
          */}
          
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => onCloseDialog(false)} disabled={isSubmitting} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                <X className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />{t('buttons.cancel', {defaultValue: 'Cancel'})}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting} className="min-w-[100px]">
              {isSubmitting ? <LoadingSpinner size="sm" /> : <Save className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />}
              {contractData?.id ? t('buttons.saveChanges', {defaultValue: 'Save Changes'}) : t('buttons.create', {defaultValue: 'Create'})}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
