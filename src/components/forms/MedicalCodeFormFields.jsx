import React from 'react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import TagInput from '../common/TagInput';
import { FormLabel } from '../ui/label';
import { useTranslation } from '../utils/i18n';
import { CODE_SYSTEM_OPTIONS, CODE_STATUSES } from '../utils/constants';

export default function MedicalCodeFormFields({
  formData = {},
  formErrors = {},
  updateField,
  isRTL
}) {
  const { t } = useTranslation();
  
  // Safely access form data with defaults
  const safeFormData = formData || {};
  
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FormLabel htmlFor="code" className="mb-2 block">
            {t('codeMgmt.medicalCodes.code')} <span className="text-red-500">*</span>
          </FormLabel>
          <Input
            id="code"
            value={safeFormData.code || ''}
            onChange={(e) => updateField('code', e.target.value)}
            placeholder={t('codeMgmt.medicalCodes.codePlaceholder')}
            className={formErrors.code ? 'border-red-500' : ''}
          />
          {formErrors.code && (
            <p className="text-red-500 text-sm mt-1">{formErrors.code}</p>
          )}
        </div>

        <div>
          <FormLabel htmlFor="code_system" className="mb-2 block">
            {t('codeMgmt.medicalCodes.codeSystem')} <span className="text-red-500">*</span>
          </FormLabel>
          <Select
            value={safeFormData.code_system || ''}
            onValueChange={(value) => updateField('code_system', value)}
          >
            <SelectTrigger id="code_system" className={formErrors.code_system ? 'border-red-500' : ''}>
              <SelectValue placeholder={t('codeMgmt.medicalCodes.selectCodeSystem')} />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(CODE_SYSTEM_OPTIONS) && CODE_SYSTEM_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(`codeMgmt.medicalCodes.codeSystems.${option.value}`, option.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formErrors.code_system && (
            <p className="text-red-500 text-sm mt-1">{formErrors.code_system}</p>
          )}
        </div>
      </div>

      <div>
        <FormLabel htmlFor="description_en" className="mb-2 block">
          {t('codeMgmt.medicalCodes.descriptionEn')} <span className="text-red-500">*</span>
        </FormLabel>
        <Textarea
          id="description_en"
          value={safeFormData.description_en || ''}
          onChange={(e) => updateField('description_en', e.target.value)}
          placeholder={t('codeMgmt.medicalCodes.descriptionEnPlaceholder')}
          className={formErrors.description || formErrors.description_en ? 'border-red-500' : ''}
        />
        {(formErrors.description || formErrors.description_en) && (
          <p className="text-red-500 text-sm mt-1">
            {formErrors.description || formErrors.description_en}
          </p>
        )}
      </div>

      <div dir="rtl">
        <FormLabel htmlFor="description_he" className="mb-2 block text-right">
          {t('codeMgmt.medicalCodes.descriptionHe')}
        </FormLabel>
        <Textarea
          id="description_he"
          value={safeFormData.description_he || ''}
          onChange={(e) => updateField('description_he', e.target.value)}
          placeholder={t('codeMgmt.medicalCodes.descriptionHePlaceholder')}
          className="text-right"
        />
      </div>

      <div>
        <FormLabel htmlFor="catalog_path" className="mb-2 block">
          {t('codeMgmt.medicalCodes.catalogPath')}
        </FormLabel>
        <Input
          id="catalog_path"
          value={safeFormData.catalog_path || ''}
          onChange={(e) => updateField('catalog_path', e.target.value)}
          placeholder={t('codeMgmt.medicalCodes.catalogPathPlaceholder')}
        />
      </div>

      <div>
        <FormLabel htmlFor="tags" className="mb-2 block">
          {t('codeMgmt.medicalCodes.tags')}
        </FormLabel>
        <TagInput
          tags={Array.isArray(safeFormData.tags) ? safeFormData.tags : []}
          setTags={(tags) => updateField('tags', tags)}
          placeholder={t('codeMgmt.medicalCodes.tagsPlaceholder')}
        />
      </div>

      <div>
        <FormLabel htmlFor="status" className="mb-2 block">
          {t('codeMgmt.medicalCodes.status')}
        </FormLabel>
        <Select
          value={safeFormData.status || 'active'}
          onValueChange={(value) => updateField('status', value)}
        >
          <SelectTrigger id="status">
            <SelectValue placeholder={t('codeMgmt.medicalCodes.selectStatus')} />
          </SelectTrigger>
          <SelectContent>
            {Array.isArray(CODE_STATUSES) && CODE_STATUSES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {t(`codeMgmt.medicalCodes.statuses.${option.value}`, option.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}