// ... (content of components/code-management/InternalCodeDialog.js, renamed to .jsx)
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch'; // For boolean fields
import { InternalCode } from '@/api/entities';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import TagInput from '@/components/common/TagInput';

export default function InternalCodeDialog({ isOpen, onClose, internalCode }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    code_number: '',
    description_en: '',
    description_he: '',
    category_path: '',
    tags: [],
    is_billable: true,
    is_active: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (internalCode) {
      setFormData({
        code_number: internalCode.code_number || '',
        description_en: internalCode.description_en || '',
        description_he: internalCode.description_he || '',
        category_path: internalCode.category_path || '',
        tags: internalCode.tags || [],
        is_billable: typeof internalCode.is_billable === 'boolean' ? internalCode.is_billable : true,
        is_active: typeof internalCode.is_active === 'boolean' ? internalCode.is_active : true,
      });
    } else {
      setFormData({
        code_number: '',
        description_en: '',
        description_he: '',
        category_path: '',
        tags: [],
        is_billable: true,
        is_active: true,
      });
    }
    setErrors({});
  }, [internalCode, isOpen]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.code_number.trim()) newErrors.code_number = t('validation.requiredField', { field: t('internalCodes.fields.codeNumber') });
    if (!formData.description_en.trim() && !formData.description_he.trim()) {
        newErrors.description_en = t('validation.atLeastOneDescriptionRequired', { lang1: 'English', lang2: 'Hebrew'});
        newErrors.description_he = t('validation.atLeastOneDescriptionRequired', { lang1: 'English', lang2: 'Hebrew'});
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const payload = { ...formData };
      if (internalCode && internalCode.id) {
        await InternalCode.update(internalCode.id, payload);
        onClose(true, 'update', t('internalCodes.entityNameSingular', {defaultValue: "Internal Code"}));
      } else {
        await InternalCode.create(payload);
        onClose(true, 'create', t('internalCodes.entityNameSingular', {defaultValue: "Internal Code"}));
      }
    } catch (error) {
      console.error("Failed to save internal code:", error);
      toast({
        title: t('toasts.errorTitle', {defaultValue: "Error"}),
        description: t('toasts.saveError', { item: t('internalCodes.entityNameSingular', {defaultValue: "internal code"}), error: error.message }),
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
    handleChange('tags', newTags);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isLoading && onClose(!open ? false : undefined)}>
      <DialogContent className={`sm:max-w-lg ${isRTL ? 'rtl' : 'ltr'}`} onInteractOutside={(e) => isLoading && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{internalCode ? t('internalCodes.editTitle', {defaultValue: "Edit Internal Code"}) : t('internalCodes.addTitle', {defaultValue: "Add Internal Code"})}</DialogTitle>
          {internalCode && <DialogDescription>{t('internalCodes.editingFor', {defaultValue: "Editing code:"})} {internalCode.code_number}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="code_number">{t('internalCodes.fields.codeNumber', {defaultValue: "Code Number"})}</Label>
            <Input id="code_number" value={formData.code_number} onChange={(e) => handleChange('code_number', e.target.value)} className={errors.code_number ? 'border-red-500' : ''} />
            {errors.code_number && <p className="text-red-500 text-xs mt-1">{errors.code_number}</p>}
          </div>

          <div>
            <Label htmlFor="description_en">{t('internalCodes.fields.descriptionEn', {defaultValue: "Description (English)"})}</Label>
            <Input id="description_en" value={formData.description_en} onChange={(e) => handleChange('description_en', e.target.value)} className={errors.description_en ? 'border-red-500' : ''} />
            {errors.description_en && <p className="text-red-500 text-xs mt-1">{errors.description_en}</p>}
          </div>

          <div>
            <Label htmlFor="description_he">{t('internalCodes.fields.descriptionHe', {defaultValue: "Description (Hebrew)"})}</Label>
            <Input id="description_he" value={formData.description_he} onChange={(e) => handleChange('description_he', e.target.value)} dir="rtl" className={errors.description_he ? 'border-red-500' : ''} />
            {errors.description_he && <p className="text-red-500 text-xs mt-1">{errors.description_he}</p>}
          </div>
          
          <div>
            <Label htmlFor="category_path">{t('internalCodes.fields.categoryPath', { defaultValue: "Category Path" })}</Label>
            <Input id="category_path" value={formData.category_path} onChange={(e) => handleChange('category_path', e.target.value)} 
                   placeholder={t('internalCodes.placeholders.categoryPath', {defaultValue: "e.g., General/Administrative/Consultation"})}/>
          </div>
          
          <div>
            <Label htmlFor="tags">{t('internalCodes.fields.tags', {defaultValue: "Tags"})}</Label>
            <TagInput id="tags" value={formData.tags} onChange={handleTagsChange} placeholder={t('common.addTagPlaceholder', {defaultValue: "Add a tag..."})}/>
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Switch id="is_billable" checked={formData.is_billable} onCheckedChange={(checked) => handleChange('is_billable', checked)} />
            <Label htmlFor="is_billable">{t('internalCodes.fields.isBillable', {defaultValue: "Is Billable"})}</Label>
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => handleChange('is_active', checked)} />
            <Label htmlFor="is_active">{t('internalCodes.fields.isActive', {defaultValue: "Is Active"})}</Label>
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => onClose()} disabled={isLoading}>
                {t('buttons.cancel', {defaultValue: "Cancel"})}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading} className="min-w-[100px]">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {internalCode ? t('buttons.update', {defaultValue: "Update"}) : t('buttons.create', {defaultValue: "Create"})}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}