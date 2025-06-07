// ... (content of components/code-management/CrosswalkDialog.js, renamed to .jsx)
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Crosswalk } from '@/api/entities';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import TagInput from '@/components/common/TagInput'; // For target_codes if they are treated as tags

const codeTypeOptions = (t) => [
  { value: 'ICD9', label: t('codeSystems.ICD9', { defaultValue: 'ICD-9' }) },
  { value: 'ICD10', label: t('codeSystems.ICD10', { defaultValue: 'ICD-10' }) },
  { value: 'CPT', label: t('codeSystems.CPT', { defaultValue: 'CPT' }) },
  { value: 'HCPCS', label: t('codeSystems.HCPCS', { defaultValue: 'HCPCS' }) },
  { value: 'Internal', label: t('codeSystems.Internal', { defaultValue: 'Internal' }) },
];

const mappingTypeOptions = (t) => [
  { value: 'Single', label: t('mappingTypes.single', { defaultValue: 'Single' }) },
  { value: 'Alternative', label: t('mappingTypes.alternative', { defaultValue: 'Alternative' }) },
  { value: 'Combination', label: t('mappingTypes.combination', { defaultValue: 'Combination' }) },
  { value: 'No Map', label: t('mappingTypes.noMap', { defaultValue: 'No Map' }) },
];

const accuracyOptions = (t) => [
  { value: 'Exact', label: t('accuracyLevels.exact', { defaultValue: 'Exact' }) },
  { value: 'Approximate', label: t('accuracyLevels.approximate', { defaultValue: 'Approximate' }) },
  { value: 'Partial', label: t('accuracyLevels.partial', { defaultValue: 'Partial' }) },
];

