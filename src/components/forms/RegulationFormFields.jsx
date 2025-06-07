import React from 'react';
import { useTranslation } from '@/components/utils/i18n';
import FormField from '@/components/shared/FormField';
import SelectField from '@/components/common/SelectField';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import TagInput from '@/components/common/TagInput';
import { format } from 'date-fns';

/**
 * Form fields for Regulation entity
 * 
 * @param {Object} props Component props
 * @param {Object} props.formData Current form data
 * @param {Function} props.updateField Function to update a field
 * @param {Object} props.formErrors Validation errors
 * @param {boolean} props.isRTL Whether the UI is in RTL mode
 */
export default function RegulationFormFields({
  formData = {},
  updateField,
  formErrors = {},
  isRTL = false
}) {
  const { t } = useTranslation();

  const regulationTypeOptions = [
    { value: 'Insurance', label: t('regulations.types.insurance', 'Insurance') },
    { value: 'Healthcare', label: t('regulations.types.healthcare', 'Healthcare') },
    { value: 'Internal', label: t('regulations.types.internal', 'Internal') },
    { value: 'Legal', label: t('regulations.types.legal', 'Legal') },
    { value: 'Other', label: t('regulations.types.other', 'Other') }
  ];

  // Format date for input field
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? '' : format(date, 'yyyy-MM-dd');
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto p-1">
      <FormField label={t('regulations.titleEn', 'Title (English)')} error={formErrors.title_en} required>
        <Input
          value={formData.title_en || ''}
          onChange={(e) => updateField('title_en', e.target.value)}
        />
      </FormField>

      <FormField label={t('regulations.titleHe', 'Title (Hebrew)')} error={formErrors.title_he} required>
        <Input
          value={formData.title_he || ''}
          onChange={(e) => updateField('title_he', e.target.value)}
        />
      </FormField>

      <FormField 
        label={t('regulations.descriptionEn', 'Description (English)')} 
        error={formErrors.description_en}
        className="md:col-span-2"
      >
        <Textarea
          value={formData.description_en || ''}
          onChange={(e) => updateField('description_en', e.target.value)}
          rows={3}
        />
      </FormField>

      <FormField 
        label={t('regulations.descriptionHe', 'Description (Hebrew)')} 
        error={formErrors.description_he}
        className="md:col-span-2"
      >
        <Textarea
          value={formData.description_he || ''}
          onChange={(e) => updateField('description_he', e.target.value)}
          rows={3}
        />
      </FormField>

      <SelectField
        id="regulation_type"
        label={t('regulations.type', 'Type')}
        value={formData.regulation_type || ''}
        onChange={(val) => updateField('regulation_type', val)}
        options={regulationTypeOptions}
        error={formErrors.regulation_type}
        required
        isRTL={isRTL}
      />

      <FormField label={t('regulations.isActive', 'Is Active')} className="flex flex-row items-center space-x-2">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active !== false}
          onChange={(e) => updateField('is_active', e.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="is_active" className="text-sm">
          {t('regulations.isActiveLabel', 'Regulation is currently active')}
        </label>
      </FormField>

      <FormField label={t('regulations.effectiveDate', 'Effective Date')} error={formErrors.effective_date} required>
        <Input
          type="date"
          value={formatDate(formData.effective_date)}
          onChange={(e) => updateField('effective_date', e.target.value)}
        />
      </FormField>

      <FormField label={t('regulations.endDate', 'End Date (if applicable)')} error={formErrors.end_date}>
        <Input
          type="date"
          value={formatDate(formData.end_date)}
          onChange={(e) => updateField('end_date', e.target.value)}
        />
      </FormField>

      <FormField label={t('regulations.documentUrl', 'Document URL')} error={formErrors.document_url}>
        <Input
          type="url"
          value={formData.document_url || ''}
          onChange={(e) => updateField('document_url', e.target.value)}
          placeholder="https://..."
        />
      </FormField>

      <FormField 
        label={t('regulations.tags', 'Tags')} 
        error={formErrors.tags}
        className="md:col-span-2"
      >
        <TagInput
          tags={formData.tags || []}
          onTagsChange={(newTags) => updateField('tags', newTags)}
          placeholder={t('common.addTagPlaceholder', 'Add tag...')}
        />
      </FormField>
    </div>
  );
}