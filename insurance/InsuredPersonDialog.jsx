import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DatePicker from '@/components/ui/date-picker';
import FormField from '@/components/forms/FormField';
import AddressSelector from '@/components/address-management/AddressSelector'; // Import AddressSelector
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from '@/components/ui/use-toast';
import { isValidEmail, isValidPhoneNumber } from '@/components/utils/validation';

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

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  const translatedGenderOptions = useMemo(() => genderOptions.map(opt => ({...opt, label: t(opt.labelKey, {defaultValue: opt.defaultLabel})})), [t]);
  const translatedIdTypeOptions = useMemo(() => idTypeOptions.map(opt => ({...opt, label: t(opt.labelKey, {defaultValue: opt.defaultLabel})})), [t]);

  useEffect(() => {
    if (personData) {
      setFormData({
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
      setFormData(initialFormData);
    }
    setErrors({});
  }, [personData, isOpen, initialFormData]);

  const validate = () => {
    const newErrors = {};
    if (!formData.full_name) newErrors.full_name = t('validation.requiredField', { field: t('fields.fullName')});
    if (!formData.identification.type) newErrors.id_type = t('validation.requiredField', { field: t('identification.type')});
    if (!formData.identification.number) newErrors.id_number = t('validation.requiredField', { field: t('identification.number')});
    if (formData.contact?.email && !isValidEmail(formData.contact.email)) newErrors.email = t('validation.invalidFormat', {field: t('common.email')});
    if (formData.contact?.phone && !isValidPhoneNumber(formData.contact.phone)) newErrors.phone = t('validation.invalidFormat', {field: t('common.phone')});
    // DOB might be optional depending on requirements
    // Gender might be optional
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const submissionData = {
        ...formData,
        date_of_birth: formData.date_of_birth ? formData.date_of_birth.toISOString().split('T')[0] : null, // Format for DB
      };
      // If address_id is present, remove legacy address object
      if (submissionData.address_id) {
          delete submissionData.address;
      } else if (!Object.values(submissionData.address).some(val => val && val.trim() !== '')) {
          // If address_id is null AND legacy address fields are all empty, send null for address
          delete submissionData.address;
      }
      onSubmit(submissionData);
    }
  };
  
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (mainField, subField, value) => {
    setFormData(prev => ({
      ...prev,
      [mainField]: {
        ...prev[mainField],
        [subField]: value
      }
    }));
  };

  const handleAddressSelected = (newAddressId) => {
    setFormData(prev => ({ ...prev, address_id: newAddressId, address: initialFormData.address })); // Clear legacy fields
  };
  
  const handleClearAddress = () => {
    setFormData(prev => ({ ...prev, address_id: null }));
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {personData?.id ? t('insuredPersons.editPerson', { defaultValue: 'Edit Insured Person' }) : t('insuredPersons.addPerson', { defaultValue: 'Add New Insured Person' })}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4 px-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <FormField label={t('fields.fullName', {defaultValue: "Full Name"})} error={errors.full_name} htmlFor="full_name">
              <Input id="full_name" value={formData.full_name} onChange={(e) => handleChange('full_name', e.target.value)} />
            </FormField>
            <FormField label={t('common.dateOfBirthOptional', {defaultValue: "Date of Birth (Optional)"})} error={errors.date_of_birth} htmlFor="date_of_birth">
                <DatePicker
                    selected={formData.date_of_birth}
                    onSelect={(date) => handleChange('date_of_birth', date)}
                    className="w-full"
                    placeholderText={t('common.selectDatePlaceholder', { defaultValue: 'Select a date' })}
                />
            </FormField>
            <FormField label={t('common.genderOptional', {defaultValue: "Gender (Optional)"})} error={errors.gender} htmlFor="gender">
              <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
                <SelectTrigger id="gender"><SelectValue placeholder={t('filters.selectGender', { defaultValue: 'Select Gender' })} /></SelectTrigger>
                <SelectContent>{translatedGenderOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label={t('common.phoneOptional', {defaultValue: "Phone (Optional)"})} error={errors.phone} htmlFor="phone">
              <Input id="phone" value={formData.contact.phone} onChange={(e) => handleNestedChange('contact', 'phone', e.target.value)} />
            </FormField>
            <FormField label={t('common.emailOptional', {defaultValue: "Email (Optional)"})} error={errors.email} htmlFor="email">
              <Input id="email" type="email" value={formData.contact.email} onChange={(e) => handleNestedChange('contact', 'email', e.target.value)} />
            </FormField>
          </div>

          <fieldset className="border p-4 rounded-md mt-4">
            <legend className="text-sm font-medium px-1">{t('insuredPersons.identification', {defaultValue: "Identification"})}</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-2">
                <FormField label={t('identification.type', {defaultValue: "ID Type"})} error={errors.id_type} htmlFor="id_type">
                  <Select value={formData.identification.type} onValueChange={(value) => handleNestedChange('identification', 'type', value)}>
                    <SelectTrigger id="id_type"><SelectValue placeholder={t('filters.selectIdType', { defaultValue: 'Select ID Type' })} /></SelectTrigger>
                    <SelectContent>{translatedIdTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                  </Select>
                </FormField>
                <FormField label={t('identification.number', {defaultValue: "ID Number"})} error={errors.id_number} htmlFor="id_number">
                  <Input id="id_number" value={formData.identification.number} onChange={(e) => handleNestedChange('identification', 'number', e.target.value)} />
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
                            <Input id="legacy_street_name" value={formData.address.street_name} onChange={(e) => handleNestedChange('address', 'street_name', e.target.value)} />
                        </FormField>
                        <FormField label={t('fields.streetNumberOptional', {defaultValue: "Street No. (Optional)"})} htmlFor="legacy_street_number">
                            <Input id="legacy_street_number" value={formData.address.street_number} onChange={(e) => handleNestedChange('address', 'street_number', e.target.value)} />
                        </FormField>
                        <FormField label={t('fields.cityOptional', {defaultValue: "City (Optional)"})} htmlFor="legacy_city">
                            <Input id="legacy_city" value={formData.address.city} onChange={(e) => handleNestedChange('address', 'city', e.target.value)} />
                        </FormField>
                        <FormField label={t('fields.postalCodeOptional', {defaultValue: "Postal Code (Optional)"})} htmlFor="legacy_postal_code">
                            <Input id="legacy_postal_code" value={formData.address.postal_code} onChange={(e) => handleNestedChange('address', 'postal_code', e.target.value)} />
                        </FormField>
                         <FormField label={t('fields.additionalInfoOptional', {defaultValue: "Additional Info (Optional)"})} htmlFor="legacy_additional_info" className="md:col-span-2">
                            <Input id="legacy_additional_info" value={formData.address.additional_info} onChange={(e) => handleNestedChange('address', 'additional_info', e.target.value)} />
                        </FormField>
                    </div>
                </div>
            )}
          </fieldset>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>
                {t('buttons.cancel', { defaultValue: 'Cancel' })}
              </Button>
            </DialogClose>
            <Button type="submit">
              {personData?.id ? t('buttons.saveChanges', { defaultValue: 'Save Changes' }) : t('buttons.create', { defaultValue: 'Create Person' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InsuredPersonDialog;