import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea'; // Added
import DatePicker from '@/components/ui/date-picker'; // Assuming a DatePicker component exists
import FormField from '@/components/forms/FormField';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from '@/components/ui/use-toast';
import { InsuredPerson } from '@/api/entities'; // For fetching list

const policyStatusOptions = [
  { value: 'active', labelKey: 'status.active', defaultLabel: 'Active' },
  { value: 'suspended', labelKey: 'status.suspended', defaultLabel: 'Suspended' },
  { value: 'terminated', labelKey: 'status.terminated', defaultLabel: 'Terminated' },
];

const PolicyDialog = ({ isOpen, onClose, onSubmit, policyData, setIsValid, allInsuredPersons = [] }) => {
  const { t } = useLanguageHook();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    insured_id: '',
    policy_number: '',
    valid_from: null,
    valid_to: null,
    status: 'active',
    coverage_rules: {
      copay_percentage: 0,
      annual_deductible: 0,
      max_annual_coverage: 0,
      excluded_codes: [], // Assuming array of strings
      included_categories: [], // Assuming array of strings
      requires_preauthorization: [], // Assuming array of strings
    },
    special_conditions: [] // Assuming array of objects: {condition_type, details, valid_until}
  });
  const [errors, setErrors] = useState({});
  const [insuredPersonOptions, setInsuredPersonOptions] = useState([]);

  const translatedStatusOptions = useMemo(() => policyStatusOptions.map(opt => ({
    ...opt,
    label: t(opt.labelKey, { defaultValue: opt.defaultLabel })
  })), [t]);

  useEffect(() => {
    if (allInsuredPersons && allInsuredPersons.length > 0) {
        setInsuredPersonOptions(allInsuredPersons.map(p => ({ value: p.id, label: p.name || p.id })));
    } else {
        // Fallback fetch if not provided (might be slow if many insured persons)
        const fetchPersons = async () => {
            try {
                const persons = await InsuredPerson.list();
                setInsuredPersonOptions((Array.isArray(persons) ? persons : []).map(p => ({ value: p.id, label: p.full_name || p.id })));
            } catch (err) {
                console.error("Failed to fetch insured persons for dialog:", err);
                toast({ title: t('errors.fetchFailedTitle', {defaultValue: "Fetch Failed"}), description: t('insuredPersons.errorFetchingListShort', {defaultValue: "Could not load insured persons list."}), variant: "destructive" });
            }
        };
        fetchPersons();
    }
  }, [allInsuredPersons, t, toast]);


  useEffect(() => {
    if (policyData) {
      setFormData({
        insured_id: policyData.insured_id || '',
        policy_number: policyData.policy_number || '',
        valid_from: policyData.valid_from ? new Date(policyData.valid_from) : null,
        valid_to: policyData.valid_to ? new Date(policyData.valid_to) : null,
        status: policyData.status || 'active',
        coverage_rules: {
          copay_percentage: policyData.coverage_rules?.copay_percentage || 0,
          annual_deductible: policyData.coverage_rules?.annual_deductible || 0,
          max_annual_coverage: policyData.coverage_rules?.max_annual_coverage || 0,
          excluded_codes: policyData.coverage_rules?.excluded_codes || [],
          included_categories: policyData.coverage_rules?.included_categories || [],
          requires_preauthorization: policyData.coverage_rules?.requires_preauthorization || [],
        },
        special_conditions: policyData.special_conditions || []
      });
    } else {
      // Reset for new policy
      setFormData({
        insured_id: '',
        policy_number: '',
        valid_from: null,
        valid_to: null,
        status: 'active',
        coverage_rules: { copay_percentage: 0, annual_deductible: 0, max_annual_coverage: 0, excluded_codes: [], included_categories: [], requires_preauthorization: [] },
        special_conditions: []
      });
    }
    setErrors({});
  }, [policyData, isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!formData.insured_id) newErrors.insured_id = t('validation.requiredField', { field: t('fields.insured', {defaultValue: 'Insured Person'})});
    if (!formData.policy_number) newErrors.policy_number = t('validation.requiredField', { field: t('fields.policyNumber', {defaultValue: 'Policy Number'})});
    if (!formData.valid_from) newErrors.valid_from = t('validation.requiredField', { field: t('fields.validFrom', {defaultValue: 'Valid From'})});
    if (!formData.valid_to) newErrors.valid_to = t('validation.requiredField', { field: t('fields.validTo', {defaultValue: 'Valid To'})});
    if (formData.valid_from && formData.valid_to && formData.valid_from > formData.valid_to) {
        newErrors.valid_to = t('validation.dateAfter', {field1: t('fields.validTo', {defaultValue: 'Valid To'}), field2: t('fields.validFrom', {defaultValue: 'Valid From'})});
    }
    // Add more validations for coverage_rules and special_conditions if needed
    if (formData.coverage_rules.copay_percentage < 0 || formData.coverage_rules.copay_percentage > 100) {
        newErrors.copay_percentage = t('validation.valueBetween', {field: t('policies.fields.copayPercentage', {defaultValue:'Copay %'}), min:0, max:100});
    }
     if (formData.coverage_rules.annual_deductible < 0) {
        newErrors.annual_deductible = t('validation.mustBePositive', {field: t('policies.fields.annualDeductible', {defaultValue:'Annual Deductible'})});
    }
    if (formData.coverage_rules.max_annual_coverage < 0) {
        newErrors.max_annual_coverage = t('validation.mustBePositive', {field: t('policies.fields.maxAnnualCoverage', {defaultValue:'Max Annual Coverage'})});
    }

    setErrors(newErrors);
    const isValidForm = Object.keys(newErrors).length === 0;
    if (setIsValid) setIsValid(isValidForm); // Communicate validation status to parent
    return isValidForm;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCoverageChange = (field, value) => {
    let numericValue = value;
    if (field === 'copay_percentage' || field === 'annual_deductible' || field === 'max_annual_coverage') {
        numericValue = parseFloat(value);
        if (isNaN(numericValue)) numericValue = 0; // Default to 0 if not a number
    }

    setFormData(prev => ({
      ...prev,
      coverage_rules: { ...prev.coverage_rules, [field]: numericValue }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const dataToSubmit = {
          ...formData,
          valid_from: formData.valid_from ? formData.valid_from.toISOString().split('T')[0] : null,
          valid_to: formData.valid_to ? formData.valid_to.toISOString().split('T')[0] : null,
          // Ensure numeric fields are numbers
          coverage_rules: {
              ...formData.coverage_rules,
              copay_percentage: Number(formData.coverage_rules.copay_percentage) || 0,
              annual_deductible: Number(formData.coverage_rules.annual_deductible) || 0,
              max_annual_coverage: Number(formData.coverage_rules.max_annual_coverage) || 0,
          }
      };
      onSubmit(dataToSubmit);
    } else {
        toast({ title: t('errors.validationErrorTitle', {defaultValue: "Validation Error"}), description: t('errors.validationErrorCheckFields', {defaultValue: "Please check the form for errors."}), variant: "destructive"});
    }
  };
  
  // TODO: Add UI for managing coverage_rules.excluded_codes, included_categories, requires_preauthorization (e.g., TagInput or MultiSelect)
  // TODO: Add UI for managing special_conditions (e.g., a list of sub-forms or a more complex component)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">
            {policyData ? t('policies.editPolicyTitle', { defaultValue: 'Edit Policy' }) : t('policies.addPolicyTitle', { defaultValue: 'Add New Policy' })}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <FormField label={t('fields.insured', { defaultValue: 'Insured Person' })} error={errors.insured_id}>
            <Select value={formData.insured_id} onValueChange={(value) => handleChange('insured_id', value)}>
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                <SelectValue placeholder={t('common.selectPlaceholder', { item: t('fields.insured', {defaultValue: 'Insured Person'}) })} />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-700 dark:text-gray-200">
                {insuredPersonOptions.map(option => (
                  <SelectItem key={option.value} value={option.value} className="dark:hover:bg-gray-600">{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label={t('fields.policyNumber', { defaultValue: 'Policy Number' })} error={errors.policy_number}>
            <Input 
              value={formData.policy_number} 
              onChange={(e) => handleChange('policy_number', e.target.value)}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" 
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t('fields.validFrom', { defaultValue: 'Valid From' })} error={errors.valid_from}>
              <DatePicker date={formData.valid_from} setDate={(date) => handleChange('valid_from', date)} />
            </FormField>
            <FormField label={t('fields.validTo', { defaultValue: 'Valid To' })} error={errors.valid_to}>
              <DatePicker date={formData.valid_to} setDate={(date) => handleChange('valid_to', date)} />
            </FormField>
          </div>

          <FormField label={t('fields.status', { defaultValue: 'Status' })} error={errors.status}>
            <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                <SelectValue placeholder={t('common.selectPlaceholder', { item: t('fields.status', {defaultValue: 'Status'}) })} />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-700 dark:text-gray-200">
                {translatedStatusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value} className="dark:hover:bg-gray-600">{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          
          <div className="pt-3">
            <Label className="text-md font-semibold dark:text-gray-200">{t('policies.sections.coverageRules', {defaultValue: 'Coverage Rules'})}</Label>
            <div className="mt-2 space-y-3 p-3 border rounded-md dark:border-gray-700">
                <FormField label={t('policies.fields.copayPercentage', {defaultValue: 'Copay %'})} error={errors.copay_percentage}>
                    <Input type="number" min="0" max="100" step="0.1" value={formData.coverage_rules.copay_percentage} onChange={(e) => handleCoverageChange('copay_percentage', e.target.value)} className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                </FormField>
                <FormField label={t('policies.fields.annualDeductible', {defaultValue: 'Annual Deductible'})} error={errors.annual_deductible}>
                    <Input type="number" min="0" step="0.01" value={formData.coverage_rules.annual_deductible} onChange={(e) => handleCoverageChange('annual_deductible', e.target.value)} className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                </FormField>
                <FormField label={t('policies.fields.maxAnnualCoverage', {defaultValue: 'Max Annual Coverage'})} error={errors.max_annual_coverage}>
                    <Input type="number" min="0" step="0.01" value={formData.coverage_rules.max_annual_coverage} onChange={(e) => handleCoverageChange('max_annual_coverage', e.target.value)} className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                </FormField>
                {/* TODO: Inputs for excluded_codes, included_categories, requires_preauthorization using TagInput or MultiSelect */}
            </div>
          </div>

          {/* TODO: UI for special_conditions */}
          {/* 
          <div className="pt-3">
            <Label className="text-md font-semibold dark:text-gray-200">{t('policies.sections.specialConditions', {defaultValue: 'Special Conditions'})}</Label>
            // UI to add/edit special conditions objects
          </div> 
          */}

        </form>
        <DialogFooter className="pt-4 dark:border-t dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose} className="dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">
            {t('buttons.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button type="submit" onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
            {policyData ? t('buttons.saveChanges', { defaultValue: 'Save Changes' }) : t('buttons.create', { defaultValue: 'Create Policy' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PolicyDialog;