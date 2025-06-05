import React, { useState, useEffect, useCallback } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { DiagnosisProcedureMapping } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, Save, Link2, X, PlusCircle, Trash2 } from 'lucide-react'; // Added PlusCircle, Trash2
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ScrollArea } from '@/components/ui/scroll-area';

const mappingTypeOptions = [
  { value: 'primary', labelKey: 'mappingType.primary', defaultValue: 'Primary' },
  { value: 'secondary', labelKey: 'mappingType.secondary', defaultValue: 'Secondary' },
  { value: 'conditional', labelKey: 'mappingType.conditional', defaultValue: 'Conditional' },
];

// Simplified rule type options for the dialog
const ruleTypeOptions = [
    { value: 'age', labelKey: 'validityRuleTypes.age', defaultValue: 'Age' },
    { value: 'gender', labelKey: 'validityRuleTypes.gender', defaultValue: 'Gender' },
    { value: 'clinical', labelKey: 'validityRuleTypes.clinical', defaultValue: 'Clinical Condition' },
    { value: 'administrative', labelKey: 'validityRuleTypes.administrative', defaultValue: 'Administrative' },
    { value: 'other', labelKey: 'validityRuleTypes.other', defaultValue: 'Other' },
];


const getDefaultFormData = () => ({
  diagnosis_code: '',
  procedure_code: '',
  mapping_type: '',
  validity_rules: [], // Array of { rule_type: '', rule_value: '' }
  notes: '',
  is_active: true,
});

