// ... (content of components/code-management/MedicalCodeDialog.js, renamed to .jsx)
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea'; // Assuming Textarea might be needed
import { MedicalCode } from '@/api/entities';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import TagInput from '@/components/common/TagInput'; // Assuming TagInput exists and path is correct
// import CategoryTreeSelector from './CategoryTreeSelector'; // Example if using a tree selector

const codeSystemOptions = (t) => [
    { value: "ICD9-DX", label: "ICD-9-DX" },
    { value: "ICD9-PROC", label: "ICD-9-PROC" },
    { value: "ICD10-CM", label: "ICD-10-CM" },
    { value: "ICD10-PCS", label: "ICD-10-PCS" },
    { value: "CPT", label: "CPT" },
    { value: "HCPCS", label: "HCPCS" },
];

const statusOptions = (t) => [
  { value: "active", label: t('status.active', { defaultValue: 'Active' }) },
  { value: "deprecated", label: t('status.deprecated', { defaultValue: 'Deprecated' }) },
];

export default function MedicalCodeDialog({ isOpen, onClose, medicalCode, categories }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    code: '',
    code_system: '',
    description_en: '',
    description_he: '',
    tags: [],
    catalog_path: '', // This might be derived or selected via a tree
    status: 'active',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (medicalCode) {
      setFormData({
        code: medicalCode.code || '',
        code_system: medicalCode.code_system || '',
        description_en: medicalCode.description_en || '',
        description_he: medicalCode.description_he || '',
        tags: medicalCode.tags || [],
        catalog_path: medicalCode.catalog_path || '',
        status: medicalCode.status || 'active',
      });
    } else {
      setFormData({
        code: '',
        code_system: codeSystemOptions(t)[0]?.value || '', // Default to first option
        description_en: '',
        description_he: '',
        tags: [],
        catalog_path: '',
        status: 'active',
      });
    }
    setErrors({}); // Reset errors when dialog opens or medicalCode changes
  }, [medicalCode, isOpen, t]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.code.trim()) newErrors.code = t('validation.requiredField', { field: t('medicalCodes.fields.code') });
    if (!formData.code_system) newErrors.code_system = t('validation.requiredField', { field: t('medicalCodes.fields.codeSystem') });
    if (!formData.description_en.trim() && !formData.description_he.trim()) {
        newErrors.description_en = t('validation.atLeastOneDescriptionRequired', { lang1: 'English', lang2: 'Hebrew'});
        newErrors.description_he = t('validation.atLeastOneDescriptionRequired', { lang1: 'English', lang2: 'Hebrew'});
    }
    // Add more validations as needed
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const payload = { ...formData };
      if (medicalCode && medicalCode.id) {
        await MedicalCode.update(medicalCode.id, payload);
        onClose(true, 'update', t('medicalCodes.entityNameSingular', {defaultValue: "Medical Code"}));
      } else {
        await MedicalCode.create(payload);
        onClose(true, 'create', t('medicalCodes.entityNameSingular', {defaultValue: "Medical Code"}));
      }
    } catch (error) {
      console.error("Failed to save medical code:", error);
      toast({
        title: t('toasts.errorTitle', {defaultValue: "Error"}),
        description: t('toasts.saveError', { item: t('medicalCodes.entityNameSingular', {defaultValue: "medical code"}), error: error.message }),
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

  const handleTagsChange = (newTags) => {
    setFormData(prev => ({ ...prev, tags: newTags }));
  };
  
  // Options for select inputs
  const currentCodeSystemOptions = codeSystemOptions(t);
  const currentStatusOptions = statusOptions(t);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isLoading && onClose(!open ? false : undefined)}>
      <DialogContent className={`sm:max-w-lg ${isRTL ? 'rtl' : 'ltr'}`} onInteractOutside={(e) => isLoading && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{medicalCode ? t('medicalCodes.editTitle', {defaultValue: "Edit Medical Code"}) : t('medicalCodes.addTitle', {defaultValue: "Add Medical Code"})}</DialogTitle>
          {medicalCode && <DialogDescription>{t('medicalCodes.editingFor', {defaultValue: "Editing code:"})} {medicalCode.code}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="code">{t('medicalCodes.fields.code', {defaultValue: "Code"})}</Label>
            <Input id="code" value={formData.code} onChange={(e) => handleChange('code', e.target.value)} className={errors.code ? 'border-red-500' : ''} />
            {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
          </div>

          <div>
            <Label htmlFor="code_system">{t('medicalCodes.fields.codeSystem', {defaultValue: "Code System"})}</Label>
            <Select value={formData.code_system} onValueChange={(value) => handleChange('code_system', value)}>
              <SelectTrigger id="code_system" className={errors.code_system ? 'border-red-500' : ''}>
                <SelectValue placeholder={t('filters.selectSystem', {defaultValue: "Select System"})} />
              </SelectTrigger>
              <SelectContent>
                {currentCodeSystemOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.code_system && <p className="text-red-500 text-xs mt-1">{errors.code_system}</p>}
          </div>

          <div>
            <Label htmlFor="description_en">{t('medicalCodes.fields.descriptionEn', {defaultValue: "Description (English)"})}</Label>
            <Input id="description_en" value={formData.description_en} onChange={(e) => handleChange('description_en', e.target.value)} className={errors.description_en ? 'border-red-500' : ''} />
             {errors.description_en && <p className="text-red-500 text-xs mt-1">{errors.description_en}</p>}
          </div>

          <div>
            <Label htmlFor="description_he">{t('medicalCodes.fields.descriptionHe', {defaultValue: "Description (Hebrew)"})}</Label>
            <Input id="description_he" value={formData.description_he} onChange={(e) => handleChange('description_he', e.target.value)} dir="rtl" className={errors.description_he ? 'border-red-500' : ''} />
             {errors.description_he && <p className="text-red-500 text-xs mt-1">{errors.description_he}</p>}
          </div>
          
          <div>
            <Label htmlFor="catalog_path">{t('medicalCodes.fields.catalogPath', { defaultValue: "Catalog Path" })}</Label>
            <Input id="catalog_path" value={formData.catalog_path} onChange={(e) => handleChange('catalog_path', e.target.value)} 
                   placeholder={t('medicalCodes.placeholders.catalogPath', {defaultValue: "e.g., Cardiovascular/Procedures/Angioplasty"})}/>
            {/* If using CategoryTreeSelector:
            <CategoryTreeSelector
                categories={categories}
                selectedPath={formData.catalog_path}
                onPathSelect={(path) => handleChange('catalog_path', path)}
            />
            */}
          </div>

          <div>
            <Label htmlFor="tags">{t('medicalCodes.fields.tags', {defaultValue: "Tags"})}</Label>
            <TagInput id="tags" value={formData.tags} onChange={handleTagsChange} placeholder={t('common.addTagPlaceholder', {defaultValue: "Add a tag..."})} />
          </div>
          
          <div>
            <Label htmlFor="status">{t('medicalCodes.fields.status', {defaultValue: "Status"})}</Label>
            <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
              <SelectTrigger id="status">
                <SelectValue placeholder={t('filters.selectStatus', {defaultValue: "Select Status"})} />
              </SelectTrigger>
              <SelectContent>
                {currentStatusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => onClose()} disabled={isLoading}>
                {t('buttons.cancel', {defaultValue: "Cancel"})}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading} className="min-w-[100px]">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {medicalCode ? t('buttons.update', {defaultValue: "Update"}) : t('buttons.create', {defaultValue: "Create"})}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}