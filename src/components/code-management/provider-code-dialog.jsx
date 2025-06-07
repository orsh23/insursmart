import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguageHook } from '@/components/useLanguageHook';
import { ProviderInternalCode } from '@/api/entities';
import { useToast } from "@/components/ui/use-toast";
import { TagInput } from '@/components/common/TagInput'; // Assuming this path is correct
import { FolderTree } from 'lucide-react';
// Assuming providers are passed as a prop
// import { Provider } from '@/api/entities';

const INITIAL_FORM_DATA = {
  provider_id: '',
  code_number: '',
  description_en: '',
  description_he: '',
  category_path: '', // Added category_path
  tags: [],
  status: true, // Default to active
};

export default function ProviderCodeDialog({ isOpen, onClose, providerCode, providers = [] }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (providerCode) {
      setFormData({
        provider_id: providerCode.provider_id || '',
        code_number: providerCode.code_number || '',
        description_en: providerCode.description_en || '',
        description_he: providerCode.description_he || '',
        category_path: providerCode.category_path || '',
        tags: Array.isArray(providerCode.tags) ? providerCode.tags : [],
        status: typeof providerCode.status === 'boolean' ? providerCode.status : true,
      });
    } else {
      setFormData(INITIAL_FORM_DATA);
    }
    setErrors({}); // Reset errors when dialog opens or providerCode changes
  }, [providerCode, isOpen]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.provider_id) newErrors.provider_id = t('validation.required', { field: t('providerCodes.fields.provider', { defaultValue: 'Provider' }) });
    if (!formData.code_number) newErrors.code_number = t('validation.required', { field: t('providerCodes.fields.codeNumber', { defaultValue: 'Code Number' }) });
    if (!formData.description_en && !formData.description_he) {
        newErrors.description_en = t('validation.bilingualRequired', { 
            field1: t('providerCodes.fields.descriptionEn', {defaultValue: 'Description (EN)'}),
            field2: t('providerCodes.fields.descriptionHe', {defaultValue: 'Description (HE)'})
        });
    }
    // Add more validations as needed
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
     if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const handleTagsChange = (newTags) => {
    setFormData(prev => ({ ...prev, tags: newTags }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const dataToSave = { ...formData };
      // Ensure tags is an array, even if empty
      dataToSave.tags = Array.isArray(dataToSave.tags) ? dataToSave.tags : [];


      if (providerCode && providerCode.id) {
        await ProviderInternalCode.update(providerCode.id, dataToSave);
        toast({ title: t('providerCodes.updateSuccessTitle', { defaultValue: 'Provider Code Updated' }), description: t('providerCodes.updateSuccessMessage', { codeNumber: dataToSave.code_number, defaultValue: `Code ${dataToSave.code_number} updated successfully.` }), variant: 'success' });
      } else {
        await ProviderInternalCode.create(dataToSave);
        toast({ title: t('providerCodes.createSuccessTitle', { defaultValue: 'Provider Code Created' }), description: t('providerCodes.createSuccessMessage', { codeNumber: dataToSave.code_number, defaultValue: `Code ${dataToSave.code_number} created successfully.` }), variant: 'success' });
      }
      // Signal success to the parent component for data refresh
      if (onClose) onClose(true); 
    } catch (error) {
      console.error("Error saving provider code:", error);
      toast({
        title: t('common.saveErrorTitle', { defaultValue: 'Save Error' }),
        description: error.message || t('common.saveErrorMessage', { defaultValue: 'An unexpected error occurred.' }),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (saved) => {
    if (onClose) {
      onClose(saved || false); // Ensure a boolean is passed
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose(false)}>
      <DialogContent className="sm:max-w-lg md:max-w-xl dark:bg-gray-800" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {providerCode ? t('providerCodes.editTitle', { defaultValue: 'Edit Provider Code' }) : t('providerCodes.addTitle', { defaultValue: 'Add New Provider Code' })}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
            {providerCode ? t('providerCodes.editDescription', { defaultValue: 'Update the details of the existing provider code.' }) : t('providerCodes.addDescription', { defaultValue: 'Enter the details for the new provider code.' })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <Label htmlFor="provider_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('providerCodes.fields.provider', { defaultValue: 'Provider' })} <span className="text-red-500">*</span>
            </Label>
            <Select
              name="provider_id"
              value={formData.provider_id}
              onValueChange={(value) => handleSelectChange('provider_id', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="provider_id" className={`w-full dark:bg-gray-700 dark:text-white ${errors.provider_id ? 'border-red-500' : ''}`}>
                <SelectValue placeholder={t('providerCodes.selectProviderPlaceholder', { defaultValue: 'Select a provider' })} />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-700">
                {Array.isArray(providers) && providers.map(p => (
                  <SelectItem key={p.id} value={p.id} className="dark:hover:bg-gray-600">
                    {p.name?.[language] || p.name?.en || p.name || p.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.provider_id && <p className="text-xs text-red-500 mt-1">{errors.provider_id}</p>}
          </div>

          <div>
            <Label htmlFor="code_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('providerCodes.fields.codeNumber', { defaultValue: 'Code Number' })} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="code_number"
              name="code_number"
              value={formData.code_number}
              onChange={handleChange}
              className={`w-full dark:bg-gray-700 dark:text-white ${errors.code_number ? 'border-red-500' : ''}`}
              disabled={isSubmitting}
            />
            {errors.code_number && <p className="text-xs text-red-500 mt-1">{errors.code_number}</p>}
          </div>
          
          <div>
            <Label htmlFor="description_en" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('providerCodes.fields.descriptionEn', { defaultValue: 'Description (English)' })} <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description_en"
              name="description_en"
              value={formData.description_en}
              onChange={handleChange}
              rows={2}
              className={`w-full dark:bg-gray-700 dark:text-white ${errors.description_en ? 'border-red-500' : ''}`}
              disabled={isSubmitting}
            />
             {errors.description_en && <p className="text-xs text-red-500 mt-1">{errors.description_en}</p>}
          </div>

          <div>
            <Label htmlFor="description_he" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('providerCodes.fields.descriptionHe', { defaultValue: 'Description (Hebrew)' })}
            </Label>
            <Textarea
              id="description_he"
              name="description_he"
              value={formData.description_he}
              onChange={handleChange}
              rows={2}
              className="w-full dark:bg-gray-700 dark:text-white"
              dir="rtl"
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <Label htmlFor="category_path" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('providerCodes.fields.categoryPath', { defaultValue: 'Category Path' })}
            </Label>
            <div className="relative">
                <FolderTree className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 ${isRTL ? 'right-3' : 'left-3' }`} />
                <Input
                id="category_path"
                name="category_path"
                value={formData.category_path}
                onChange={handleChange}
                placeholder={t('providerCodes.categoryPathPlaceholder', { defaultValue: 'e.g. Surgery/General/Appendectomy' })}
                className={`w-full dark:bg-gray-700 dark:text-white ${isRTL ? 'pr-10' : 'pl-10'}`}
                disabled={isSubmitting}
                />
            </div>
            {/* TODO: Consider a category selector component here in future */}
          </div>

          <div>
            <Label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('providerCodes.fields.tags', { defaultValue: 'Tags' })}
            </Label>
            <TagInput
              id="tags"
              value={formData.tags}
              onChange={handleTagsChange}
              placeholder={t('providerCodes.tagsPlaceholder', {defaultValue: 'Enter tags...'})}
              className="dark:bg-gray-700 dark:text-white"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Switch
              id="status"
              name="status"
              checked={formData.status}
              onCheckedChange={(checked) => handleSelectChange('status', checked)}
              disabled={isSubmitting}
              className="data-[state=checked]:bg-green-500"
            />
            <Label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              {t('providerCodes.fields.active', { defaultValue: 'Active' })}
            </Label>
          </div>

          <DialogFooter className="pt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={isSubmitting} className="dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-700">
                {t('buttons.cancel', { defaultValue: 'Cancel' })}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">
              {isSubmitting ? t('buttons.saving', { defaultValue: 'Saving...' }) : (providerCode ? t('buttons.update', { defaultValue: 'Update' }) : t('buttons.create', { defaultValue: 'Create' }))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}