export default function DiagnosisProcedureDialog({ mapping, isOpen, onClose }) {
  const { t, language, isRTL } = useLanguageHook();
  const [formData, setFormData] = useState(getDefaultFormData());
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  const resetFormAndErrors = useCallback(() => {
    setValidationErrors({});
    setApiError(null);
    if (mapping) {
      setFormData({
        diagnosis_code: mapping.diagnosis_code || '',
        procedure_code: mapping.procedure_code || '',
        mapping_type: mapping.mapping_type || '',
        validity_rules: Array.isArray(mapping.validity_rules) ? mapping.validity_rules.map(r => ({...r})) : [], // Deep copy
        notes: mapping.notes || '',
        is_active: mapping.is_active === undefined ? true : mapping.is_active,
      });
    } else {
      setFormData(getDefaultFormData());
    }
  }, [mapping]);

  useEffect(() => {
    if (isOpen) {
      resetFormAndErrors();
    }
  }, [isOpen, resetFormAndErrors]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
    if (apiError) setApiError(null);
  };

  const handleValidityRuleChange = (index, field, value) => {
    const updatedRules = [...formData.validity_rules];
    updatedRules[index][field] = value;
    setFormData(prev => ({ ...prev, validity_rules: updatedRules }));
    // Clear specific rule validation error if any
    if (validationErrors.validity_rules && validationErrors.validity_rules[index] && validationErrors.validity_rules[index][field]) {
        const newRuleErrors = {...validationErrors.validity_rules[index]};
        delete newRuleErrors[field];
        const overallRuleErrors = {...validationErrors.validity_rules, [index]: newRuleErrors};
        setValidationErrors(prev => ({ ...prev, validity_rules: Object.keys(newRuleErrors).length > 0 ? overallRuleErrors : {...prev.validity_rules, [index]: undefined} }));
    }
  };

  const addValidityRule = () => {
    setFormData(prev => ({
      ...prev,
      validity_rules: [...prev.validity_rules, { rule_type: '', rule_value: '' }],
    }));
  };

  const removeValidityRule = (index) => {
    setFormData(prev => ({
      ...prev,
      validity_rules: prev.validity_rules.filter((_, i) => i !== index),
    }));
     // Clear validation errors for the removed rule
    if (validationErrors.validity_rules && validationErrors.validity_rules[index]) {
        const newRuleErrors = {...validationErrors.validity_rules};
        delete newRuleErrors[index];
        setValidationErrors(prev => ({ ...prev, validity_rules: Object.keys(newRuleErrors).length > 0 ? newRuleErrors : undefined }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = {
      diagnosis_code: t('diagnosisProcedure.fields.diagnosisCode', { defaultValue: 'Diagnosis Code' }),
      procedure_code: t('diagnosisProcedure.fields.procedureCode', { defaultValue: 'Procedure Code' }),
      mapping_type: t('diagnosisProcedure.fields.mappingType', { defaultValue: 'Mapping Type' }),
    };

    for (const [field, fieldName] of Object.entries(requiredFields)) {
      if (!formData[field]) {
        newErrors[field] = t('validation.requiredField', { fieldName, defaultValue: `${fieldName} is required.`});
      }
    }
    
    const ruleErrors = {};
    formData.validity_rules.forEach((rule, index) => {
        const currentRuleErrors = {};
        if(!rule.rule_type) currentRuleErrors.rule_type = t('validation.requiredFieldShort', {defaultValue: 'Type required'});
        if(!rule.rule_value) currentRuleErrors.rule_value = t('validation.requiredFieldShort', {defaultValue: 'Value required'});
        if(Object.keys(currentRuleErrors).length > 0) ruleErrors[index] = currentRuleErrors;
    });
    if(Object.keys(ruleErrors).length > 0) newErrors.validity_rules = ruleErrors;

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setApiError(null);
    
    const dataToSave = {
      ...formData,
      // Ensure validity_rules are clean (no empty strings if not desired by backend)
      validity_rules: formData.validity_rules.filter(rule => rule.rule_type && rule.rule_value),
    };

    try {
      let actionType = 'create';
      const entityDisplayName = `${dataToSave.diagnosis_code} <> ${dataToSave.procedure_code}`;

      if (mapping && mapping.id) {
        await DiagnosisProcedureMapping.update(mapping.id, dataToSave);
        actionType = 'update';
      } else {
        await DiagnosisProcedureMapping.create(dataToSave);
      }
      onClose(true, actionType, entityDisplayName); 
    } catch (err) {
      console.error("Error saving Diagnosis-Procedure mapping:", err);
      const apiErrorMsg = err.message || t('errors.genericSaveFailed', { item: t('diagnosisProcedure.entityName', {defaultValue: "Diagnosis-Procedure Mapping"}), defaultValue: `Failed to save ${t('diagnosisProcedure.entityName', {defaultValue: "Diagnosis-Procedure Mapping"})}. Please try again.` });
      setApiError(apiErrorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const renderFieldError = (field, ruleIndex = null, ruleField = null) => {
    let errorMsg = null;
    if (ruleIndex !== null && ruleField !== null && validationErrors.validity_rules && validationErrors.validity_rules[ruleIndex]) {
        errorMsg = validationErrors.validity_rules[ruleIndex][ruleField];
    } else if (validationErrors[field]) {
        errorMsg = validationErrors[field];
    }
    return errorMsg ? <p className="text-red-500 text-xs mt-1">{errorMsg}</p> : null;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(openState) => !openState && onClose(false)} modal>
      <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl dark:bg-gray-800" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl dark:text-gray-100">
            <Link2 className={`h-6 w-6 ${isRTL ? 'ml-3' : 'mr-3'} text-blue-600 dark:text-blue-400`} />
            {mapping ? t('diagnosisProcedure.editTitle', {defaultValue: "Edit Diagnosis-Procedure Mapping"}) : t('diagnosisProcedure.addTitle', {defaultValue: "Add New Diagnosis-Procedure Mapping"})}
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            {t('diagnosisProcedure.dialogDescription', {defaultValue: "Define relationships between diagnosis and procedure codes, including validity rules."})}
          </DialogDescription>
        </DialogHeader>

        {apiError && (
          <div className="my-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-200 rounded-md flex items-center gap-2 text-sm">
            <AlertTriangle className="h-5 w-5" />
            <span>{apiError}</span>
          </div>
        )}
        
        <ScrollArea className="max-h-[65vh] pr-3">
          <form onSubmit={handleSubmit} id="diagnosis-procedure-dialog-form" className="space-y-4 py-3 pl-1">
            <fieldset className="space-y-3 p-1">
              <legend className="text-sm font-medium dark:text-gray-300 mb-1">{t('diagnosisProcedure.sections.coreCodes', {defaultValue: "Core Codes"})}</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="diagnosis_code" className="dark:text-gray-300">{t('diagnosisProcedure.fields.diagnosisCode', {defaultValue: "Diagnosis Code"})} <span className="text-red-500">*</span></Label>
                  <Input id="diagnosis_code" value={formData.diagnosis_code} onChange={(e) => handleChange('diagnosis_code', e.target.value)} className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
                  {renderFieldError('diagnosis_code')}
                </div>
                <div>
                  <Label htmlFor="procedure_code" className="dark:text-gray-300">{t('diagnosisProcedure.fields.procedureCode', {defaultValue: "Procedure Code"})} <span className="text-red-500">*</span></Label>
                  <Input id="procedure_code" value={formData.procedure_code} onChange={(e) => handleChange('procedure_code', e.target.value)} className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
                  {renderFieldError('procedure_code')}
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-3 p-1 border-t pt-4 dark:border-gray-700">
                <legend className="text-sm font-medium dark:text-gray-300 mb-1">{t('diagnosisProcedure.sections.mappingDetails', {defaultValue: "Mapping Details"})}</legend>
                <div>
                    <Label htmlFor="mapping_type" className="dark:text-gray-300">{t('diagnosisProcedure.fields.mappingType', {defaultValue: "Mapping Type"})} <span className="text-red-500">*</span></Label>
                    <Select value={formData.mapping_type} onValueChange={(value) => handleChange('mapping_type', value)}>
                        <SelectTrigger id="mapping_type" className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                        <SelectValue placeholder={t('filters.selectMappingType', {defaultValue: "Select Mapping Type"})} />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-700 dark:text-gray-200">
                        {mappingTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value} className="dark:hover:bg-gray-600">{t(opt.labelKey, {defaultValue: opt.defaultValue})}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {renderFieldError('mapping_type')}
                </div>
                 <div>
                    <Label htmlFor="notes" className="dark:text-gray-300">{t('common.notesOptional', {defaultValue: "Notes (Optional)"})}</Label>
                    <Textarea id="notes" value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} rows={2} className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
                    {renderFieldError('notes')}
                 </div>
                 <div className="flex items-center space-x-2 rtl:space-x-reverse pt-2">
                    <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => handleChange('is_active', checked)} />
                    <Label htmlFor="is_active" className="dark:text-gray-300">{t('status.active', {defaultValue: "Is Active"})}</Label>
                </div>
            </fieldset>

            <fieldset className="space-y-3 p-1 border-t pt-4 dark:border-gray-700">
                <legend className="text-sm font-medium dark:text-gray-300 mb-1">{t('diagnosisProcedure.sections.validityRules', {defaultValue: "Validity Rules"})}</legend>
                {formData.validity_rules.map((rule, index) => (
                    <div key={index} className="p-3 border rounded-md dark:border-gray-600 space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                            <div>
                                <Label htmlFor={`rule_type_${index}`} className="text-xs dark:text-gray-300">{t('diagnosisProcedure.fields.ruleType', {defaultValue: "Rule Type"})}</Label>
                                <Select value={rule.rule_type} onValueChange={(value) => handleValidityRuleChange(index, 'rule_type', value)}>
                                    <SelectTrigger id={`rule_type_${index}`} className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 text-sm">
                                        <SelectValue placeholder={t('diagnosisProcedure.placeholders.selectRuleType', { defaultValue: 'Select Rule Type' })} />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-gray-700 dark:text-gray-200">
                                        {ruleTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value} className="dark:hover:bg-gray-600 text-sm">{t(opt.labelKey, {defaultValue: opt.defaultValue})}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {renderFieldError('validity_rules', index, 'rule_type')}
                            </div>
                             <div>
                                <Label htmlFor={`rule_value_${index}`} className="text-xs dark:text-gray-300">{t('diagnosisProcedure.fields.ruleValue', {defaultValue: "Rule Value/Criteria"})}</Label>
                                <Input id={`rule_value_${index}`} value={rule.rule_value} onChange={(e) => handleValidityRuleChange(index, 'rule_value', e.target.value)} className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 text-sm" />
                                {renderFieldError('validity_rules', index, 'rule_value')}
                            </div>
                        </div>
                        <Button type="button" variant="destructive" size="sm" onClick={() => removeValidityRule(index)} className="mt-1 text-xs">
                            <Trash2 className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                            {t('buttons.removeRule', {defaultValue: "Remove Rule"})}
                        </Button>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addValidityRule} className="mt-2 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">
                    <PlusCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('buttons.addValidityRule', {defaultValue: "Add Validity Rule"})}
                </Button>
                {validationErrors.validity_rules && typeof validationErrors.validity_rules === 'string' && <p className="text-red-500 text-xs mt-1">{validationErrors.validity_rules}</p> }
            </fieldset>
          </form>
        </ScrollArea>
        
        <DialogFooter className="mt-5 pt-4 border-t dark:border-gray-700">
            <Button type="button" variant="outline" onClick={() => onClose(false)} className="dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">
                <X className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('buttons.cancel', {defaultValue: "Cancel"})}
            </Button>
            <Button type="submit" form="diagnosis-procedure-dialog-form" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                {isLoading ? <LoadingSpinner size="sm" /> : <Save className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />}
                {mapping ? t('buttons.saveChanges', {defaultValue: "Save Changes"}) : t('buttons.createMapping', {defaultValue: "Create Mapping"})}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}