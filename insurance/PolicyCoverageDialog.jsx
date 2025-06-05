import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguageHook } from '@/components/useLanguageHook';
import { PolicyCoverage } from '@/api/entities'; // Assuming SDK
import { InsurancePolicy } from '@/api/entities'; // For policy dropdown
import { useToast } from "@/components/ui/use-toast";
import FormField from '@/components/shared/FormField'; // Reusing FormField
import SelectField from '@/components/common/SelectField'; // Reusing SelectField
import { AlertCircle, Save } from 'lucide-react';

const initialCoverageData = {
  policy_id: '',
  allows_doctor_fee: true,
  allows_implantables: true,
  allows_private_doctor: true,
  has_dental: false,
  has_vision: false,
  has_maternity: false,
  has_chronic: false,
  has_preexisting: false,
  hospital_days_limit: 0,
  diagnostic_tests_limit: 0,
  hospital_coverage_amount: 0,
  surgery_coverage_amount: 0,
  outpatient_coverage_amount: 0,
  annual_deductible: 0,
  copay_percentage: 0,
  out_of_pocket_max: 0,
};

const PolicyCoverageDialog = ({ isOpen, onCloseDialog, currentCoverageData, onFormValidChange }) => {
  const { t } = useLanguageHook();
  const { toast } = useToast();
  const [formData, setFormData] = useState(initialCoverageData);
  const [policies, setPolicies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function fetchPolicies() {
      try {
        const policyList = await InsurancePolicy.list();
        setPolicies(Array.isArray(policyList) ? policyList : []);
      } catch (error) {
        console.error("Failed to fetch policies:", error);
        toast({ title: t('errors.fetchFailedTitle'), description: t('errors.fetchFailedSingular', { entity: t('insurance.policies.title') }), variant: 'destructive'});
        setPolicies([]);
      }
    }
    if (isOpen) {
      fetchPolicies();
      if (currentCoverageData) {
        // Ensure numeric fields are numbers, not strings, and handle nulls
        const numericFields = [
            'hospital_days_limit', 'diagnostic_tests_limit', 'hospital_coverage_amount', 
            'surgery_coverage_amount', 'outpatient_coverage_amount', 'annual_deductible', 
            'copay_percentage', 'out_of_pocket_max'
        ];
        const processedData = { ...currentCoverageData };
        numericFields.forEach(field => {
            processedData[field] = currentCoverageData[field] === null || currentCoverageData[field] === undefined ? 0 : Number(currentCoverageData[field]);
        });
        setFormData(processedData);
      } else {
        setFormData(initialCoverageData);
      }
      setErrors({}); // Clear errors when dialog opens or data changes
    }
  }, [isOpen, currentCoverageData, t, toast]);

  const validateField = (name, value) => {
    let errorMsg = '';
    if (name === 'policy_id' && !value) {
      errorMsg = t('validation.requiredField', { fieldName: t('fields.policy', {defaultValue: 'Policy'}) });
    }
    if (['annual_deductible', 'copay_percentage', 'out_of_pocket_max', 
         'hospital_days_limit', 'diagnostic_tests_limit', 
         'hospital_coverage_amount', 'surgery_coverage_amount', 'outpatient_coverage_amount'].includes(name)) {
      if (value === null || value === undefined || value === '') {
         // Allow empty or null for numbers, will default to 0 if schema implies or backend handles
      } else if (isNaN(Number(value))) {
        errorMsg = t('validation.mustBeNumber', { fieldName: t(`policyCoverage.fields.${name}`)});
      } else if (Number(value) < 0) {
        errorMsg = t('validation.mustBePositiveOrZero', { fieldName: t(`policyCoverage.fields.${name}`)});
      }
      if (name === 'copay_percentage' && (Number(value) < 0 || Number(value) > 100)) {
        errorMsg = t('validation.percentageRange', { fieldName: t('policyCoverage.fields.copayPercentage') });
      }
    }
    return errorMsg;
  };

  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;
    for (const key in formData) {
        if (Object.hasOwnProperty.call(formData, key)) {
            // Ensure booleans are not validated as empty strings if they are actual booleans
            const valueToValidate = typeof formData[key] === 'boolean' ? formData[key] : (formData[key] ?? '');
            const error = validateField(key, valueToValidate);
            if (error) {
                newErrors[key] = error;
                isValid = false;
            }
        }
    }
    setErrors(newErrors);
    if (onFormValidChange) onFormValidChange(isValid);
    return isValid;
  }, [formData, t, onFormValidChange]);

  useEffect(() => {
    if (isOpen) { // Validate form when dialog is open and formData changes
        validateForm();
    }
  }, [formData, isOpen, validateForm]);


  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleNumericChange = (name, value) => {
    // Allow empty string for typing, it will be validated or converted to null/0 on submit
    if (value === '' || value === null || value === undefined) {
        handleChange(name, null); // Store as null if empty
    } else if (!isNaN(value) && value.trim() !== '') {
        handleChange(name, Number(value));
    } else if (value.trim() === '') { // if it's just spaces, treat as empty
        handleChange(name, null);
    } else { // if it's not a number and not empty (e.g. "abc")
        handleChange(name, value); // keep the invalid string for immediate validation feedback
    }
  };


  const handleCheckboxChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({ title: t('validation.formInvalidTitle'), description: t('validation.formInvalidMessage'), variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const dataToSave = { ...formData };
      // Ensure numeric fields are numbers, default nulls to 0 if backend expects numbers
      const numericFields = [
        'hospital_days_limit', 'diagnostic_tests_limit', 'hospital_coverage_amount', 
        'surgery_coverage_amount', 'outpatient_coverage_amount', 'annual_deductible', 
        'copay_percentage', 'out_of_pocket_max'
      ];
      numericFields.forEach(field => {
        if (dataToSave[field] === null || dataToSave[field] === undefined || dataToSave[field] === '') {
            dataToSave[field] = 0; // Default to 0, or handle as per schema
        } else {
            dataToSave[field] = Number(dataToSave[field]);
        }
      });


      if (currentCoverageData?.id) {
        await PolicyCoverage.update(currentCoverageData.id, dataToSave);
      } else {
        await PolicyCoverage.create(dataToSave);
      }
      onCloseDialog(true, currentCoverageData?.id ? 'update' : 'create', formData.policy_id); // Signal refresh
    } catch (error) {
      console.error("Failed to save policy coverage:", error);
      toast({ title: t('errors.saveFailedTitle'), description: error.message || t('errors.saveFailedMessage'), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const policyOptions = policies.map(policy => ({
    value: policy.id,
    label: `${policy.policy_number} (${policy.status})`
  }));

  const formFields = [
    { name: 'annual_deductible', labelKey: 'policyCoverage.fields.annualDeductible', type: 'number', step: "0.01" },
    { name: 'copay_percentage', labelKey: 'policyCoverage.fields.copayPercentage', type: 'number', min: 0, max: 100, step: "0.1" },
    { name: 'out_of_pocket_max', labelKey: 'policyCoverage.fields.outOfPocketMax', type: 'number', step: "0.01" },
    { name: 'hospital_days_limit', labelKey: 'policyCoverage.fields.hospitalDaysLimit', type: 'number', min: 0 },
    { name: 'diagnostic_tests_limit', labelKey: 'policyCoverage.fields.diagnosticTestsLimit', type: 'number', min: 0 },
    { name: 'hospital_coverage_amount', labelKey: 'policyCoverage.fields.hospitalCoverageAmount', type: 'number', step: "0.01" },
    { name: 'surgery_coverage_amount', labelKey: 'policyCoverage.fields.surgeryCoverageAmount', type: 'number', step: "0.01" },
    { name: 'outpatient_coverage_amount', labelKey: 'policyCoverage.fields.outpatientCoverageAmount', type: 'number', step: "0.01" },
  ];

  const checkboxFields = [
    { name: 'allows_doctor_fee', labelKey: 'policyCoverage.fields.allowsDoctorFee' },
    { name: 'allows_implantables', labelKey: 'policyCoverage.fields.allowsImplantables' },
    { name: 'allows_private_doctor', labelKey: 'policyCoverage.fields.allowsPrivateDoctor' },
    { name: 'has_dental', labelKey: 'policyCoverage.fields.hasDental' },
    { name: 'has_vision', labelKey: 'policyCoverage.fields.hasVision' },
    { name: 'has_maternity', labelKey: 'policyCoverage.fields.hasMaternity' },
    { name: 'has_chronic', labelKey: 'policyCoverage.fields.hasChronic' },
    { name: 'has_preexisting', labelKey: 'policyCoverage.fields.hasPreexisting' },
  ];

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCloseDialog(false)}>
      <DialogContent className="sm:max-w-[600px] dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">
            {currentCoverageData?.id ? t('policyCoverage.editTitle') : t('policyCoverage.addTitle')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="max-h-[60vh] p-1 pr-4"> {/* Added p-1 pr-4 for scrollbar visibility */}
            <div className="space-y-4 p-4">
              <SelectField
                id="policy_id"
                label={t('fields.policy', {defaultValue: 'Policy'})}
                value={formData.policy_id}
                onValueChange={(value) => handleChange('policy_id', value)}
                options={policyOptions}
                placeholder={t('filters.selectPolicy', {defaultValue: 'Select Policy'})}
                error={errors.policy_id}
                disabled={isLoading || !!currentCoverageData?.id} // Disable if editing, policy_id shouldn't change
                className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formFields.map(field => (
                  <FormField key={field.name} className="flex flex-col space-y-1.5">
                    <Label htmlFor={field.name} className="dark:text-gray-300">{t(field.labelKey, {defaultValue: field.name.replace('_', ' ')})}</Label>
                    <Input
                      id={field.name}
                      type={field.type}
                      value={formData[field.name] === null || formData[field.name] === undefined ? '' : formData[field.name]}
                      onChange={(e) => handleNumericChange(field.name, e.target.value)}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      disabled={isLoading}
                      className={`dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 ${errors[field.name] ? 'border-red-500 dark:border-red-400' : ''}`}
                    />
                    {errors[field.name] && <p className="text-xs text-red-500 dark:text-red-400 flex items-center"><AlertCircle className="h-3 w-3 mr-1" />{errors[field.name]}</p>}
                  </FormField>
                ))}
              </div>
              
              <div className="space-y-3 pt-2">
                 <Label className="text-base font-medium dark:text-gray-200">{t('policyCoverage.coverageFlagsTitle', {defaultValue: 'Coverage Flags'})}</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                  {checkboxFields.map(field => (
                    <div key={field.name} className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Checkbox
                        id={field.name}
                        checked={!!formData[field.name]} // Ensure boolean value for checkbox
                        onCheckedChange={(checked) => handleCheckboxChange(field.name, checked)}
                        disabled={isLoading}
                        className="dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <Label htmlFor={field.name} className="text-sm font-normal dark:text-gray-300">
                        {t(field.labelKey, {defaultValue: field.name.replace('_', ' ')})}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4 mt-4 border-t dark:border-gray-700">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => onCloseDialog(false)} className="dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">
                {t('buttons.cancel')}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading || !validateForm()} className="dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white">
              {isLoading && <Save className="animate-spin h-4 w-4 mr-2 rtl:ml-2" />}
              {currentCoverageData?.id ? t('buttons.saveChanges') : t('buttons.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PolicyCoverageDialog;