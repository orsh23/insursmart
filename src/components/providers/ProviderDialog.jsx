
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
// Corrected FormField import path
import FormField from '@/components/shared/forms/FormField';
import BilingualInput from '@/components/forms/BilingualInput';
import AddressSelector from '@/components/address-management/AddressSelector';
import { PROVIDER_TYPES, LEGAL_ENTITY_TYPES, STATUS_OPTIONS } from '@/components/utils/options';
import { validateProviderIdentifier } from '@/components/utils/validation-rules';
import { useLanguageHook } from '@/components/useLanguageHook';

const ProviderDialog = ({ isOpen, onClose, onSubmit, provider, allCities = [] }) => {
  const { t } = useLanguageHook();
  const [formData, setFormData] = useState({
    name: { en: '', he: '' },
    provider_type: '',
    legal: { type: '', identifier: '' },
    address_id: null, // New field
    // contact: { // Legacy contact fields - might be deprecated or used if no address_id
    //   contact_person_name: '',
    //   street_name: '', street_number: '', city: '', postal_code: '', address: '',
    //   phone: '', email: '',
    // },
    status: 'active',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  const providerTypeOptions = useMemo(() => PROVIDER_TYPES.map(opt => ({...opt, label: t(opt.labelKey, {defaultValue: opt.defaultLabel})})), [t]);
  const legalTypeOptions = useMemo(() => LEGAL_ENTITY_TYPES.map(opt => ({...opt, label: t(opt.labelKey, {defaultValue: opt.defaultLabel})})), [t]);
  const statusOptions = useMemo(() => STATUS_OPTIONS.map(opt => ({...opt, label: t(opt.labelKey, {defaultValue: opt.defaultLabel})})), [t]);

  useEffect(() => {
    if (provider) {
      setFormData({
        name: { en: provider.name?.en || '', he: provider.name?.he || '' },
        provider_type: provider.provider_type || '',
        legal: { 
          type: provider.legal?.type || '', 
          identifier: provider.legal?.identifier || '' 
        },
        address_id: provider.address_id || null, // Load address_id
        // contact: { // Populate legacy if needed, or clear if address_id is primary
        //   contact_person_name: provider.contact?.contact_person_name || '',
        //   // ... other legacy contact fields
        //   phone: provider.contact?.phone || '',
        //   email: provider.contact?.email || '',
        // },
        status: provider.status || 'active',
        notes: provider.notes || '',
      });
    } else {
      setFormData({
        name: { en: '', he: '' },
        provider_type: '',
        legal: { type: '', identifier: '' },
        address_id: null,
        // contact: { contact_person_name: '', phone: '', email: '' /* other fields */ },
        status: 'active',
        notes: '',
      });
    }
    setErrors({});
  }, [provider, isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.en) newErrors.name_en = t('validation.requiredField', { field: t('fields.nameEn', {defaultValue: 'Name (English)'})});
    if (!formData.name.he) newErrors.name_he = t('validation.requiredField', { field: t('fields.nameHe', {defaultValue: 'Name (Hebrew)'})});
    if (!formData.provider_type) newErrors.provider_type = t('validation.requiredField', { field: t('fields.provider_type', {defaultValue: 'Provider Type'})});
    if (!formData.legal.type) newErrors.legal_type = t('validation.requiredField', { field: t('fields.legalType', {defaultValue: 'Legal Type'})});
    if (!formData.legal.identifier) {
        newErrors.legal_identifier = t('validation.requiredField', { field: t('fields.legalIdentifier', {defaultValue: 'Legal Identifier'})});
    } else if (!validateProviderIdentifier(formData.legal.identifier)) {
        newErrors.legal_identifier = t('validation.invalidFormat', { field: t('fields.legalIdentifier', {defaultValue: 'Legal Identifier'})});
    }
    // No validation for address_id itself, as it's optional or handled by AddressSelector
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // Remove empty legacy contact details if address_id is present
      // const finalFormData = { ...formData };
      // if (finalFormData.address_id && finalFormData.contact) {
      //   delete finalFormData.contact; // Or selectively clear its fields
      // }
      onSubmit(formData); // Submit the main form data including address_id
    }
  };
  
  const handleBilingualChange = (field, lang, value) => {
     if (field.startsWith('name.')) {
        setFormData(prev => ({ ...prev, name: {...prev.name, [lang]: value }}));
     }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('legal.')) {
      const legalField = name.split('.')[1];
      setFormData(prev => ({ ...prev, legal: { ...prev.legal, [legalField]: value } }));
    // } else if (name.startsWith('contact.')) {
    //   const contactField = name.split('.')[1];
    //   setFormData(prev => ({ ...prev, contact: { ...prev.contact, [contactField]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleAddressSelected = (newAddressId) => {
    setFormData(prev => ({ ...prev, address_id: newAddressId }));
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
            {provider?.id ? t('providers.editProvider', { defaultValue: 'Edit Provider' }) : t('providers.addProvider', { defaultValue: 'Add New Provider' })}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4 px-1">
          <BilingualInput
            labelEn={t('fields.providerNameEn', {defaultValue: "Provider Name (EN)"})}
            labelHe={t('fields.providerNameHe', {defaultValue: "Provider Name (HE)"})}
            valueEn={formData.name.en}
            valueHe={formData.name.he}
            onChangeEn={(val) => handleBilingualChange("name", "en", val)}
            onChangeHe={(val) => handleBilingualChange("name", "he", val)}
            fieldId="provider_name"
            errorEn={errors.name_en}
            errorHe={errors.name_he}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t('fields.provider_type', {defaultValue: "Provider Type"})} error={errors.provider_type} htmlFor="provider_type">
              <Select value={formData.provider_type} onValueChange={(value) => setFormData(prev => ({ ...prev, provider_type: value }))}>
                <SelectTrigger id="provider_type"><SelectValue placeholder={t('providers.selectTypePlaceholder', {defaultValue: "Select type"})} /></SelectTrigger>
                <SelectContent>{providerTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label={t('fields.status', {defaultValue: "Status"})} error={errors.status} htmlFor="status">
               <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger id="status"><SelectValue placeholder={t('common.selectStatusPlaceholder', {defaultValue: "Select status"})} /></SelectTrigger>
                <SelectContent>{statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
          </div>

          <fieldset className="border p-4 rounded-md">
            <legend className="text-sm font-medium px-1">{t('providers.legalInformation', {defaultValue: "Legal Information"})}</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <FormField label={t('fields.legalType', {defaultValue: "Legal Type"})} error={errors.legal_type} htmlFor="legal_type">
                  <Select name="legal.type" value={formData.legal.type} onValueChange={(value) => setFormData(prev => ({ ...prev, legal: {...prev.legal, type: value} }))}>
                    <SelectTrigger id="legal_type"><SelectValue placeholder={t('providers.selectLegalTypePlaceholder', {defaultValue: "Select legal type"})} /></SelectTrigger>
                    <SelectContent>{legalTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                  </Select>
                </FormField>
                <FormField label={t('fields.legalIdentifier', {defaultValue: "Legal Identifier"})} error={errors.legal_identifier} htmlFor="legal_identifier">
                  <Input id="legal_identifier" name="legal.identifier" value={formData.legal.identifier} onChange={handleChange} placeholder="e.g. 123456789"/>
                </FormField>
            </div>
          </fieldset>
          
          {/* Address Selector Integration */}
          <fieldset className="border p-4 rounded-md">
            <legend className="text-sm font-medium px-1">{t('addresses.title', {defaultValue: "Address"})}</legend>
             <AddressSelector
                currentAddressId={formData.address_id}
                onAddressSelected={handleAddressSelected}
                onClearAddress={handleClearAddress}
                entityType={t('providers.entityNameSingular', {defaultValue: "Provider"})}
                t={t} // Pass translation function
            />
          </fieldset>
          
          {/* Legacy Contact Info - Conditionally render or remove based on strategy */}
          {/* {!formData.address_id && (
            <fieldset className="border p-4 rounded-md">
              <legend className="text-sm font-medium px-1">{t('providers.contactInformationOptional', {defaultValue: "Contact Information (if no structured address)"})}</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <FormField label={t('fields.contactPersonNameOptional', {defaultValue: "Contact Person (Optional)"})} htmlFor="contact_person_name">
                  <Input id="contact_person_name" name="contact.contact_person_name" value={formData.contact.contact_person_name} onChange={handleChange} />
                </FormField>
                <FormField label={t('fields.phoneOptional', {defaultValue: "Phone (Optional)"})} htmlFor="contact_phone">
                  <Input id="contact_phone" name="contact.phone" type="tel" value={formData.contact.phone} onChange={handleChange} />
                </FormField>
                <FormField label={t('fields.emailOptional', {defaultValue: "Email (Optional)"})} htmlFor="contact_email" className="md:col-span-2">
                  <Input id="contact_email" name="contact.email" type="email" value={formData.contact.email} onChange={handleChange} />
                </FormField>
              </div>
            </fieldset>
          )} */}

          <FormField label={t('fields.notesOptional', {defaultValue: "Notes (Optional)"})} htmlFor="notes">
            <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} />
          </FormField>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>
                {t('buttons.cancel', { defaultValue: 'Cancel' })}
              </Button>
            </DialogClose>
            <Button type="submit">
              {provider?.id ? t('buttons.saveChanges', { defaultValue: 'Save Changes' }) : t('buttons.create', { defaultValue: 'Create Provider' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProviderDialog;
