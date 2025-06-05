import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input'; // For group_number
import { Checkbox } from '@/components/ui/checkbox'; // For active_flag
import DatePicker from '@/components/ui/date-picker';
import FormField from '@/components/forms/FormField';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from '@/components/ui/use-toast';
import { InsuredPerson } from '@/api/entities';
import { InsurancePolicy } from '@/api/entities'; // Renamed from Policy

const coverageTypeOptions = [
  { value: 'primary', labelKey: 'policyLinkage.coverageTypes.primary', defaultLabel: 'Primary' },
  { value: 'secondary', labelKey: 'policyLinkage.coverageTypes.secondary', defaultLabel: 'Secondary' },
  { value: 'supplemental', labelKey: 'policyLinkage.coverageTypes.supplemental', defaultLabel: 'Supplemental' },
  { value: 'addon', labelKey: 'policyLinkage.coverageTypes.addon', defaultLabel: 'Add-on' },
];

const relationshipOptions = [
    {value: 'self', labelKey: 'policyLinkage.relationshipTypes.self', defaultLabel: 'Self'},
    {value: 'spouse', labelKey: 'policyLinkage.relationshipTypes.spouse', defaultLabel: 'Spouse'},
    {value: 'child', labelKey: 'policyLinkage.relationshipTypes.child', defaultLabel: 'Child'},
    {value: 'dependent', labelKey: 'policyLinkage.relationshipTypes.dependent', defaultLabel: 'Dependent'},
];

