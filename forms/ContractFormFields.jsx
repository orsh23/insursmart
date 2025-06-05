import React from 'react';
import { useTranslation } from '@/components/utils/i18n';
import FormField from '@/components/shared/FormField';
import SelectField from '@/components/common/SelectField';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import TagInput from '@/components/common/TagInput';
import { format } from 'date-fns';

/**
 * Form fields for Contract entity
 * 
 * @param {Object} props Component props
 * @param {Object} props.formData Current form data
 * @param {Function} props.updateField Function to update a field
 * @param {Object} props.formErrors Validation errors
 * @param {boolean} props.isRTL Whether the UI is in RTL mode
 * @param {Array} props.providerOptions Provider options for dropdown
 */
export default function ContractFormFields({
  formData = {},
  updateField,
  formErrors = {},
  isRTL = false,
  providerOptions = []
}) {
  const { t } = useTranslation();

  const statusOptions = [
    { value: 'draft', label: t('contracts.statuses.draft', 'Draft') },
    { value: 'active', label: t('contracts.statuses.active', 'Active') },
    { value: 'expired', label: t('contracts.statuses.expired', 'Expired') },
    { value: 'terminated', label: t('contracts.statuses.terminated', 'Terminated') }
  ];

  const paymentMethodOptions = [
    { value: 'direct_deposit', label: t('contracts.paymentMethods.directDeposit', 'Direct Deposit') },
    { value: 'check', label: t('contracts.paymentMethods.check', 'Check') },
    { value: 'credit', label: t('contracts.paymentMethods.credit', 'Credit') }
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
      <SelectField
        id="provider_id"
        label={t('contracts.provider', 'Provider')}
        value={formData.provider_id || ''}
        onChange={(val) => updateField('provider_id', val)}
        options={providerOptions}
        error={formErrors.provider_id}
        required
        isRTL={isRTL}
        className="md:col-span-2"
      />

      <FormField label={t('contracts.contractNumber', 'Contract Number')} error={formErrors.contract_number} required>
        <Input
          value={formData.contract_number || ''}
          onChange={(e) => updateField('contract_number', e.target.value)}
          placeholder={t('contracts.contractNumberPlaceholder', 'e.g., CONT-2023-001')}
        />
      </FormField>

      <FormField label={t('contracts.nameEn', 'Name (English)')} error={formErrors.name_en} required>
        <Input
          value={formData.name_en || ''}
          onChange={(e) => updateField('name_en', e.target.value)}
        />
      </FormField>

      <FormField label={t('contracts.nameHe', 'Name (Hebrew)')} error={formErrors.name_he} required>
        <Input
          value={formData.name_he || ''}
          onChange={(e) => updateField('name_he', e.target.value)}
        />
      </FormField>

      <FormField label={t('contracts.validFrom', 'Valid From')} error={formErrors.valid_from} required>
        <Input
          type="date"
          value={formatDate(formData.valid_from)}
          onChange={(e) => updateField('valid_from', e.target.value)}
        />
      </FormField>

      <FormField label={t('contracts.validTo', 'Valid To')} error={formErrors.valid_to} required>
        <Input
          type="date"
          value={formatDate(formData.valid_to)}
          onChange={(e) => updateField('valid_to', e.target.value)}
        />
      </FormField>

      <SelectField
        id="status"
        label={t('common.status', 'Status')}
        value={formData.status || 'draft'}
        onChange={(val) => updateField('status', val)}
        options={statusOptions}
        error={formErrors.status}
        isRTL={isRTL}
      />

      <FormField label={t('contracts.paymentDays', 'Payment Days')} error={formErrors?.payment_terms?.payment_days}>
        <Input
          type="number"
          min="0"
          value={formData.payment_terms?.payment_days || ''}
          onChange={(e) => {
            const value = e.target.value ? parseInt(e.target.value, 10) : '';
            updateField('payment_terms', {
              ...formData.payment_terms,
              payment_days: value
            });
          }}
        />
      </FormField>

      <FormField label={t('contracts.requiresInvoice', 'Requires Invoice')} className="flex flex-row items-center space-x-2">
        <input
          type="checkbox"
          id="requires_invoice"
          checked={formData.payment_terms?.requires_invoice || false}
          onChange={(e) => {
            updateField('payment_terms', {
              ...formData.payment_terms,
              requires_invoice: e.target.checked
            });
          }}
          className="h-4 w-4"
        />
        <label htmlFor="requires_invoice" className="text-sm">
          {t('contracts.requiresInvoiceLabel', 'Requires invoice before payment')}
        </label>
      </FormField>

      <SelectField
        id="payment_method"
        label={t('contracts.paymentMethod', 'Payment Method')}
        value={formData.payment_terms?.payment_method || ''}
        onChange={(val) => {
          updateField('payment_terms', {
            ...formData.payment_terms,
            payment_method: val
          });
        }}
        options={paymentMethodOptions}
        error={formErrors?.payment_terms?.payment_method}
        isRTL={isRTL}
      />

      <FormField 
        label={t('contracts.specialConditions', 'Special Conditions')} 
        error={formErrors.special_conditions}
        className="md:col-span-2"
      >
        <TagInput
          tags={formData.special_conditions || []}
          onTagsChange={(newTags) => updateField('special_conditions', newTags)}
          placeholder={t('contracts.specialConditionsPlaceholder', 'Add special condition...')}
        />
      </FormField>
    </div>
  );
}