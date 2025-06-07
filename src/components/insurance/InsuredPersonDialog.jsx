
import React, { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DatePicker from '@/components/ui/date-picker';
import FormField from '@/components/shared/forms/FormField'; // Corrected path
import AddressSelector from '@/components/address-management/AddressSelector';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from '@/components/ui/use-toast';
import { isValidEmail, isValidPhoneNumber } from '@/components/utils/validation';
import BaseFormDialog from '@/components/shared/forms/BaseFormDialog';
// Corrected entity import - import individually from specific files
import { InsuredPerson } from '@/api/entities';

const genderOptions = [
  { value: 'male', labelKey: 'gender.male', defaultValue: 'Male' },
  { value: 'female', labelKey: 'gender.female', defaultValue: 'Female' },
  { value: 'other', labelKey: 'gender.other', defaultValue: 'Other' },
];

const idTypeOptions = [
  { value: 'national_id', labelKey: 'idType.national_id', defaultValue: 'National ID' },
  { value: 'insurance_number', labelKey: 'idType.insurance_number', defaultValue: 'Insurance No.' },
  { value: 'passport', labelKey: 'idType.passport', defaultValue: 'Passport' },
];

const InsuredPersonDialog = ({ isOpen, onClose, onSubmit, personData }) => {
  const { t } = useLanguageHook();
  const { toast } = useToast();

  const initialFormData = useMemo(() => ({
    full_name: '',
    date_of_birth: null,
    gender: '',
    contact: { phone: '', email: '' },
    address_id: null,
    address: { street_name: '', street_number: '', city: '', postal_code: '', additional_info: '' }, // Legacy
    identification: { type: '', number: '' },
  }), []);

  const { register, handleSubmit, setValue, watch, control, reset, formState: { errors } } = useForm({
    defaultValues: initialFormData,
  });

  const formData = watch(); // To easily access current form values for controlled components

  const translatedGenderOptions = useMemo(() => genderOptions.map(opt => ({...opt, label: t(opt.labelKey, {defaultValue: opt.defaultValue})})), [t]);
  const translatedIdTypeOptions = useMemo(() => idTypeOptions.map(opt => ({...opt, label: t(opt.labelKey, {defaultValue: opt.defaultValue})})), [t]);

  useEffect(() => {
    if (personData) {
      reset({
        full_name: personData.full_name || '',
        date_of_birth: personData.date_of_birth ? new Date(personData.date_of_birth) : null,
        gender: personData.gender || '',
        contact: {
          phone: personData.contact?.phone || '',
          email: personData.contact?.email || ''
        },
        address_id: personData.address_id || null,
        address: { // Keep legacy if no address_id or if present
            street_name: personData.address?.street_name || '',
            street_number: personData.address?.street_number || '',
            city: personData.address?.city || '',
            postal_code: personData.address?.postal_code || '',
            additional_info: personData.address?.additional_info || '',
        },
        identification: {
          type: personData.identification?.type || '',
          number: personData.identification?.number || ''
        },
      });
    } else {
      reset(initialFormData);
    }
  }, [personData, isOpen, initialFormData, reset]);

  const internalHandleSubmit = (data) => {
    const submissionData = {
      ...data,
      date_of_birth: data.date_of_birth ? data.date_of_birth.toISOString().split('T')[0] : null, // Format for DB
    };
    // If address_id is present, remove legacy address object
    if (submissionData.address_id) {
        delete submissionData.address;
    } else if (!Object.values(submissionData.address).some(val => val && val.trim() !== '')) {
        // If address_id is null AND legacy address fields are all empty, send null for address
        delete submissionData.address;
    }
    onSubmit(submissionData);
  };

  const handleAddressSelected = (newAddressId) => {
    setValue('address_id', newAddressId);
    setValue('address', initialFormData.address); // Clear legacy fields
  };

  const handleClearAddress = () => {
    setValue('address_id', null);
  };

  if (!isOpen) return null;

  return (
    <BaseFormDialog
      isOpen={isOpen}
      onClose={onClose}
      title={personData?.id ? t('insuredPersons.editPerson', { defaultValue: 'Edit Insured Person' }) : t('insuredPersons.addPerson', { defaultValue: 'Add New Insured Person' })}
      onSubmit={handleSubmit(internalHandleSubmit)}
      submitButtonText={personData?.id ? t('buttons.saveChanges', { defaultValue: 'Save Changes' }) : t('buttons.create', { defaultValue: 'Create Person' })}
      cancelButtonText={t('buttons.cancel', { defaultValue: 'Cancel' })}
      className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" // Apply to dialog content
    >
      <div className="space-y-6 py-4 px-1"> {/* This div acts as the form body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <FormField label={t('fields.fullName', {defaultValue: "Full Name"})} error={errors.full_name?.message} htmlFor="full_name">
            <Input id="full_name" {...register('full_name', { required: t('validation.requiredField', { field: t('fields.fullName')}) })} />
          </FormField>
          <FormField label={t('common.dateOfBirthOptional', {defaultValue: "Date of Birth (Optional)"})} error={errors.date_of_birth?.message} htmlFor="date_of_birth">
              <Controller
                  name="date_of_birth"
                  control={control}
                  render={({ field }) => (
                      <DatePicker
                          selected={field.value}
                          onSelect={field.onChange}
                          className="w-full"
                          placeholderText={t('common.selectDatePlaceholder', { defaultValue: 'Select a date' })}
                      />
                  )}
              />
          </FormField>
          <FormField label={t('common.genderOptional', {defaultValue: "Gender (Optional)"})} error={errors.gender?.message} htmlFor="gender">
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="gender"><SelectValue placeholder={t('filters.selectGender', { defaultValue: 'Select Gender' })} /></SelectTrigger>
                  <SelectContent>{translatedGenderOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                </Select>
              )}
            />
          </FormField>
          <FormField label={t('common.phoneOptional', {defaultValue: "Phone (Optional)"})} error={errors.contact?.phone?.message} htmlFor="phone">
            <Input
              id="phone"
              {...register('contact.phone', {
                validate: (value) => {
                  if (value && !isValidPhoneNumber(value)) {
                    return t('validation.invalidFormat', {field: t('common.phone')});
                  }
                  return true;
                }
              })}
            />
          </FormField>
          <FormField label={t('common.emailOptional', {defaultValue: "Email (Optional)"})} error={errors.contact?.email?.message} htmlFor="email">
            <Input
              id="email"
              type="email"
              {...register('contact.email', {
                validate: (value) => {
                  if (value && !isValidEmail(value)) {
                    return t('validation.invalidFormat', {field: t('common.email')});
                  }
                  return true;
                }
              })}
            />
          </FormField>
        </div>

        <fieldset className="border p-4 rounded-md mt-4">
          <legend className="text-sm font-medium px-1">{t('insuredPersons.identification', {defaultValue: "Identification"})}</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-2">
              <FormField label={t('identification.type', {defaultValue: "ID Type"})} error={errors.identification?.type?.message} htmlFor="id_type">
                <Controller
                  name="identification.type"
                  control={control}
                  rules={{ required: t('validation.requiredField', { field: t('identification.type')}) }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="id_type"><SelectValue placeholder={t('filters.selectIdType', { defaultValue: 'Select ID Type' })} /></SelectTrigger>
                      <SelectContent>{translatedIdTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                />
              </FormField>
              <FormField label={t('identification.number', {defaultValue: "ID Number"})} error={errors.identification?.number?.message} htmlFor="id_number">
                <Input
                  id="id_number"
                  {...register('identification.number', { required: t('validation.requiredField', { field: t('identification.number')}) })}
                />
              </FormField>
          </div>
        </fieldset>

        <fieldset className="border p-4 rounded-md mt-4">
          <legend className="text-sm font-medium px-1">{t('addresses.title', {defaultValue: "Address"})}</legend>
           <AddressSelector
              currentAddressId={formData.address_id}
              onAddressSelected={handleAddressSelected}
              onClearAddress={handleClearAddress}
              entityType={t('insuredPersons.entityNameSingular', {defaultValue: "Insured Person"})}
              t={t}
          />
           {/* Fallback for legacy address if address_id is not set */}
          {!formData.address_id && (
              <div className="mt-4 space-y-3 pt-3 border-t">
                  <p className="text-xs text-gray-500">{t('addresses.manualEntryNote', {defaultValue: "Or enter address manually (legacy):"})}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <FormField label={t('fields.streetNameOptional', {defaultValue: "Street Name (Optional)"})} htmlFor="legacy_street_name">
                          <Input id="legacy_street_name" {...register('address.street_name')} />
                      </FormField>
                      <FormField label={t('fields.streetNumberOptional', {defaultValue: "Street No. (Optional)"})} htmlFor="legacy_street_number">
                          <Input id="legacy_street_number" {...register('address.street_number')} />
                      </FormField>
                      <FormField label={t('fields.cityOptional', {defaultValue: "City (Optional)"})} htmlFor="legacy_city">
                          <Input id="legacy_city" {...register('address.city')} />
                      </FormField>
                      <FormField label={t('fields.postalCodeOptional', {defaultValue: "Postal Code (Optional)"})} htmlFor="legacy_postal_code">
                          <Input id="legacy_postal_code" {...register('address.postal_code')} />
                      </FormField>
                       <FormField label={t('fields.additionalInfoOptional', {defaultValue: "Additional Info (Optional)"})} htmlFor="legacy_additional_info" className="md:col-span-2">
                          <Input id="legacy_additional_info" {...register('address.additional_info')} />
                      </FormField>
                  </div>
              </div>
          )}
        </fieldset>
      </div>
    </BaseFormDialog>
  );
};

export default InsuredPersonDialog;