export default function CrosswalkDialog({ isOpen, onClose, crosswalk }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    anchor_code: '',
    anchor_type: '',
    target_code_type: '',
    target_codes: [], // Use TagInput for this
    mapping_type: '',
    accuracy: '',
    combination_scenario: '',
    mapping_option: '',
    is_active: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (crosswalk) {
      setFormData({
        anchor_code: crosswalk.anchor_code || '',
        anchor_type: crosswalk.anchor_type || '',
        target_code_type: crosswalk.target_code_type || '',
        target_codes: Array.isArray(crosswalk.target_codes) ? crosswalk.target_codes : [],
        mapping_type: crosswalk.mapping_type || '',
        accuracy: crosswalk.accuracy || '',
        combination_scenario: crosswalk.combination_scenario || '',
        mapping_option: crosswalk.mapping_option || '',
        is_active: typeof crosswalk.is_active === 'boolean' ? crosswalk.is_active : true,
      });
    } else {
      setFormData({
        anchor_code: '',
        anchor_type: codeTypeOptions(t)[0]?.value || '',
        target_code_type: codeTypeOptions(t)[0]?.value || '',
        target_codes: [],
        mapping_type: mappingTypeOptions(t)[0]?.value || '',
        accuracy: accuracyOptions(t)[0]?.value || '',
        combination_scenario: '',
        mapping_option: '',
        is_active: true,
      });
    }
    setErrors({});
  }, [crosswalk, isOpen, t]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.anchor_code.trim()) newErrors.anchor_code = t('validation.requiredField', { field: t('crosswalks.fields.anchorCode') });
    if (!formData.anchor_type) newErrors.anchor_type = t('validation.requiredField', { field: t('crosswalks.fields.anchorType') });
    if (!formData.target_code_type) newErrors.target_code_type = t('validation.requiredField', { field: t('crosswalks.fields.targetCodeType') });
    if (formData.target_codes.length === 0) newErrors.target_codes = t('validation.requiredField', { field: t('crosswalks.fields.targetCodes') });
    if (!formData.mapping_type) newErrors.mapping_type = t('validation.requiredField', { field: t('crosswalks.fields.mappingType') });
    if (!formData.accuracy) newErrors.accuracy = t('validation.requiredField', { field: t('crosswalks.fields.accuracy') });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const payload = { ...formData };
      if (crosswalk && crosswalk.id) {
        await Crosswalk.update(crosswalk.id, payload);
        onClose(true, 'update', t('crosswalks.entityNameSingular', {defaultValue: "Crosswalk Mapping"}));
      } else {
        await Crosswalk.create(payload);
        onClose(true, 'create', t('crosswalks.entityNameSingular', {defaultValue: "Crosswalk Mapping"}));
      }
    } catch (error) {
      console.error("Failed to save crosswalk mapping:", error);
      toast({
        title: t('toasts.errorTitle', {defaultValue: "Error"}),
        description: t('toasts.saveError', { item: t('crosswalks.entityNameSingular', {defaultValue: "crosswalk mapping"}), error: error.message }),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleTargetCodesChange = (newTags) => {
    handleChange('target_codes', newTags);
  };

  const currentCodeTypeOptions = codeTypeOptions(t);
  const currentMappingTypeOptions = mappingTypeOptions(t);
  const currentAccuracyOptions = accuracyOptions(t);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isLoading && onClose(!open ? false : undefined)}>
      <DialogContent className={`sm:max-w-lg ${isRTL ? 'rtl' : 'ltr'}`} onInteractOutside={(e) => isLoading && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{crosswalk ? t('crosswalks.editTitle', {defaultValue: "Edit Crosswalk Mapping"}) : t('crosswalks.addTitle', {defaultValue: "Add Crosswalk Mapping"})}</DialogTitle>
          {crosswalk && <DialogDescription>{t('crosswalks.editingFor', {defaultValue: "Editing mapping for anchor code:"})} {crosswalk.anchor_code}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <Label htmlFor="anchor_code">{t('crosswalks.fields.anchorCode', {defaultValue: "Anchor Code"})}</Label>
            <Input id="anchor_code" value={formData.anchor_code} onChange={(e) => handleChange('anchor_code', e.target.value)} className={errors.anchor_code ? 'border-red-500' : ''} />
            {errors.anchor_code && <p className="text-red-500 text-xs mt-1">{errors.anchor_code}</p>}
          </div>

          <div>
            <Label htmlFor="anchor_type">{t('crosswalks.fields.anchorType', {defaultValue: "Anchor Type"})}</Label>
            <Select value={formData.anchor_type} onValueChange={(value) => handleChange('anchor_type', value)}>
              <SelectTrigger id="anchor_type" className={errors.anchor_type ? 'border-red-500' : ''}><SelectValue placeholder={t('filters.selectAnchorType', {defaultValue: "Select Anchor Type"})} /></SelectTrigger>
              <SelectContent>{currentCodeTypeOptions.map(opt => <SelectItem key={`at-${opt.value}`} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
            </Select>
            {errors.anchor_type && <p className="text-red-500 text-xs mt-1">{errors.anchor_type}</p>}
          </div>

          <div>
            <Label htmlFor="target_code_type">{t('crosswalks.fields.targetCodeType', {defaultValue: "Target Code Type"})}</Label>
            <Select value={formData.target_code_type} onValueChange={(value) => handleChange('target_code_type', value)}>
              <SelectTrigger id="target_code_type" className={errors.target_code_type ? 'border-red-500' : ''}><SelectValue placeholder={t('filters.selectTargetType', {defaultValue: "Select Target Type"})} /></SelectTrigger>
              <SelectContent>{currentCodeTypeOptions.map(opt => <SelectItem key={`tt-${opt.value}`} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
            </Select>
            {errors.target_code_type && <p className="text-red-500 text-xs mt-1">{errors.target_code_type}</p>}
          </div>
          
          <div>
            <Label htmlFor="target_codes">{t('crosswalks.fields.targetCodes', {defaultValue: "Target Codes"})}</Label>
            <TagInput id="target_codes" value={formData.target_codes} onChange={handleTargetCodesChange} placeholder={t('crosswalks.placeholders.targetCodes', {defaultValue: "Enter target codes..."})} className={errors.target_codes ? 'border-red-500' : ''}/>
            {errors.target_codes && <p className="text-red-500 text-xs mt-1">{errors.target_codes}</p>}
          </div>

          <div>
            <Label htmlFor="mapping_type">{t('crosswalks.fields.mappingType', {defaultValue: "Mapping Type"})}</Label>
            <Select value={formData.mapping_type} onValueChange={(value) => handleChange('mapping_type', value)}>
              <SelectTrigger id="mapping_type" className={errors.mapping_type ? 'border-red-500' : ''}><SelectValue placeholder={t('filters.selectMappingType', {defaultValue: "Select Mapping Type"})} /></SelectTrigger>
              <SelectContent>{currentMappingTypeOptions.map(opt => <SelectItem key={`mt-${opt.value}`} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
            </Select>
            {errors.mapping_type && <p className="text-red-500 text-xs mt-1">{errors.mapping_type}</p>}
          </div>

          <div>
            <Label htmlFor="accuracy">{t('crosswalks.fields.accuracy', {defaultValue: "Accuracy"})}</Label>
            <Select value={formData.accuracy} onValueChange={(value) => handleChange('accuracy', value)}>
              <SelectTrigger id="accuracy" className={errors.accuracy ? 'border-red-500' : ''}><SelectValue placeholder={t('filters.selectAccuracy', {defaultValue: "Select Accuracy Level"})} /></SelectTrigger>
              <SelectContent>{currentAccuracyOptions.map(opt => <SelectItem key={`ac-${opt.value}`} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
            </Select>
            {errors.accuracy && <p className="text-red-500 text-xs mt-1">{errors.accuracy}</p>}
          </div>

          <div>
            <Label htmlFor="combination_scenario">{t('crosswalks.fields.combinationScenario', {defaultValue: "Combination Scenario"})}</Label>
            <Textarea id="combination_scenario" value={formData.combination_scenario} onChange={(e) => handleChange('combination_scenario', e.target.value)} placeholder={t('crosswalks.placeholders.combinationScenario', {defaultValue: "Describe combination scenario if applicable"})}/>
          </div>

          <div>
            <Label htmlFor="mapping_option">{t('crosswalks.fields.mappingOption', {defaultValue: "Mapping Option"})}</Label>
            <Textarea id="mapping_option" value={formData.mapping_option} onChange={(e) => handleChange('mapping_option', e.target.value)} placeholder={t('crosswalks.placeholders.mappingOption', {defaultValue: "Additional mapping details or options"})}/>
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => handleChange('is_active', checked)} />
            <Label htmlFor="is_active">{t('crosswalks.fields.isActive', {defaultValue: "Is Active"})}</Label>
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => onClose()} disabled={isLoading}>
                {t('buttons.cancel', {defaultValue: "Cancel"})}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading} className="min-w-[100px]">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {crosswalk ? t('buttons.update', {defaultValue: "Update"}) : t('buttons.create', {defaultValue: "Create"})}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}