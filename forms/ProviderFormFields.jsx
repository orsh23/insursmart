import React from 'react';
import { useLanguage } from '@/components/context/LanguageContext';
import FormField from '@/components/shared/FormField';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import SelectField from '@/components/common/SelectField';
import BilingualInput from '@/components/forms/BilingualInput';

export default function ProviderFormFields({
  formData = {},
  formErrors = {},
  updateField,
  updateNestedField,
  isRTL
}) {
  const { t } = useLanguage();
  
  const providerTypes = [
    { value: 'hospital', label: t('providers.types.hospital') },
    { value: 'clinic', label: t('providers.types.clinic') },
    { value: 'imaging_center', label: t('providers.types.imaging_center') },
    { value: 'laboratory', label: t('providers.types.laboratory') },
    { value: 'other', label: t('providers.types.other') },
  ];
  
  const legalTypes = [
    { value: 'company', label: t('providers.legalTypes.company') },
    { value: 'licensed_dealer', label: t('providers.legalTypes.licensed_dealer') },
    { value: 'registered_association', label: t('providers.legalTypes.registered_association') },
  ];
  
  const statusOptions = [
    { value: 'active', label: t('common.active') },
    { value: 'inactive', label: t('common.inactive') },
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="col-span-1 md:col-span-2">
        <BilingualInput
          labelEn={t('providers.name')}
          labelHe={t('providers.nameHe')}
          valueEn={formData.name?.en || ''}
          valueHe={formData.name?.he || ''}
          onChangeEn={(val) => updateNestedField('name', 'en', val)}
          onChangeHe={(val) => updateNestedField('name', 'he', val)}
          error={formErrors.name?.en || formErrors.name?.he}
          required
          isRTL={isRTL}
        />
      </div>
      
      <div className="col-span-1">
        <FormField
          label={t('providers.providerType')}
          error={formErrors.provider_type}
          required
        >
          <SelectField
            value={formData.provider_type || ''}
            onChange={(val) => updateField('provider_type', val)}
            options={providerTypes}
            placeholder={t('providers.selectType')}
          />
        </FormField>
      </div>
      
      <div className="col-span-1">
        <FormField
          label={t('providers.status')}
          error={formErrors.status}
        >
          <SelectField
            value={formData.status || 'active'}
            onChange={(val) => updateField('status', val)}
            options={statusOptions}
          />
        </FormField>
      </div>
      
      <div className="col-span-1 md:col-span-2 border-t pt-4 mt-2">
        <h3 className="font-medium mb-2">{t('providers.legalInfo')}</h3>
      </div>
      
      <div className="col-span-1">
        <FormField
          label={t('providers.legalType')}
          error={formErrors.legal?.type}
          required
        >
          <SelectField
            value={formData.legal?.type || ''}
            onChange={(val) => updateNestedField('legal', 'type', val)}
            options={legalTypes}
            placeholder={t('providers.selectLegalType')}
          />
        </FormField>
      </div>
      
      <div className="col-span-1">
        <FormField
          label={t('providers.identifier')}
          error={formErrors.legal?.identifier}
          required
        >
          <Input
            value={formData.legal?.identifier || ''}
            onChange={(e) => updateNestedField('legal', 'identifier', e.target.value)}
            placeholder={t('providers.enterIdentifier')}
          />
        </FormField>
      </div>
      
      <div className="col-span-1 md:col-span-2 border-t pt-4 mt-2">
        <h3 className="font-medium mb-2">{t('providers.contactInfo')}</h3>
      </div>
      
      <div className="col-span-1 md:col-span-2">
        <FormField
          label={t('providers.address')}
          error={formErrors.contact?.address}
          required
        >
          <Input
            value={formData.contact?.address || ''}
            onChange={(e) => updateNestedField('contact', 'address', e.target.value)}
            placeholder={t('providers.enterAddress')}
          />
        </FormField>
      </div>
      
      <div className="col-span-1">
        <FormField
          label={t('providers.city')}
          error={formErrors.contact?.city}
          required
        >
          <Input
            value={formData.contact?.city || ''}
            onChange={(e) => updateNestedField('contact', 'city', e.target.value)}
            placeholder={t('providers.enterCity')}
          />
        </FormField>
      </div>
      
      <div className="col-span-1">
        <FormField
          label={t('providers.postalCode')}
          error={formErrors.contact?.postal_code}
        >
          <Input
            value={formData.contact?.postal_code || ''}
            onChange={(e) => updateNestedField('contact', 'postal_code', e.target.value)}
            placeholder={t('providers.enterPostalCode')}
          />
        </FormField>
      </div>
      
      <div className="col-span-1">
        <FormField
          label={t('providers.phone')}
          error={formErrors.contact?.phone}
        >
          <Input
            value={formData.contact?.phone || ''}
            onChange={(e) => updateNestedField('contact', 'phone', e.target.value)}
            placeholder={t('providers.enterPhone')}
          />
        </FormField>
      </div>
      
      <div className="col-span-1">
        <FormField
          label={t('providers.email')}
          error={formErrors.contact?.email}
        >
          <Input
            type="email"
            value={formData.contact?.email || ''}
            onChange={(e) => updateNestedField('contact', 'email', e.target.value)}
            placeholder={t('providers.enterEmail')}
          />
        </FormField>
      </div>
      
      <div className="col-span-1 md:col-span-2">
        <FormField
          label={t('providers.notes')}
          error={formErrors.notes}
        >
          <Textarea
            value={formData.notes || ''}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder={t('providers.enterNotes')}
            rows={4}
          />
        </FormField>
      </div>
    </div>
  );
}