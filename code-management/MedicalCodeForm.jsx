// Consolidated MedicalCodeForm - replaces duplicates in medical-codes/MedicalCodeForm.jsx

import React from 'react';
import { useLanguage } from '@/components/context/LanguageContext';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import TagInput from '@/components/shared/TagInput';
import { CODE_SYSTEM_OPTIONS } from '@/components/utils/constants';

export default function MedicalCodeForm({ 
  formData, 
  onChange,
  errors = {},
  isSubmitting = false
}) {
  const { t, isRTL } = useLanguage();

  const handleChange = (field, value) => {
    if (onChange) onChange(field, value);
  };

  const codeSystemOptions = CODE_SYSTEM_OPTIONS.map(option => ({
    value: option.value,
    label: t(option.labelKey, { defaultValue: option.label || option.value })
  }));
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
      <div className="space-y-2">
        <label htmlFor="code" className="text-sm font-medium">
          {t('medicalCodes.code')}*
        </label>
        <Input
          id="code"
          value={formData.code || ''}
          onChange={(e) => handleChange('code', e.target.value)}
          placeholder={t('medicalCodes.codePlaceholder')}
          disabled={isSubmitting}
          className={errors.code ? "border-red-500" : ""}
        />
        {errors.code && (
          <p className="text-sm text-red-500">{errors.code}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="code_system" className="text-sm font-medium">
          {t('medicalCodes.codeSystem')}*
        </label>
        <Select 
          value={formData.code_system || ''} 
          onValueChange={(value) => handleChange('code_system', value)}
          disabled={isSubmitting}
        >
          <SelectTrigger className={errors.code_system ? "border-red-500" : ""}>
            <SelectValue placeholder={t('medicalCodes.selectSystem')} />
          </SelectTrigger>
          <SelectContent>
            {codeSystemOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.code_system && (
          <p className="text-sm text-red-500">{errors.code_system}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="description_en" className="text-sm font-medium">
          {t('medicalCodes.descriptionEn')}*
        </label>
        <Input
          id="description_en"
          value={formData.description_en || ''}
          onChange={(e) => handleChange('description_en', e.target.value)}
          placeholder={t('medicalCodes.descriptionEnPlaceholder')}
          disabled={isSubmitting}
          className={errors.description_en ? "border-red-500" : ""}
        />
        {errors.description_en && (
          <p className="text-sm text-red-500">{errors.description_en}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="description_he" className="text-sm font-medium">
          {t('medicalCodes.descriptionHe')}*
        </label>
        <Input
          id="description_he"
          value={formData.description_he || ''}
          onChange={(e) => handleChange('description_he', e.target.value)}
          placeholder={t('medicalCodes.descriptionHePlaceholder')}
          disabled={isSubmitting}
          dir="rtl"
          className={errors.description_he ? "border-red-500" : ""}
        />
        {errors.description_he && (
          <p className="text-sm text-red-500">{errors.description_he}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="catalog_path" className="text-sm font-medium">
          {t('medicalCodes.catalogPath')}
        </label>
        <Input
          id="catalog_path"
          value={formData.catalog_path || ''}
          onChange={(e) => handleChange('catalog_path', e.target.value)}
          placeholder={t('medicalCodes.catalogPathPlaceholder')}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="tags" className="text-sm font-medium">
          {t('medicalCodes.tags')}
        </label>
        <TagInput
          value={formData.tags || []}
          onChange={(tags) => handleChange('tags', tags)}
          placeholder={t('medicalCodes.tagsPlaceholder')}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="status" className="text-sm font-medium">
          {t('medicalCodes.status')}
        </label>
        <div className="flex items-center space-x-2">
          <Switch
            id="status"
            checked={formData.status === 'active'}
            onCheckedChange={(checked) => handleChange('status', checked ? 'active' : 'deprecated')}
            disabled={isSubmitting}
          />
          <span>
            {formData.status === 'active' 
              ? t('medicalCodes.statusActive')
              : t('medicalCodes.statusDeprecated')}
          </span>
        </div>
      </div>
    </div>
  );
}