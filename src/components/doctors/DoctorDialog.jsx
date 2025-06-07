
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import FormField from '@/components/shared/forms/FormField'; // Corrected import path
import BilingualInput from '@/components/forms/BilingualInput';
import TagInput from '@/components/shared/TagInput';
import AddressSelector from '@/components/address-management/AddressSelector'; // Import AddressSelector
import { STATUS_OPTIONS } from '@/components/utils/options';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from '@/components/ui/use-toast';
import { isValidEmail, isValidPhoneNumber } from '@/components/utils/validation'; // Assuming these exist

const DoctorDialog = ({ isOpen, onClose, onSubmit, doctor, allCities = [] }) => {
  const { t } = useLanguageHook();
  const { toast } = useToast(); // Added toast

  const [formData, setFormData] = useState({
    first_name_en: '', last_name_en: '',
    first_name_he: '', last_name_he: '',
    license_number: '',
    specialties: [],
    sub_specialties: [],
    phone: '', email: '',
    address_id: null, // New field for structured address
    // city: '', // Legacy field, will be deprecated
    // address: '', // Legacy field, will be deprecated
    status: 'active',
    tags: [],
    notes: '',
  });
  const [errors, setErrors] = useState({});

  const statusOptions = useMemo(() => STATUS_OPTIONS.map(opt => ({...opt, label: t(opt.labelKey, {defaultValue: opt.defaultLabel})})), [t]);

  useEffect(() => {
    if (doctor) {
      setFormData({
        first_name_en: doctor.first_name_en || '',
        last_name_en: doctor.last_name_en || '',
        first_name_he: doctor.first_name_he || '',
        last_name_he: doctor.last_name_he || '',
        license_number: doctor.license_number || '',
        specialties: Array.isArray(doctor.specialties) ? doctor.specialties : [],
        sub_specialties: Array.isArray(doctor.sub_specialties) ? doctor.sub_specialties : [],
        phone: doctor.phone || '',
        email: doctor.email || '',
        address_id: doctor.address_id || null, // Populate address_id
        // city: doctor.city || '', // Legacy
        // address: doctor.address || '', // Legacy
        status: doctor.status || 'active',
        tags: Array.isArray(doctor.tags) ? doctor.tags : [],
        notes: doctor.notes || '',
      });
    } else {
      setFormData({
        first_name_en: '', last_name_en: '',
        first_name_he: '', last_name_he: '',
        license_number: '',
        specialties: [], sub_specialties: [],
        phone: '', email: '',
        address_id: null, // Initialize address_id
        // city: '', address: '', // Legacy
        status: 'active',
        tags: [], notes: '',
      });
    }
    setErrors({});
  }, [doctor, isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!formData.first_name_en) newErrors.first_name_en = t('validation.requiredField', { field: t('fields.firstNameEn')});
    if (!formData.last_name_en) newErrors.last_name_en = t('validation.requiredField', { field: t('fields.lastNameEn')});
    if (!formData.first_name_he) newErrors.first_name_he = t('validation.requiredField', { field: t('fields.firstNameHe')});
    if (!formData.last_name_he) newErrors.last_name_he = t('validation.requiredField', { field: t('fields.lastNameHe')});
    if (!formData.license_number) newErrors.license_number = t('validation.requiredField', { field: t('fields.licenseNumber')});
    if (formData.specialties.length === 0) newErrors.specialties = t('validation.requiredField', { field: t('fields.specialties')});
    if (!formData.phone) newErrors.phone = t('validation.requiredField', { field: t('fields.phone')});
    else if (!isValidPhoneNumber(formData.phone)) newErrors.phone = t('validation.invalidFormat', {field: t('fields.phone')});
    if (!formData.email) newErrors.email = t('validation.requiredField', { field: t('fields.email')});
    else if (!isValidEmail(formData.email)) newErrors.email = t('validation.invalidFormat', {field: t('fields.email')});
    // No specific validation for address_id here, handled by AddressSelector or optionality

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // Prepare data for submission: remove legacy address fields if address_id is set
      const submissionData = { ...formData };
      if (submissionData.address_id) {
        delete submissionData.city;
        delete submissionData.address;
      }
      onSubmit(submissionData);
    }
  };

  const handleBilingualChange = (baseField, lang, value) => {
     setFormData(prev => ({ ...prev, [`${baseField}_${lang}`]: value }));
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSpecialtiesChange = (newSpecialties) => {
    setFormData(prev => ({ ...prev, specialties: newSpecialties }));
  };

  const handleSubSpecialtiesChange = (newSubSpecialties) => {
    setFormData(prev => ({ ...prev, sub_specialties: newSubSpecialties }));
  };
  
  const handleTagsChange = (newTags) => {
    setFormData(prev => ({ ...prev, tags: newTags }));
  };
  
  const handleAddressSelected = (newAddressId) => {
    setFormData(prev => ({ ...prev, address_id: newAddressId, city: '', address: '' })); // Clear legacy fields
  };
  
  const handleClearAddress = () => {
    setFormData(prev => ({ ...prev, address_id: null }));
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {doctor?.id ? t('doctors.editDoctor', { defaultValue: 'Edit Doctor' }) : t('doctors.addDoctor', { defaultValue: 'Add New Doctor' })}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4 px-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <BilingualInput
              labelEn={t('fields.firstNameEn', {defaultValue: "First Name (EN)"})}
              labelHe={t('fields.firstNameHe', {defaultValue: "First Name (HE)"})}
              valueEn={formData.first_name_en}
              valueHe={formData.first_name_he}
              onChangeEn={(val) => handleBilingualChange("first_name", "en", val)}
              onChangeHe={(val) => handleBilingualChange("first_name", "he", val)}
              fieldId="doctor_first_name"
              errorEn={errors.first_name_en}
              errorHe={errors.first_name_he}
            />
            <BilingualInput
              labelEn={t('fields.lastNameEn', {defaultValue: "Last Name (EN)"})}
              labelHe={t('fields.lastNameHe', {defaultValue: "Last Name (HE)"})}
              valueEn={formData.last_name_en}
              valueHe={formData.last_name_he}
              onChangeEn={(val) => handleBilingualChange("last_name", "en", val)}
              onChangeHe={(val) => handleBilingualChange("last_name", "he", val)}
              fieldId="doctor_last_name"
              errorEn={errors.last_name_en}
              errorHe={errors.last_name_he}
            />
            <FormField label={t('fields.licenseNumber', {defaultValue: "License Number"})} error={errors.license_number} htmlFor="license_number">
              <Input id="license_number" name="license_number" value={formData.license_number} onChange={handleChange} />
            </FormField>
            <FormField label={t('fields.status', {defaultValue: "Status"})} error={errors.status} htmlFor="status">
               <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger id="status"><SelectValue placeholder={t('common.selectStatusPlaceholder', {defaultValue: "Select status"})} /></SelectTrigger>
                <SelectContent>{statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
             <FormField label={t('fields.phone', {defaultValue: "Phone"})} error={errors.phone} htmlFor="phone">
              <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
            </FormField>
            <FormField label={t('fields.email', {defaultValue: "Email"})} error={errors.email} htmlFor="email">
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
            </FormField>
          </div>

          <FormField label={t('fields.specialties', {defaultValue: "Specialties (comma-separated)"})} error={errors.specialties} htmlFor="specialties">
            <TagInput
              id="specialties"
              tags={formData.specialties}
              onTagsChange={handleSpecialtiesChange}
              placeholder={t('doctors.enterSpecialtiesPlaceholder', { defaultValue: 'Enter specialties and press Enter...' })}
            />
          </FormField>
          <FormField label={t('fields.subSpecialtiesOptional', {defaultValue: "Sub-Specialties (Optional, comma-separated)"})} error={errors.sub_specialties} htmlFor="sub_specialties">
             <TagInput
              id="sub_specialties"
              tags={formData.sub_specialties}
              onTagsChange={handleSubSpecialtiesChange}
              placeholder={t('doctors.enterSubSpecialtiesPlaceholder', { defaultValue: 'Enter sub-specialties and press Enter...' })}
            />
          </FormField>
          
          {/* Address Selector Integration */}
          <fieldset className="border p-4 rounded-md mt-4">
            <legend className="text-sm font-medium px-1">{t('addresses.title', {defaultValue: "Address"})}</legend>
             <AddressSelector
                currentAddressId={formData.address_id}
                onAddressSelected={handleAddressSelected}
                onClearAddress={handleClearAddress}
                entityType={t('doctors.entityNameSingular', {defaultValue: "Doctor"})}
                t={t} // Pass translation function
            />
          </fieldset>

          {/* Legacy Address Fields - Conditionally render if no structured address_id */}
          {/* {!formData.address_id && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormField label={t('fields.cityLegacyOptional', {defaultValue: "City (Legacy, Optional)"})} error={errors.city} htmlFor="city_legacy">
                <Input id="city_legacy" name="city" value={formData.city} onChange={handleChange} />
              </FormField>
              <FormField label={t('fields.addressLegacyOptional', {defaultValue: "Address (Legacy, Optional)"})} error={errors.address} htmlFor="address_legacy" className="md:col-span-2">
                <Textarea id="address_legacy" name="address" value={formData.address} onChange={handleChange} rows={2}/>
              </FormField>
            </div>
          )} */}

          <FormField label={t('fields.tagsOptional', {defaultValue: "Tags (Optional, comma-separated)"})} error={errors.tags} htmlFor="tags">
            <TagInput
              id="tags"
              tags={formData.tags}
              onTagsChange={handleTagsChange}
              placeholder={t('doctors.enterTagsPlaceholder', { defaultValue: 'Enter tags and press Enter...' })}
            />
          </FormField>
          <FormField label={t('fields.notesOptional', {defaultValue: "Notes (Optional)"})} error={errors.notes} htmlFor="notes">
            <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} />
          </FormField>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>
                {t('buttons.cancel', { defaultValue: 'Cancel' })}
              </Button>
            </DialogClose>
            <Button type="submit">
              {doctor?.id ? t('buttons.saveChanges', { defaultValue: 'Save Changes' }) : t('buttons.create', { defaultValue: 'Create Doctor' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DoctorDialog;