const PolicyLinkDialog = ({ 
    isOpen, 
    onClose, 
    onSubmit, 
    linkageData, 
    setIsValid,
    allInsuredPersons = [], // expecting [{id, name}, ...]
    allPolicies = [] // expecting [{id, policy_number}, ...]
}) => {
  const { t } = useLanguageHook();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    insured_id: '',
    policy_id: '',
    coverage_type: 'primary',
    start_date: null,
    end_date: null,
    active_flag: true,
    policy_number: '', // External policy number, can be different from internal ID's number
    group_number: '',
    relationship_to_primary: 'self',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  
  const [insuredPersonOptions, setInsuredPersonOptions] = useState([]);
  const [policyOptions, setPolicyOptions] = useState([]);

  const translatedCoverageTypeOptions = useMemo(() => coverageTypeOptions.map(opt => ({
    ...opt, label: t(opt.labelKey, { defaultValue: opt.defaultLabel })
  })), [t]);
  const translatedRelationshipOptions = useMemo(() => relationshipOptions.map(opt => ({
      ...opt, label: t(opt.labelKey, { defaultValue: opt.defaultLabel })
  })), [t]);


  useEffect(() => {
    if (allInsuredPersons && allInsuredPersons.length > 0) {
        setInsuredPersonOptions(allInsuredPersons.map(p => ({ value: p.id, label: p.name || p.id })));
    } else {
        const fetchPersons = async () => {
            try {
                const persons = await InsuredPerson.list();
                setInsuredPersonOptions((Array.isArray(persons) ? persons : []).map(p => ({ value: p.id, label: p.full_name || p.id })));
            } catch (err) {
                console.error("Failed to fetch insured persons for linkage dialog:", err);
                toast({ title: t('errors.fetchFailedTitle', {defaultValue: "Fetch Failed"}), description: t('insuredPersons.errorFetchingListShort', {defaultValue: "Could not load insured persons list."}), variant: "destructive" });
            }
        };
        fetchPersons();
    }
  }, [allInsuredPersons, t, toast]);

  useEffect(() => {
    if (allPolicies && allPolicies.length > 0) {
        setPolicyOptions(allPolicies.map(p => ({ value: p.id, label: p.policy_number || p.id })));
    } else {
        const fetchPolicies = async () => {
            try {
                const policiesData = await InsurancePolicy.list();
                setPolicyOptions((Array.isArray(policiesData) ? policiesData : []).map(p => ({ value: p.id, label: p.policy_number || p.id })));
            } catch (err) {
                console.error("Failed to fetch policies for linkage dialog:", err);
                toast({ title: t('errors.fetchFailedTitle', {defaultValue: "Fetch Failed"}), description: t('policies.errorFetchingListShort', {defaultValue: "Could not load policies list."}), variant: "destructive" });
            }
        };
        fetchPolicies();
    }
  }, [allPolicies, t, toast]);


  useEffect(() => {
    if (linkageData) {
      setFormData({
        insured_id: linkageData.insured_id || '',
        policy_id: linkageData.policy_id || '',
        coverage_type: linkageData.coverage_type || 'primary',
        start_date: linkageData.start_date ? new Date(linkageData.start_date) : null,
        end_date: linkageData.end_date ? new Date(linkageData.end_date) : null,
        active_flag: linkageData.active_flag === undefined ? true : linkageData.active_flag,
        policy_number: linkageData.policy_number || '',
        group_number: linkageData.group_number || '',
        relationship_to_primary: linkageData.relationship_to_primary || 'self',
        notes: linkageData.notes || '',
      });
    } else {
      setFormData({
        insured_id: '', policy_id: '', coverage_type: 'primary', start_date: null, end_date: null,
        active_flag: true, policy_number: '', group_number: '', relationship_to_primary: 'self', notes: ''
      });
    }
    setErrors({});
  }, [linkageData, isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!formData.insured_id) newErrors.insured_id = t('validation.requiredField', { field: t('fields.insured', {defaultValue: 'Insured Person'})});
    if (!formData.policy_id) newErrors.policy_id = t('validation.requiredField', { field: t('fields.policyNumber', {defaultValue: 'Policy'})});
    if (!formData.start_date) newErrors.start_date = t('validation.requiredField', { field: t('fields.startDate', {defaultValue: 'Start Date'})});
    if (formData.end_date && formData.start_date && formData.end_date < formData.start_date) {
      newErrors.end_date = t('validation.dateAfterOrEqual', {field1: t('fields.endDate', {defaultValue: 'End Date'}), field2: t('fields.startDate', {defaultValue: 'Start Date'})});
    }
    setErrors(newErrors);
    const isValidForm = Object.keys(newErrors).length === 0;
    if (setIsValid) setIsValid(isValidForm);
    return isValidForm;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const dataToSubmit = {
          ...formData,
          start_date: formData.start_date ? formData.start_date.toISOString().split('T')[0] : null,
          end_date: formData.end_date ? formData.end_date.toISOString().split('T')[0] : null,
      };
      onSubmit(dataToSubmit);
    } else {
        toast({ title: t('errors.validationErrorTitle', {defaultValue: "Validation Error"}), description: t('errors.validationErrorCheckFields', {defaultValue: "Please check the form for errors."}), variant: "destructive"});
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">
            {linkageData ? t('policyLinkage.editLinkageTitle', { defaultValue: 'Edit Policy Linkage' }) : t('policyLinkage.addLinkageTitle', { defaultValue: 'Add New Policy Linkage' })}
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

          <FormField label={t('fields.policy', { defaultValue: 'Policy' })} error={errors.policy_id}>
            <Select value={formData.policy_id} onValueChange={(value) => handleChange('policy_id', value)}>
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                <SelectValue placeholder={t('common.selectPlaceholder', { item: t('fields.policy', {defaultValue: 'Policy'}) })} />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-700 dark:text-gray-200">
                {policyOptions.map(option => (
                  <SelectItem key={option.value} value={option.value} className="dark:hover:bg-gray-600">{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label={t('policyLinkage.fields.externalPolicyNumber', { defaultValue: 'External Policy #' })} error={errors.policy_number}>
            <Input value={formData.policy_number} onChange={(e) => handleChange('policy_number', e.target.value)} className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
          </FormField>

          <FormField label={t('policyLinkage.fields.groupNumber', { defaultValue: 'Group #' })} error={errors.group_number}>
            <Input value={formData.group_number} onChange={(e) => handleChange('group_number', e.target.value)} className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
          </FormField>

          <FormField label={t('policyLinkage.fields.coverageType', { defaultValue: 'Coverage Type' })} error={errors.coverage_type}>
            <Select value={formData.coverage_type} onValueChange={(value) => handleChange('coverage_type', value)}>
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-700 dark:text-gray-200">
                {translatedCoverageTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value} className="dark:hover:bg-gray-600">{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          
          <FormField label={t('policyLinkage.fields.relationshipToPrimary', {defaultValue: 'Relationship to Primary'})} error={errors.relationship_to_primary}>
            <Select value={formData.relationship_to_primary} onValueChange={(value) => handleChange('relationship_to_primary', value)}>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:text-gray-200">
                    {translatedRelationshipOptions.map(option => (
                        <SelectItem key={option.value} value={option.value} className="dark:hover:bg-gray-600">{option.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t('fields.startDate', { defaultValue: 'Start Date' })} error={errors.start_date}>
              <DatePicker date={formData.start_date} setDate={(date) => handleChange('start_date', date)} />
            </FormField>
            <FormField label={t('fields.endDate', { defaultValue: 'End Date' })} error={errors.end_date}>
              <DatePicker date={formData.end_date} setDate={(date) => handleChange('end_date', date)} />
            </FormField>
          </div>
          
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Checkbox
              id="active_flag"
              checked={formData.active_flag}
              onCheckedChange={(checked) => handleChange('active_flag', checked)}
              className="dark:border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <Label htmlFor="active_flag" className="text-sm font-medium dark:text-gray-200">
              {t('fields.active', {defaultValue: 'Active'})}
            </Label>
          </div>

          <FormField label={t('fields.notes', {defaultValue: 'Notes'})} error={errors.notes}>
              <Input as="textarea" value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 min-h-[80px]" />
          </FormField>

        </form>
        <DialogFooter className="pt-4 dark:border-t dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose} className="dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">
            {t('buttons.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button type="submit" onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
            {linkageData ? t('buttons.saveChanges', { defaultValue: 'Save Changes' }) : t('buttons.create', { defaultValue: 'Create Linkage' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PolicyLinkDialog;